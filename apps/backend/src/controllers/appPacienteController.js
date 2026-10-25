const {
  atualizarPerfilPacienteSchema,
  preferenciasSchema,
  fotoSchema,
  consumoSchema,
  substituicaoSchema,
  evolucaoSchema,
  dataSchema,
} = require('@RoteiroNutri/shared');
const appPacienteService = require('../services/appPacienteService');

const paciente = (req) => req.usuario.id;

async function perfil(req, res) {
  res.json(await appPacienteService.perfil(paciente(req)));
}

async function atualizarPerfil(req, res) {
  const dados = atualizarPerfilPacienteSchema.parse(req.body);
  res.json(await appPacienteService.atualizarPerfil(paciente(req), dados));
}

async function pedirNovaSenha(req, res) {
  const { jaPendente } = await appPacienteService.pedirNovaSenha(paciente(req));
  res.json({
    jaPendente,
    mensagem: jaPendente
      ? 'Você já tem um pedido aguardando o seu nutricionista.'
      : 'Pedido enviado. Quando seu nutricionista aprovar, a nova senha chegará no seu e-mail.',
  });
}

async function atualizarFoto(req, res) {
  const { foto } = fotoSchema.parse(req.body);
  res.json(await appPacienteService.atualizarFoto(paciente(req), foto));
}

async function atualizarPreferencias(req, res) {
  const dados = preferenciasSchema.parse(req.body);
  res.json(await appPacienteService.atualizarPreferencias(paciente(req), dados));
}

async function planoDoDia(req, res) {
  const data = req.query.data ? dataSchema.parse(req.query.data) : undefined;
  res.json(await appPacienteService.planoDoDia(paciente(req), data));
}

async function historicoPlanos(req, res) {
  res.json(await appPacienteService.historicoPlanos(paciente(req)));
}

async function registrarConsumo(req, res) {
  const dados = consumoSchema.parse(req.body);
  res.json(await appPacienteService.registrarConsumo(paciente(req), req.params.refeicaoId, dados));
}

async function escolherSubstituto(req, res) {
  const { substitutoId } = substituicaoSchema.parse(req.body);
  res.json(await appPacienteService.escolherSubstituto(paciente(req), req.params.itemId, substitutoId));
}

async function consultas(req, res) {
  res.json(await appPacienteService.consultas(paciente(req)));
}

async function evolucao(req, res) {
  res.json(await appPacienteService.evolucao(paciente(req)));
}

async function registrarPeso(req, res) {
  const dados = evolucaoSchema.parse(req.body);
  res.status(201).json(await appPacienteService.registrarPeso(paciente(req), dados));
}

module.exports = {
  perfil,
  atualizarPerfil,
  pedirNovaSenha,
  atualizarFoto,
  atualizarPreferencias,
  planoDoDia,
  historicoPlanos,
  registrarConsumo,
  escolherSubstituto,
  consultas,
  evolucao,
  registrarPeso,
};
