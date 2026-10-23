// Regras do app mobile do PACIENTE (RF16-RF21, RF23-RF25).
const { Op } = require('sequelize');
const {
  sequelize, Nutricionista, Paciente, PlanoAlimentar, Refeicao, RefeicaoAlimento, Substituto,
  Adesao, Consulta, EvolucaoPeso, AlteracaoPerfil, SolicitacaoSenha,
} = require('../models');
const { gerarHash, compararSenha } = require('../utils/senha');
const { hoje, somarDias } = require('../utils/datas');
const { buscarPacienteLogado } = require('../utils/acesso');
const { includePlanoCompleto, orderPlanoCompleto } = require('./planoIncludes');
const { adesaoDiaria, mediaAdesao, sequenciaDias } = require('./adesaoService');
const { registrarPesagem, garantirEmailLivre } = require('./pacienteService');
const { notificar } = require('../sockets');
const AppError = require('../utils/AppError');

const ATRIBUTOS_NUTRI = ['id', 'nome', 'crn', 'email', 'telefone'];

// RF17 / RN10 - Visualizar perfil (dados cadastrais e clínicos)
async function perfil(pacienteId) {
  const paciente = await buscarPacienteLogado(pacienteId, {
    include: [{ model: Nutricionista, as: 'nutricionista', attributes: ATRIBUTOS_NUTRI }],
  });
  const dataHoje = hoje();
  const [proximaConsulta, ultimaConsulta, planoAtivo] = await Promise.all([
    Consulta.findOne({
      where: { pacienteId, data: { [Op.gte]: dataHoje } },
      attributes: ['id', 'data', 'horario', 'tipo'],
      order: [['data', 'ASC'], ['horario', 'ASC']],
    }),
    Consulta.findOne({
      where: { pacienteId, data: { [Op.lt]: dataHoje } },
      attributes: ['id', 'data', 'horario', 'tipo'],
      order: [['data', 'DESC'], ['horario', 'DESC']],
    }),
    PlanoAlimentar.findOne({
      where: { pacienteId, ativo: true },
      attributes: ['id', 'nome', 'versao', 'kcalAlvo', 'createdAt'],
    }),
  ]);
  return { ...paciente.toJSON(), proximaConsulta, ultimaConsulta, planoAtivo };
}

// RF24 / RN18 - o paciente edita apenas os dados pessoais; o nutricionista é notificado
async function atualizarPerfil(pacienteId, dados) {
  const paciente = await buscarPacienteLogado(pacienteId);
  if (dados.email !== paciente.email) await garantirEmailLivre(dados.email, pacienteId);

  const alteracoes = ['nome', 'email', 'telefone']
    .filter((campo) => dados[campo] !== undefined && (dados[campo] || '') !== (paciente[campo] || ''))
    .map((campo) => ({
      pacienteId,
      nutricionistaId: paciente.nutricionistaId,
      campo,
      valorAntigo: paciente[campo] || '',
      valorNovo: dados[campo] || '',
    }));

  if (alteracoes.length) {
    await sequelize.transaction(async (transaction) => {
      await paciente.update(
        { nome: dados.nome, email: dados.email, telefone: dados.telefone ?? paciente.telefone },
        { transaction }
      );
      await AlteracaoPerfil.bulkCreate(alteracoes, { transaction });
    });
    notificar('nutricionista', paciente.nutricionistaId, 'notificacao', { tipo: 'alteracao-perfil', pacienteId });
  }
  return perfil(pacienteId);
}

async function alterarSenha(pacienteId, { senhaAtual, novaSenha }) {
  await buscarPacienteLogado(pacienteId);
  const paciente = await Paciente.scope('comSenha').findByPk(pacienteId);
  if (!(await compararSenha(senhaAtual, paciente.senhaHash))) throw new AppError('Senha atual incorreta', 400);
  await paciente.update({ senhaHash: await gerarHash(novaSenha) });
}

async function atualizarPreferencias(pacienteId, preferencias) {
  const paciente = await buscarPacienteLogado(pacienteId);
  await paciente.update({ preferencias: { ...paciente.preferencias, ...preferencias } });
  return paciente.preferencias;
}

async function carregarPlanoAtivo(pacienteId) {
  return PlanoAlimentar.findOne({
    where: { pacienteId, ativo: true },
    include: includePlanoCompleto,
    order: orderPlanoCompleto,
  });
}

// RF18 / RN11 - Plano ativo + refeições consumidas no dia
async function planoDoDia(pacienteId, data = hoje()) {
  await buscarPacienteLogado(pacienteId);
  const plano = await carregarPlanoAtivo(pacienteId);
  if (!plano) return { plano: null, data, consumidas: [] };
  const adesoes = await Adesao.findAll({
    where: { pacienteId, data, consumida: true, refeicaoId: plano.refeicoes.map((r) => r.id) },
    attributes: ['refeicaoId'],
  });
  return { plano, data, consumidas: adesoes.map((a) => a.refeicaoId) };
}

// Histórico de versões do plano (somente leitura)
async function historicoPlanos(pacienteId) {
  await buscarPacienteLogado(pacienteId);
  const planos = await PlanoAlimentar.findAll({
    where: { pacienteId },
    attributes: ['id', 'nome', 'versao', 'ativo', 'kcalAlvo', 'createdAt'],
    include: [{ model: Refeicao, as: 'refeicoes', attributes: ['id'] }],
    order: [['versao', 'DESC']],
  });
  return planos.map((p) => {
    const { refeicoes, ...resto } = p.toJSON();
    return { ...resto, totalRefeicoes: refeicoes.length };
  });
}

/** Garante que a refeição pertence ao plano ATIVO do paciente. */
async function buscarRefeicaoDoPaciente(pacienteId, refeicaoId) {
  const refeicao = await Refeicao.findOne({
    where: { id: refeicaoId },
    include: [{ model: PlanoAlimentar, as: 'plano', where: { pacienteId, ativo: true }, attributes: ['id'] }],
  });
  if (!refeicao) throw new AppError('Refeição não encontrada no seu plano ativo', 404);
  return refeicao;
}

// RF20 / RF25 / RN19 - Registrar refeição como consumida (ou desfazer)
async function registrarConsumo(pacienteId, refeicaoId, { data, consumida }) {
  await buscarPacienteLogado(pacienteId);
  await buscarRefeicaoDoPaciente(pacienteId, refeicaoId);
  const dia = data || hoje();
  if (dia > hoje()) throw new AppError('Não é possível registrar consumo em uma data futura', 422);

  const existente = await Adesao.findOne({ where: { refeicaoId, data: dia } });
  if (existente) await existente.update({ consumida });
  else await Adesao.create({ refeicaoId, pacienteId, data: dia, consumida });
  return planoDoDia(pacienteId, dia);
}

// RF19 / RN13 - Alternar entre os substitutos cadastrados pelo nutricionista
async function escolherSubstituto(pacienteId, itemId, substitutoId) {
  await buscarPacienteLogado(pacienteId);
  const item = await RefeicaoAlimento.findByPk(itemId, {
    include: [{ model: Substituto, as: 'substitutos', attributes: ['id'] }],
  });
  if (!item) throw new AppError('Alimento não encontrado no plano', 404);
  await buscarRefeicaoDoPaciente(pacienteId, item.refeicaoId);
  if (substitutoId && !item.substitutos.some((s) => s.id === substitutoId)) {
    throw new AppError('Substituto não permitido para este alimento', 422);
  }
  await item.update({ substitutoEscolhidoId: substitutoId });
  return planoDoDia(pacienteId);
}

// RN15 / RF23 - Consultas do paciente
async function consultas(pacienteId) {
  await buscarPacienteLogado(pacienteId);
  const dataHoje = hoje();
  const todas = await Consulta.findAll({
    where: { pacienteId },
    attributes: ['id', 'data', 'horario', 'tipo'],
    order: [['data', 'ASC'], ['horario', 'ASC']],
  });
  return {
    proximas: todas.filter((c) => c.data >= dataHoje),
    anteriores: todas.filter((c) => c.data < dataHoje).reverse(),
  };
}

// RF21 - Evolução (peso e medidas) + adesão
async function evolucao(pacienteId) {
  const paciente = await buscarPacienteLogado(pacienteId);
  const dataHoje = hoje();
  const [registros, adesao] = await Promise.all([
    EvolucaoPeso.findAll({
      where: { pacienteId },
      attributes: ['id', 'data', 'pesoKg', 'gorduraPct', 'massaMagraPct'],
      order: [['data', 'ASC'], ['createdAt', 'ASC']],
    }),
    adesaoDiaria([pacienteId], somarDias(dataHoje, -179), dataHoje),
  ]);
  const dias = adesao[pacienteId] || [];

  // adesão média por mês (últimos 6 meses com dados)
  const porMes = {};
  for (const d of dias) (porMes[d.data.slice(0, 7)] ||= []).push(d);
  const adesaoMensal = Object.entries(porMes).map(([mes, lista]) => ({ mes, pct: mediaAdesao(lista) }));

  const semana = [];
  for (let i = 6; i >= 0; i--) {
    const data = somarDias(dataHoje, -i);
    const dia = dias.find((d) => d.data === data);
    semana.push({ data, pct: dia ? dia.pct : 0, consumidas: dia ? dia.consumidas : 0, total: dia ? dia.total : 0 });
  }

  return {
    paciente: {
      pesoInicialKg: paciente.pesoInicialKg,
      pesoAtualKg: paciente.pesoAtualKg,
      pesoMetaKg: paciente.pesoMetaKg,
      alturaCm: paciente.alturaCm,
      gorduraPct: paciente.gorduraPct,
      massaMagraPct: paciente.massaMagraPct,
      objetivo: paciente.objetivo,
      dataInicio: paciente.dataInicio,
    },
    registros,
    adesaoSemanal: semana,
    adesaoMediaSemanal: mediaAdesao(dias.filter((d) => d.data >= somarDias(dataHoje, -6))),
    adesaoMensal,
    sequenciaDias: sequenciaDias(dias, dataHoje),
    diasDeAcompanhamento: paciente.dataInicio
      ? Math.max(0, Math.round((new Date(`${dataHoje}T00:00:00Z`) - new Date(`${paciente.dataInicio}T00:00:00Z`)) / 86400000))
      : 0,
  };
}

async function registrarPeso(pacienteId, dados) {
  await buscarPacienteLogado(pacienteId);
  const dia = dados.data || hoje();
  if (dia > hoje()) throw new AppError('Não é possível registrar peso em uma data futura', 422);
  const paciente = await Paciente.findByPk(pacienteId);
  // pelo app o paciente registra só o peso; medidas corporais ficam com o nutricionista (RN18)
  await sequelize.transaction((t) => registrarPesagem(pacienteId, { data: dia, pesoKg: dados.pesoKg }, 'paciente', t));
  notificar('nutricionista', paciente.nutricionistaId, 'paciente:peso', { pacienteId });
  return evolucao(pacienteId);
}

// Paciente esqueceu a senha: o pedido vai para o nutricionista aprovar (RN09)
async function solicitarNovaSenha({ email }) {
  const paciente = await Paciente.findOne({ where: { email } });
  // Resposta é sempre genérica para não revelar quais e-mails existem
  if (!paciente || !paciente.ativo) return;
  const pendente = await SolicitacaoSenha.findOne({ where: { pacienteId: paciente.id, status: 'pendente' } });
  if (pendente) return;
  await SolicitacaoSenha.create({ pacienteId: paciente.id, nutricionistaId: paciente.nutricionistaId });
  notificar('nutricionista', paciente.nutricionistaId, 'notificacao', { tipo: 'pedido-senha', pacienteId: paciente.id });
}

module.exports = {
  perfil,
  atualizarPerfil,
  alterarSenha,
  atualizarPreferencias,
  planoDoDia,
  historicoPlanos,
  registrarConsumo,
  escolherSubstituto,
  consultas,
  evolucao,
  registrarPeso,
  solicitarNovaSenha,
};
