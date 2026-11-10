const { Nutricionista, Paciente } = require('../models');
const { gerarHash, compararSenha } = require('../utils/senha');
const { gerarToken } = require('../utils/jwt');
const { gerarTokenRecuperacao, gerarCodigoRecuperacao } = require('../utils/aleatorio');
const { enviarEmail } = require('../utils/email');
const AppError = require('../utils/AppError');

const UMA_HORA_MS = 60 * 60 * 1000;

// RN01 / RF01 - Cadastro de Nutricionista
async function cadastrarNutricionista({ nome, email, senha, crn }) {
  const existente =
    (await Nutricionista.findOne({ where: { email } })) || (await Paciente.findOne({ where: { email } }));
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

// RF03 / RN09 - Nutricionista: link de redefinição enviado ao e-mail cadastrado (web)
async function solicitarRecuperacaoSenha({ email }) {
  const modelo = await Nutricionista.findOne({ where: { email } });

  // Por segurança, não revelamos se o e-mail existe ou não na resposta.
  if (!modelo) return;

  const token = gerarTokenRecuperacao();
  modelo.tokenRecuperacao = token;
  modelo.tokenExpiraEm = new Date(Date.now() + UMA_HORA_MS);
  await modelo.save();

  const urlWeb = process.env.WEB_URL || 'http://localhost:5173';
  await enviarEmail({
    para: email,
    assunto: 'Redefinição de senha — Roteiro Nutri',
    texto:
      `Olá, ${modelo.nome}!\n\nRecebemos um pedido para redefinir sua senha. ` +
      `Acesse o link abaixo (válido por 1 hora):\n\n${urlWeb}/redefinir-senha?token=${token}\n\n` +
      'Se você não fez esse pedido, ignore este e-mail.',
  });
}

// RF03 / RN09 - Nutricionista redefine a senha usando o token do link
async function redefinirSenha({ token, novaSenha }) {
  const modelo = await Nutricionista.scope('comSenha').findOne({ where: { tokenRecuperacao: token } });

  if (!modelo || !modelo.tokenExpiraEm || modelo.tokenExpiraEm < new Date()) {
    throw new AppError('Token inválido ou expirado', 400);
  }

  modelo.senhaHash = await gerarHash(novaSenha);
  modelo.tokenRecuperacao = null;
  modelo.tokenExpiraEm = null;
  await modelo.save();
}

// RF03 / RN09 - Paciente: código de redefinição enviado ao e-mail cadastrado.
// O paciente usa o código no próprio app (a web é só do nutricionista).
async function solicitarRecuperacaoSenhaPaciente({ email }) {
  const paciente = await Paciente.findOne({ where: { email } });
  // Resposta sempre genérica para não revelar quais e-mails existem
  if (!paciente || !paciente.ativo) return;

  const codigo = gerarCodigoRecuperacao();
  paciente.tokenRecuperacao = codigo;
  paciente.tokenExpiraEm = new Date(Date.now() + UMA_HORA_MS);
  await paciente.save();

  await enviarEmail({
    para: email,
    assunto: 'Código para redefinir sua senha — Roteiro Nutri',
    texto:
      `Olá, ${paciente.nome}!\n\nRecebemos um pedido para redefinir sua senha no app Roteiro Nutri.\n\n` +
      `Seu código é: ${codigo}\n\nDigite esse código no app (válido por 1 hora) e escolha a nova senha.\n\n` +
      'Se você não fez esse pedido, ignore este e-mail.',
  });
}

async function redefinirSenhaPaciente({ email, codigo, novaSenha }) {
  const paciente = await Paciente.scope('comSenha').findOne({ where: { email } });
  const valido =
    paciente && paciente.ativo && paciente.tokenRecuperacao && paciente.tokenRecuperacao === codigo && paciente.tokenExpiraEm > new Date();
  if (!valido) throw new AppError('Código inválido ou expirado', 400);

  paciente.senhaHash = await gerarHash(novaSenha);
  paciente.tokenRecuperacao = null;
  paciente.tokenExpiraEm = null;
  await paciente.save();
}

// Dados do usuário logado (usado pelos front-ends ao abrir o app)
async function usuarioLogado({ id, tipo }) {
  const modelo = tipo === 'nutricionista' ? Nutricionista : Paciente;
  const usuario = await modelo.findByPk(id);
  if (!usuario) throw new AppError('Usuário não encontrado', 401);
  if (tipo === 'paciente' && !usuario.ativo) throw new AppError('Paciente inativo. Procure seu nutricionista.', 403);
  return { tipo, usuario };
}

module.exports = {
  usuarioLogado,
  cadastrarNutricionista,
  loginNutricionista,
  loginPaciente,
  solicitarRecuperacaoSenha,
  redefinirSenha,
  solicitarRecuperacaoSenhaPaciente,
  redefinirSenhaPaciente,
};
