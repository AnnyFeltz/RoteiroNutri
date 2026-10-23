const { Op } = require('sequelize');
const { Nutricionista, Paciente, PlanoAlimentar, Consulta, EvolucaoPeso } = require('../models');
const { gerarHash, compararSenha } = require('../utils/senha');
const { hoje, somarDias, horaAtual } = require('../utils/datas');
const { adesaoDiaria, mediaAdesao } = require('./adesaoService');
const AppError = require('../utils/AppError');

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

async function perfil(nutricionistaId) {
  const nutricionista = await Nutricionista.findByPk(nutricionistaId);
  if (!nutricionista) throw new AppError('Nutricionista não encontrado', 404);
  return nutricionista;
}

async function atualizarPerfil(nutricionistaId, dados) {
  const nutricionista = await perfil(nutricionistaId);
  if (dados.email !== nutricionista.email) {
    const [n, p] = await Promise.all([
      Nutricionista.findOne({ where: { email: dados.email, id: { [Op.ne]: nutricionistaId } } }),
      Paciente.findOne({ where: { email: dados.email } }),
    ]);
    if (n || p) throw new AppError('Este e-mail já está em uso por outro usuário', 409);
  }
  await nutricionista.update(dados);
  return nutricionista;
}

async function alterarSenha(nutricionistaId, { senhaAtual, novaSenha }) {
  const nutricionista = await Nutricionista.scope('comSenha').findByPk(nutricionistaId);
  if (!(await compararSenha(senhaAtual, nutricionista.senhaHash))) {
    throw new AppError('Senha atual incorreta', 400);
  }
  await nutricionista.update({ senhaHash: await gerarHash(novaSenha) });
}

async function atualizarFoto(nutricionistaId, foto) {
  const nutricionista = await perfil(nutricionistaId);
  await nutricionista.update({ foto });
  return nutricionista;
}

async function atualizarPreferencias(nutricionistaId, preferencias) {
  const nutricionista = await perfil(nutricionistaId);
  await nutricionista.update({ preferencias: { ...nutricionista.preferencias, ...preferencias } });
  return nutricionista.preferencias;
}

/** Último peso registrado até `data` (inclusive) em uma lista ordenada por data. */
function pesoAte(evolucao, data) {
  let peso = null;
  for (const e of evolucao) {
    if (e.data > data) break;
    peso = e.pesoKg;
  }
  return peso;
}

// RF09 - Dashboard: agenda do dia e métricas rápidas
async function dashboard(nutricionistaId) {
  const dataHoje = hoje();
  const inicioMes = `${dataHoje.slice(0, 8)}01`;
  const pacientes = await Paciente.findAll({
    where: { nutricionistaId },
    attributes: ['id', 'ativo', 'dataInicio', 'pesoInicialKg', 'pesoAtualKg', 'createdAt'],
  });
  const ativos = pacientes.filter((p) => p.ativo);
  const idsAtivos = ativos.map((p) => p.id);

  const [consultasHoje, consultasMes, planosAtivos, planosMes, adesoes, evolucoes] = await Promise.all([
    Consulta.findAll({
      where: { nutricionistaId, data: dataHoje },
      include: [{ model: Paciente, as: 'paciente', attributes: ['id', 'nome', 'avatarCor', 'foto'] }],
      order: [['horario', 'ASC']],
    }),
    Consulta.count({ where: { nutricionistaId, data: { [Op.gte]: inicioMes } } }),
    idsAtivos.length ? PlanoAlimentar.count({ where: { pacienteId: idsAtivos, ativo: true } }) : 0,
    idsAtivos.length
      ? PlanoAlimentar.count({ where: { pacienteId: idsAtivos, createdAt: { [Op.gte]: new Date(`${inicioMes}T00:00:00`) } } })
      : 0,
    adesaoDiaria(idsAtivos, somarDias(dataHoje, -29), dataHoje),
    idsAtivos.length
      ? EvolucaoPeso.findAll({ where: { pacienteId: idsAtivos }, attributes: ['pacienteId', 'data', 'pesoKg'], order: [['data', 'ASC']] })
      : [],
  ]);

  // Adesão: média dos últimos 30 dias por paciente com plano, distribuída em faixas
  const medias = idsAtivos.map((id) => mediaAdesao(adesoes[id])).filter((m) => m !== null);
  const faixas = [
    { nome: 'Ótima (80-100%)', min: 80, total: 0 },
    { nome: 'Boa (50-79%)', min: 50, total: 0 },
    { nome: 'Regular (20-49%)', min: 20, total: 0 },
    { nome: 'Baixa (0-19%)', min: 0, total: 0 },
  ];
  for (const m of medias) faixas.find((f) => m >= f.min).total++;

  // Evolução média de peso (kg em relação ao inicial) nos últimos 6 meses
  const porPaciente = {};
  for (const e of evolucoes) (porPaciente[e.pacienteId] ||= []).push(e);
  const evolucaoMensal = [];
  const [ano, mes] = dataHoje.split('-').map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(ano, mes - 1 - i, 1));
    const fimMes = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const variacoes = ativos
      .map((p) => {
        const peso = pesoAte(porPaciente[p.id] || [], fimMes);
        return peso != null && p.pesoInicialKg ? peso - p.pesoInicialKg : null;
      })
      .filter((v) => v !== null);
    evolucaoMensal.push({
      mes: MESES[d.getUTCMonth()],
      variacaoMediaKg: variacoes.length ? Math.round((variacoes.reduce((s, v) => s + v, 0) / variacoes.length) * 10) / 10 : null,
    });
  }

  const comPeso = ativos.filter((p) => p.pesoInicialKg && p.pesoAtualKg);
  const perdas = comPeso.map((p) => p.pesoInicialKg - p.pesoAtualKg).filter((v) => v > 0);
  const ganhos = comPeso.map((p) => p.pesoAtualKg - p.pesoInicialKg).filter((v) => v > 0);
  const media = (lista) => (lista.length ? Math.round((lista.reduce((s, v) => s + v, 0) / lista.length) * 10) / 10 : 0);

  const agora = horaAtual();
  const proxima = consultasHoje.find((c) => c.horario >= agora);

  return {
    pacientesAtivos: ativos.length,
    novosPacientesMes: pacientes.filter((p) => (p.dataInicio || '') >= inicioMes).length,
    consultasHoje,
    proximaConsultaHoje: proxima ? proxima.horario : null,
    consultasMes,
    planosAtivos,
    planosCriadosMes: planosMes,
    taxaAdesao: medias.length ? Math.round(medias.reduce((s, m) => s + m, 0) / medias.length) : null,
    distribuicaoAdesao: faixas.map(({ nome, total }) => ({
      nome,
      total,
      pct: medias.length ? Math.round((total / medias.length) * 100) : 0,
    })),
    evolucaoMensal,
    perdaMediaKg: media(perdas),
    ganhoMedioKg: media(ganhos),
  };
}

// RF21 - Evolução de todos os pacientes ativos (gráficos comparativos)
async function evolucaoGeral(nutricionistaId) {
  const pacientes = await Paciente.findAll({
    where: { nutricionistaId, ativo: true },
    attributes: ['id', 'nome', 'objetivo', 'avatarCor', 'foto', 'pesoInicialKg', 'pesoAtualKg', 'pesoMetaKg'],
    include: [{ model: EvolucaoPeso, as: 'evolucao', attributes: ['data', 'pesoKg'] }],
    order: [['nome', 'ASC'], [{ model: EvolucaoPeso, as: 'evolucao' }, 'data', 'ASC']],
  });
  return pacientes;
}

module.exports = { perfil, atualizarPerfil, alterarSenha, atualizarFoto, atualizarPreferencias, dashboard, evolucaoGeral };
