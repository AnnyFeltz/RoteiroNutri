const crypto = require('crypto');

/**
 * Gera uma senha provisória legível, usada pelo nutricionista para criar
 * o acesso do paciente (RF04 -> RN08: "Gerar senha de login").
 */
function gerarSenhaProvisoria() {
  return crypto.randomBytes(6).toString('base64url'); // ex: "aZ3k9Qm1"
}

/**
 * Gera um token opaco para o fluxo de recuperação de senha (RF03/RN09).
 */
function gerarTokenRecuperacao() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { gerarSenhaProvisoria, gerarTokenRecuperacao };
