// Formata os erros de validação do Zod para um formato mais simples de consumir na API
function formatZodError(zodError) {
  return zodError.errors.map((e) => ({
    campo: e.path.join('.'),
    mensagem: e.message,
  }));
}

module.exports = { formatZodError };
