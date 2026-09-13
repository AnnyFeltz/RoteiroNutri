const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET) {
  // Falha cedo: sem segredo configurado não devemos nem subir o servidor.
  throw new Error('JWT_SECRET não definido no .env');
}

/**
 * Gera um token para um usuário autenticado.
 * @param {{ id: string, tipo: 'nutricionista' | 'paciente' }} payload
 */
function gerarToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verificarToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { gerarToken, verificarToken };
