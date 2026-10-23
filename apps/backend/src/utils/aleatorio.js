const crypto = require('crypto');

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar a digitação no celular.
const CARACTERES_SENHA = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Gera uma senha provisória legível, usada pelo nutricionista para criar
 * o acesso do paciente (RF04 -> RN08: "Gerar senha de login").
 */
function gerarSenhaProvisoria(tamanho = 10) {
  const bytes = crypto.randomBytes(tamanho);
  let senha = '';
  for (let i = 0; i < tamanho; i++) senha += CARACTERES_SENHA[bytes[i] % CARACTERES_SENHA.length];
  return senha;
}

/**
 * Gera um token opaco para o fluxo de recuperação de senha (RF03/RN09).
 */
function gerarTokenRecuperacao() {
  return crypto.randomBytes(32).toString('hex');
}

const CORES_AVATAR = [
  'oklch(0.55 0.13 45)',
  'oklch(0.52 0.13 142)',
  'oklch(0.72 0.14 70)',
  'oklch(0.42 0.09 142)',
  'oklch(0.6 0.1 250)',
  'oklch(0.58 0.12 330)',
];

function corAvatarAleatoria() {
  return CORES_AVATAR[crypto.randomInt(CORES_AVATAR.length)];
}

module.exports = { gerarSenhaProvisoria, gerarTokenRecuperacao, corAvatarAleatoria };
