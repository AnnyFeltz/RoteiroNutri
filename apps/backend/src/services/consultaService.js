const { Op, UniqueConstraintError } = require('sequelize');
const { Consulta, Paciente } = require('../models');
const { buscarPacienteDoNutricionista } = require('../utils/acesso');
const { hhmm } = require('../utils/datas');
const { notificar } = require('../sockets');
const AppError = require('../utils/AppError');

const formatarBR = (data) => data.split('-').reverse().join('/');

// RN17 - não permite duas consultas no mesmo dia e horário
async function garantirHorarioLivre(nutricionistaId, data, horario, ignorarId = null) {
  const where = { nutricionistaId, data, horario };
  if (ignorarId) where.id = { [Op.ne]: ignorarId };
  const conflito = await Consulta.findOne({ where, attributes: ['id'] });
  if (conflito) {
    throw new AppError(`Já existe uma consulta marcada em ${formatarBR(data)} às ${hhmm(horario)}.`, 409);
  }
}

// RN14 / RF09 - Agenda do nutricionista
async function listar(nutricionistaId, { inicio, fim, pacienteId } = {}) {
  const where = { nutricionistaId };
  if (inicio && fim) where.data = { [Op.between]: [inicio, fim] };
  else if (inicio) where.data = { [Op.gte]: inicio };
  if (pacienteId) where.pacienteId = pacienteId;
  return Consulta.findAll({
    where,
    include: [{ model: Paciente, as: 'paciente', attributes: ['id', 'nome', 'avatarCor', 'foto', 'ativo'] }],
    order: [['data', 'ASC'], ['horario', 'ASC']],
  });
}

async function horariosOcupados(nutricionistaId, data) {
  const consultas = await Consulta.findAll({ where: { nutricionistaId, data }, attributes: ['horario'] });
  return consultas.map((c) => c.horario);
}

// RF22 / RN16 - Agendar consulta
async function criar(nutricionistaId, { pacienteId, ...dados }) {
  const paciente = await buscarPacienteDoNutricionista(nutricionistaId, pacienteId);
  if (!paciente.ativo) throw new AppError('Não é possível agendar consulta para paciente inativo', 422);
  await garantirHorarioLivre(nutricionistaId, dados.data, dados.horario);
  try {
    const consulta = await Consulta.create({ ...dados, pacienteId, nutricionistaId });
    notificar('paciente', pacienteId, 'consulta:atualizada', { consultaId: consulta.id });
    return consulta;
  } catch (err) {
    // corrida entre duas requisições: o índice único do banco garante a RN17
    if (err instanceof UniqueConstraintError) {
      throw new AppError('Este horário acabou de ser ocupado por outra consulta.', 409);
    }
    throw err;
  }
}

async function buscar(nutricionistaId, consultaId) {
  const consulta = await Consulta.findOne({ where: { id: consultaId, nutricionistaId } });
  if (!consulta) throw new AppError('Consulta não encontrada', 404);
  return consulta;
}

async function atualizar(nutricionistaId, consultaId, dados) {
  const consulta = await buscar(nutricionistaId, consultaId);
  const data = dados.data || consulta.data;
  const horario = dados.horario || consulta.horario;
  if (data !== consulta.data || hhmm(horario) !== consulta.horario) {
    await garantirHorarioLivre(nutricionistaId, data, horario, consultaId);
  }
  await consulta.update(dados);
  notificar('paciente', consulta.pacienteId, 'consulta:atualizada', { consultaId });
  return consulta;
}

async function remover(nutricionistaId, consultaId) {
  const consulta = await buscar(nutricionistaId, consultaId);
  await consulta.destroy();
  notificar('paciente', consulta.pacienteId, 'consulta:atualizada', { consultaId });
}

module.exports = { listar, horariosOcupados, criar, atualizar, remover };
