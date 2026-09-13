/**
 * Erro "esperado" da aplicação (regra de negócio violada, não encontrado, etc).
 * Os services devem lançar isso em vez de erros genéricos, para o
 * errorHandler saber qual status HTTP retornar.
 */
class AppError extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.name = 'AppError';
    this.status = status;
  }
}

module.exports = AppError;
