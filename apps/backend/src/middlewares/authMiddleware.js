const { verificarToken } = require('../utils/jwt');

/**
 * Garante que a requisição tem um Bearer token válido.
 * Preenche req.usuario com { id, tipo } (tipo: 'nutricionista' | 'paciente').
 */
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de acesso não informado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verificarToken(token);
    req.usuario = payload; // { id, tipo, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

/**
 * Restringe a rota a um ou mais tipos de usuário.
 * Uso: autorizar('nutricionista') ou autorizar('nutricionista', 'paciente')
 */
function autorizar(...tiposPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !tiposPermitidos.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: 'Acesso não permitido para este tipo de usuário' });
    }
    next();
  };
}

module.exports = { autenticar, autorizar };
