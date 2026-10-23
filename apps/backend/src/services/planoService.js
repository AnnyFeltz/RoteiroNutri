const {
  sequelize, Paciente, PlanoAlimentar, Refeicao, RefeicaoAlimento, Substituto, Alimento,
} = require('../models');
const { totaisPlano } = require('@RoteiroNutri/shared');
const { buscarPacienteDoNutricionista } = require('../utils/acesso');
const { includePlanoCompleto, orderPlanoCompleto } = require('./planoIncludes');
const { notificar } = require('../sockets');
const AppError = require('../utils/AppError');

/**
 * RF10 / RF11 / RF12 / RN06 / RN07
 * Salvar o plano sempre cria uma NOVA VERSÃO (o histórico é preservado) e
 * desativa as anteriores, garantindo um único plano ativo por paciente.
 */
async function criarVersao(nutricionistaId, pacienteId, dados) {
  const paciente = await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  if (!paciente.ativo) throw new AppError('Reative o paciente antes de criar um plano alimentar', 422);

  // todos os alimentos precisam existir na tabela TACO
  const idsAlimentos = new Set();
  for (const r of dados.refeicoes) {
    for (const item of r.itens) {
      idsAlimentos.add(item.alimentoId);
      item.substitutos.forEach((s) => idsAlimentos.add(s.alimentoId));
    }
  }
  const encontrados = await Alimento.count({ where: { id: [...idsAlimentos] } });
  if (encontrados !== idsAlimentos.size) throw new AppError('Um ou mais alimentos não existem na tabela TACO', 422);

  const plano = await sequelize.transaction(async (transaction) => {
    const ultimaVersao = (await PlanoAlimentar.max('versao', { where: { pacienteId }, transaction })) || 0;
    await PlanoAlimentar.update({ ativo: false }, { where: { pacienteId, ativo: true }, transaction });

    const novo = await PlanoAlimentar.create(
      {
        pacienteId,
        nome: dados.nome,
        versao: ultimaVersao + 1,
        ativo: true,
        kcalAlvo: dados.kcalAlvo,
        pctCarbo: dados.pctCarbo,
        pctProteina: dados.pctProteina,
        pctGordura: dados.pctGordura,
      },
      { transaction }
    );

    for (const [ordemRefeicao, r] of dados.refeicoes.entries()) {
      const refeicao = await Refeicao.create(
        { planoId: novo.id, nome: r.nome, horario: r.horario, ordem: ordemRefeicao },
        { transaction }
      );
      for (const [ordemItem, item] of r.itens.entries()) {
        const criado = await RefeicaoAlimento.create(
          { refeicaoId: refeicao.id, alimentoId: item.alimentoId, gramas: item.gramas, ordem: ordemItem },
          { transaction }
        );
        if (item.substitutos.length) {
          await Substituto.bulkCreate(
            item.substitutos.map((s) => ({ refeicaoAlimentoId: criado.id, alimentoId: s.alimentoId, gramas: s.gramas })),
            { transaction }
          );
        }
      }
    }
    await Paciente.update({ ultimoPlanoId: novo.id }, { where: { id: pacienteId }, transaction });
    return novo;
  });

  notificar('paciente', pacienteId, 'plano:atualizado', { planoId: plano.id });
  return detalhar(nutricionistaId, plano.id);
}

async function detalhar(nutricionistaId, planoId) {
  const plano = await PlanoAlimentar.findOne({
    where: { id: planoId },
    include: [
      ...includePlanoCompleto,
      { model: Paciente, as: 'paciente', where: { nutricionistaId }, attributes: ['id', 'nome', 'idade', 'objetivo'] },
    ],
    order: orderPlanoCompleto,
  });
  if (!plano) throw new AppError('Plano alimentar não encontrado', 404);
  return plano;
}

// Histórico de versões do plano de um paciente
async function listarDoPaciente(nutricionistaId, pacienteId) {
  await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  const planos = await PlanoAlimentar.findAll({
    where: { pacienteId },
    include: includePlanoCompleto,
    order: [['versao', 'DESC'], ...orderPlanoCompleto],
  });
  return planos.map(resumir);
}

function resumir(plano) {
  const json = plano.toJSON();
  const totais = totaisPlano(json);
  const { refeicoes, ...resto } = json;
  return { ...resto, totalRefeicoes: refeicoes.length, kcalTotal: totais.kcal };
}

// RF14 - Painel global de planos dos pacientes ativos
async function painel(nutricionistaId) {
  const pacientes = await Paciente.findAll({
    where: { nutricionistaId, ativo: true },
    attributes: ['id', 'nome', 'idade', 'objetivo', 'avatarCor'],
    order: [['nome', 'ASC']],
  });
  const ids = pacientes.map((p) => p.id);
  const planos = ids.length
    ? await PlanoAlimentar.findAll({ where: { pacienteId: ids }, include: includePlanoCompleto, order: orderPlanoCompleto })
    : [];

  return pacientes.map((p) => {
    const doPaciente = planos.filter((pl) => pl.pacienteId === p.id);
    const ativo = doPaciente.find((pl) => pl.ativo);
    return {
      paciente: p,
      totalVersoes: doPaciente.length,
      planoAtivo: ativo ? resumir(ativo) : null,
    };
  });
}

module.exports = { criarVersao, detalhar, listarDoPaciente, painel };
