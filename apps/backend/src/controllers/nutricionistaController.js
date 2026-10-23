const {
  atualizarNutricionistaSchema,
  alterarSenhaSchema,
  preferenciasSchema,
} = require('@RoteiroNutri/shared');
const nutricionistaService = require('../services/nutricionistaService');

async function perfil(req, res) {
  res.json(await nutricionistaService.perfil(req.usuario.id));
}

async function atualizarPerfil(req, res) {
  const dados = atualizarNutricionistaSchema.parse(req.body);
  res.json(await nutricionistaService.atualizarPerfil(req.usuario.id, dados));
}

async function alterarSenha(req, res) {
  const dados = alterarSenhaSchema.parse(req.body);
  await nutricionistaService.alterarSenha(req.usuario.id, dados);
  res.json({ mensagem: 'Senha alterada com sucesso' });
}

async function atualizarPreferencias(req, res) {
  const dados = preferenciasSchema.parse(req.body);
  res.json(await nutricionistaService.atualizarPreferencias(req.usuario.id, dados));
}

async function dashboard(req, res) {
  res.json(await nutricionistaService.dashboard(req.usuario.id));
}

async function evolucaoGeral(req, res) {
  res.json(await nutricionistaService.evolucaoGeral(req.usuario.id));
}

module.exports = { perfil, atualizarPerfil, alterarSenha, atualizarPreferencias, dashboard, evolucaoGeral };
