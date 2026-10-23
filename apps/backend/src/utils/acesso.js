const { Paciente } = require('../models');
const AppError = require('./AppError');

/**
 * Busca um paciente garantindo que ele pertence ao nutricionista logado.
 * Um nutricionista nunca enxerga pacientes de outro (RNF02).
 */
async function buscarPacienteDoNutricionista(nutricionistaId, pacienteId, opcoes = {}) {
  const paciente = await Paciente.findOne({ where: { id: pacienteId, nutricionistaId }, ...opcoes });
  if (!paciente) throw new AppError('Paciente não encontrado', 404);
  return paciente;
}

/** Paciente logado no app; bloqueia o acesso se ele foi desativado (RN03/RN04). */
async function buscarPacienteLogado(pacienteId, opcoes = {}) {
  const paciente = await Paciente.findByPk(pacienteId, opcoes);
  if (!paciente) throw new AppError('Paciente não encontrado', 404);
  if (!paciente.ativo) throw new AppError('Paciente inativo. Procure seu nutricionista.', 403);
  return paciente;
}

module.exports = { buscarPacienteDoNutricionista, buscarPacienteLogado };
