const {
  cadastrarNutricionistaSchema,
  loginSchema,
  solicitarRecuperacaoSenhaSchema,
  redefinirSenhaSchema,
} = require('@RoteiroNutri/shared');
const authService = require('../services/authService');

async function registrarNutricionista(req, res) {
  const dados = cadastrarNutricionistaSchema.parse(req.body);
  const { nutricionista, token } = await authService.cadastrarNutricionista(dados);

  const { senhaHash, ...nutricionistaPublico } = nutricionista.toJSON();
  res.status(201).json({ nutricionista: nutricionistaPublico, token });
}

async function loginNutricionista(req, res) {
  const dados = loginSchema.parse(req.body);
  const resultado = await authService.loginNutricionista(dados);
  res.status(200).json(resultado);
}

async function loginPaciente(req, res) {
  const dados = loginSchema.parse(req.body);
  const resultado = await authService.loginPaciente(dados);
  res.status(200).json(resultado);
}

async function solicitarRecuperacaoSenha(req, res) {
  const dados = solicitarRecuperacaoSenhaSchema.parse(req.body);
  await authService.solicitarRecuperacaoSenha(dados);
  // Resposta genérica de propósito: não confirmamos se o e-mail existe.
  res.status(200).json({ mensagem: 'Se o e-mail existir em nossa base, um link de recuperação foi enviado.' });
}

async function redefinirSenha(req, res) {
  const dados = redefinirSenhaSchema.parse(req.body);
  await authService.redefinirSenha(dados);
  res.status(200).json({ mensagem: 'Senha redefinida com sucesso.' });
}

module.exports = {
  registrarNutricionista,
  loginNutricionista,
  loginPaciente,
  solicitarRecuperacaoSenha,
  redefinirSenha,
};
