const { ZodError } = require('zod');
const { UniqueConstraintError, ForeignKeyConstraintError, DatabaseError } = require('sequelize');
const { formatZodError } = require('@RoteiroNutri/shared');
const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ erro: err.errors[0]?.message || 'Dados inválidos', detalhes: formatZodError(err) });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message });
  }

  // JSON mal formado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({ erro: 'Registro duplicado' });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(422).json({ erro: 'Referência inválida a outro registro' });
  }

  // ex: id que não é um UUID válido na URL
  if (err instanceof DatabaseError && /invalid input syntax/.test(err.message)) {
    return res.status(404).json({ erro: 'Registro não encontrado' });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno no servidor' });
}

module.exports = errorHandler;
