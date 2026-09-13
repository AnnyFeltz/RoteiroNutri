const { Nutricionista, Paciente } = require('../models');
const { gerarHash, compararSenha } = require('../utils/senha');
const { gerarToken } = require('../utils/jwt');
const { gerarTokenRecuperacao } = require('../utils/aleatorio');
const AppError = require('../utils/AppError');

const UMA_HORA_MS = 60 * 60 * 1000;

// RN01 / RF01 - Cadastro de Nutricionista
async function cadastrarNutricionista({ nome, email, senha, crn }) {
  const existente = await Nutricionista.findOne({ where: { email } });
  if (existente) {
    throw new AppError('Já existe um nutricionista cadastrado com este e-mail', 409);
  }

  const senhaHash = await gerarHash(senha);
  const nutricionista = await Nutricionista.create({ nome, email, senhaHash, crn });

  const token = gerarToken({ id: nutricionista.id, tipo: 'nutricionista' });
  return { nutricionista, token };
}

// RF02 - Login Nutricionista
async function loginNutricionista({ email, senha }) {
  const nutricionista = await Nutricionista.scope('comSenha').findOne({ where: { email } });
  if (!nutricionista) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const senhaValida = await compararSenha(senha, nutricionista.senhaHash);
  if (!senhaValida) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const token = gerarToken({ id: nutricionista.id, tipo: 'nutricionista' });
  const { senhaHash, tokenRecuperacao, tokenExpiraEm, ...dadosPublicos } = nutricionista.toJSON();
  return { nutricionista: dadosPublicos, token };
}

// RF16 / RN08 - Login Paciente (credenciais fornecidas pelo nutricionista)
async function loginPaciente({ email, senha }) {
  const paciente = await Paciente.scope('comSenha').findOne({ where: { email } });
  if (!paciente) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  if (!paciente.ativo) {
    throw new AppError('Paciente inativo. Procure seu nutricionista.', 403);
  }

  const senhaValida = await compararSenha(senha, paciente.senhaHash);
  if (!senhaValida) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const token = gerarToken({ id: paciente.id, tipo: 'paciente' });
  const { senhaHash, tokenRecuperacao, tokenExpiraEm, ...dadosPublicos } = paciente.toJSON();
  return { paciente: dadosPublicos, token };
}

// RF03 / RN09 - Solicitar recuperação de senha (nutricionista OU paciente)
async function solicitarRecuperacaoSenha({ email }) {
  const nutricionista = await Nutricionista.findOne({ where: { email } });
  const modelo = nutricionista || (await Paciente.findOne({ where: { email } }));

  // Por segurança, não revelamos se o e-mail existe ou não na resposta.
  if (!modelo) return;

  const token = gerarTokenRecuperacao();
  modelo.tokenRecuperacao = token;
  modelo.tokenExpiraEm = new Date(Date.now() + UMA_HORA_MS);
  await modelo.save();

  // TODO: integrar envio real de e-mail (ex: nodemailer/SES/SendGrid).
  // Por enquanto, logamos para facilitar o desenvolvimento local.
  console.log(`[recuperação de senha] e-mail=${email} token=${token}`);
}

// RF03 / RN09 - Redefinir senha usando o token recebido por e-mail
async function redefinirSenha({ token, novaSenha }) {
  let modelo = await Nutricionista.scope('comSenha').findOne({ where: { tokenRecuperacao: token } });
  if (!modelo) {
    modelo = await Paciente.scope('comSenha').findOne({ where: { tokenRecuperacao: token } });
  }

  if (!modelo || !modelo.tokenExpiraEm || modelo.tokenExpiraEm < new Date()) {
    throw new AppError('Token inválido ou expirado', 400);
  }

  modelo.senhaHash = await gerarHash(novaSenha);
  modelo.tokenRecuperacao = null;
  modelo.tokenExpiraEm = null;
  await modelo.save();
}

module.exports = {
  cadastrarNutricionista,
  loginNutricionista,
  loginPaciente,
  solicitarRecuperacaoSenha,
  redefinirSenha,
};
