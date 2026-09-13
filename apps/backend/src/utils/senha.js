const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

function gerarHash(senhaTextoPuro) {
  return bcrypt.hash(senhaTextoPuro, SALT_ROUNDS);
}

function compararSenha(senhaTextoPuro, hash) {
  return bcrypt.compare(senhaTextoPuro, hash);
}

module.exports = { gerarHash, compararSenha };
