const { ZodError } = require('zod');
const { formatZodError } = require('@RoteiroNutri/shared');
const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: formatZodError(err) });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno no servidor' });
}

module.exports = errorHandler;
