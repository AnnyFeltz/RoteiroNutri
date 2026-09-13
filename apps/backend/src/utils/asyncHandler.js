// Evita repetir try/catch em todo controller async.
// Uso: router.post('/rota', asyncHandler(controller.funcao))
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
