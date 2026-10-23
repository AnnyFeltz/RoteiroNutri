const { Op } = require('sequelize');
const {
  sequelize, Nutricionista, Paciente, PlanoAlimentar, Consulta, EvolucaoPeso,
} = require('../models');
const { gerarHash } = require('../utils/senha');
const { gerarSenhaProvisoria, corAvatarAleatoria } = require('../utils/aleatorio');
const { enviarEmail } = require('../utils/email');
const { hoje } = require('../utils/datas');
const { buscarPacienteDoNutricionista } = require('../utils/acesso');
const { includePlanoCompleto, orderPlanoCompleto } = require('./planoIncludes');
const { notificar } = require('../sockets');
const AppError = require('../utils/AppError');

/** E-mail é a credencial de login: não pode repetir entre pacientes nem nutricionistas. */
async function garantirEmailLivre(email, pacienteIdIgnorado = null) {
  const where = pacienteIdIgnorado ? { email, id: { [Op.ne]: pacienteIdIgnorado } } : { email };
  const [paciente, nutricionista] = await Promise.all([
    Paciente.findOne({ where, attributes: ['id'] }),
    Nutricionista.findOne({ where: { email }, attributes: ['id'] }),
  ]);
  if (paciente || nutricionista) throw new AppError('Este e-mail já está em uso por outro usuário', 409);
}

/** Próxima consulta, última consulta e status ("Novo" | tipo da próxima | "Retorno") por paciente. */
async function resumoConsultas(pacienteIds) {
  const resumo = Object.fromEntries(pacienteIds.map((id) => [id, { proximaConsulta: null, ultimaConsulta: null, totalConsultas: 0 }]));
  if (!pacienteIds.length) return resumo;
  const dataHoje = hoje();
  const consultas = await Consulta.findAll({
    where: { pacienteId: pacienteIds },
    attributes: ['id', 'pacienteId', 'data', 'horario', 'tipo'],
    order: [['data', 'ASC'], ['horario', 'ASC']],
  });
  for (const c of consultas) {
    const r = resumo[c.pacienteId];
    r.totalConsultas++;
    const dados = { id: c.id, data: c.data, horario: c.horario, tipo: c.tipo };
    if (c.data >= dataHoje) {
      if (!r.proximaConsulta) r.proximaConsulta = dados;
    } else {
      r.ultimaConsulta = dados;
    }
  }
  for (const r of Object.values(resumo)) {
    r.status = r.proximaConsulta ? r.proximaConsulta.tipo : r.totalConsultas ? 'Retorno' : 'Novo';
  }
  return resumo;
}

async function planosAtivosResumo(pacienteIds) {
  if (!pacienteIds.length) return {};
  const planos = await PlanoAlimentar.findAll({
    where: { pacienteId: pacienteIds, ativo: true },
    attributes: ['id', 'pacienteId', 'nome', 'versao', 'kcalAlvo', 'createdAt'],
  });
  return Object.fromEntries(planos.map((p) => [p.pacienteId, p.toJSON()]));
}

// RF07 - Visualizar pacientes
async function listar(nutricionistaId, { busca, status } = {}) {
  const where = { nutricionistaId };
  if (status === 'ativos') where.ativo = true;
  if (status === 'inativos') where.ativo = false;
  if (busca) {
    where[Op.or] = [{ nome: { [Op.iLike]: `%${busca}%` } }, { email: { [Op.iLike]: `%${busca}%` } }];
  }
  const pacientes = await Paciente.findAll({ where, order: [['nome', 'ASC']] });
  const ids = pacientes.map((p) => p.id);
  const [consultas, planos] = await Promise.all([resumoConsultas(ids), planosAtivosResumo(ids)]);
  return pacientes.map((p) => ({ ...p.toJSON(), ...consultas[p.id], planoAtivo: planos[p.id] || null }));
}

// RF04 / RN02 / RN08 - Cadastrar paciente gerando a senha de login
async function cadastrar(nutricionistaId, dados) {
  await garantirEmailLivre(dados.email);

  const senhaProvisoria = gerarSenhaProvisoria();
  const senhaHash = await gerarHash(senhaProvisoria);
  const dataInicio = dados.dataInicio || hoje();

  const paciente = await sequelize.transaction(async (transaction) => {
    const novo = await Paciente.create(
      {
        ...dados,
        nutricionistaId,
        senhaHash,
        dataInicio,
        pesoAtualKg: dados.pesoAtualKg || dados.pesoInicialKg,
        avatarCor: corAvatarAleatoria(),
      },
      { transaction }
    );
    const peso = dados.pesoAtualKg || dados.pesoInicialKg;
    if (peso) {
      await EvolucaoPeso.create(
        {
          pacienteId: novo.id,
          data: dataInicio,
          pesoKg: peso,
          gorduraPct: dados.gorduraPct,
          massaMagraPct: dados.massaMagraPct,
        },
        { transaction }
      );
    }
    return novo;
  });

  const nutricionista = await Nutricionista.findByPk(nutricionistaId);
  const emailEnviado = await enviarEmail({
    para: paciente.email,
    assunto: 'Seu acesso ao app Roteiro Nutri',
    texto:
      `Olá, ${paciente.nome}!\n\n${nutricionista.nome} cadastrou você no Roteiro Nutri.\n` +
      `Baixe o app e entre com:\n\nE-mail: ${paciente.email}\nSenha: ${senhaProvisoria}\n\n` +
      'Recomendamos trocar a senha no primeiro acesso (Perfil > Privacidade).',
  });

  const recarregado = await Paciente.findByPk(paciente.id);
  return { paciente: recarregado, senhaProvisoria, emailEnviado };
}

// Prontuário completo do paciente
async function detalhar(nutricionistaId, pacienteId) {
  const paciente = await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  const [evolucao, consultas, planoAtivo, totalPlanos, resumo] = await Promise.all([
    EvolucaoPeso.findAll({ where: { pacienteId }, order: [['data', 'ASC'], ['createdAt', 'ASC']] }),
    Consulta.findAll({ where: { pacienteId }, order: [['data', 'DESC'], ['horario', 'DESC']] }),
    PlanoAlimentar.findOne({
      where: { pacienteId, ativo: true },
      include: includePlanoCompleto,
      order: orderPlanoCompleto,
    }),
    PlanoAlimentar.count({ where: { pacienteId } }),
    resumoConsultas([pacienteId]),
  ]);
  return {
    ...paciente.toJSON(),
    ...resumo[pacienteId],
    evolucao,
    consultas,
    planoAtivo,
    totalPlanos,
  };
}

// RF05 / RF08 - Editar paciente e registrar dados clínicos
async function atualizar(nutricionistaId, pacienteId, dados) {
  const paciente = await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  if (dados.email && dados.email !== paciente.email) await garantirEmailLivre(dados.email, pacienteId);

  await sequelize.transaction(async (transaction) => {
    const pesoMudou = dados.pesoAtualKg && dados.pesoAtualKg !== paciente.pesoAtualKg;
    await paciente.update(dados, { transaction });
    // Uma nova pesagem na avaliação entra no histórico de evolução (RF21)
    if (pesoMudou) {
      await registrarPesagem(pacienteId, {
        pesoKg: dados.pesoAtualKg,
        gorduraPct: dados.gorduraPct,
        massaMagraPct: dados.massaMagraPct,
      }, 'nutricionista', transaction);
    }
  });
  return detalhar(nutricionistaId, pacienteId);
}

// RF06 / RN04 - Desativar suspende automaticamente o plano ativo
async function desativar(nutricionistaId, pacienteId) {
  const paciente = await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  if (!paciente.ativo) return paciente;
  await sequelize.transaction(async (transaction) => {
    const planoAtivo = await PlanoAlimentar.findOne({ where: { pacienteId, ativo: true }, transaction });
    await PlanoAlimentar.update({ ativo: false }, { where: { pacienteId }, transaction });
    await paciente.update(
      { ativo: false, ultimoPlanoId: planoAtivo ? planoAtivo.id : paciente.ultimoPlanoId },
      { transaction }
    );
  });
  notificar('paciente', pacienteId, 'conta:desativada');
  return paciente;
}

// Reativar restaura o plano que estava ativo antes da desativação
async function reativar(nutricionistaId, pacienteId) {
  const paciente = await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  if (paciente.ativo) return paciente;
  await sequelize.transaction(async (transaction) => {
    if (paciente.ultimoPlanoId) {
      await PlanoAlimentar.update({ ativo: true }, { where: { id: paciente.ultimoPlanoId, pacienteId }, transaction });
    }
    await paciente.update({ ativo: true }, { transaction });
  });
  return paciente;
}

// Nutricionista gera uma nova senha para o paciente (ex: paciente perdeu o acesso)
async function gerarNovaSenha(nutricionistaId, pacienteId) {
  const paciente = await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  const novaSenha = gerarSenhaProvisoria();
  await Paciente.update({ senhaHash: await gerarHash(novaSenha) }, { where: { id: paciente.id } });
  const emailEnviado = await enviarEmail({
    para: paciente.email,
    assunto: 'Nova senha do app Roteiro Nutri',
    texto: `Olá, ${paciente.nome}!\n\nSua nova senha de acesso ao app é: ${novaSenha}\n`,
  });
  return { email: paciente.email, novaSenha, emailEnviado };
}

/**
 * Registra (ou substitui, se já houver no mesmo dia) uma pesagem e
 * atualiza o peso atual do paciente. Usado pelo nutricionista e pelo app.
 */
async function registrarPesagem(pacienteId, { data, pesoKg, gorduraPct, massaMagraPct }, registradoPor, transaction) {
  const dia = data || hoje();
  const existente = await EvolucaoPeso.findOne({ where: { pacienteId, data: dia }, transaction });
  const valores = { pesoKg, registradoPor };
  if (gorduraPct !== undefined) valores.gorduraPct = gorduraPct;
  if (massaMagraPct !== undefined) valores.massaMagraPct = massaMagraPct;
  const registro = existente
    ? await existente.update(valores, { transaction })
    : await EvolucaoPeso.create({ pacienteId, data: dia, ...valores }, { transaction });

  // o peso atual é sempre a pesagem mais recente
  const maisRecente = await EvolucaoPeso.findOne({
    where: { pacienteId },
    order: [['data', 'DESC'], ['createdAt', 'DESC']],
    transaction,
  });
  const atualizacao = { pesoAtualKg: maisRecente.pesoKg };
  if (maisRecente.gorduraPct != null) atualizacao.gorduraPct = maisRecente.gorduraPct;
  if (maisRecente.massaMagraPct != null) atualizacao.massaMagraPct = maisRecente.massaMagraPct;
  await Paciente.update(atualizacao, { where: { id: pacienteId }, transaction });
  return registro;
}

async function registrarEvolucao(nutricionistaId, pacienteId, dados) {
  await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  return sequelize.transaction((t) => registrarPesagem(pacienteId, dados, 'nutricionista', t));
}

async function removerEvolucao(nutricionistaId, pacienteId, evolucaoId) {
  await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  const registro = await EvolucaoPeso.findOne({ where: { id: evolucaoId, pacienteId } });
  if (!registro) throw new AppError('Registro não encontrado', 404);
  await sequelize.transaction(async (transaction) => {
    await registro.destroy({ transaction });
    const maisRecente = await EvolucaoPeso.findOne({
      where: { pacienteId },
      order: [['data', 'DESC'], ['createdAt', 'DESC']],
      transaction,
    });
    if (maisRecente) await Paciente.update({ pesoAtualKg: maisRecente.pesoKg }, { where: { id: pacienteId }, transaction });
  });
}

module.exports = {
  garantirEmailLivre,
  resumoConsultas,
  listar,
  cadastrar,
  detalhar,
  atualizar,
  desativar,
  reativar,
  gerarNovaSenha,
  registrarPesagem,
  registrarEvolucao,
  removerEvolucao,
};
