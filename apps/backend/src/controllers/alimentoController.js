const alimentoService = require('../services/alimentoService');

async function listar(req, res) {
  const limite = Math.min(Number(req.query.limite) || 50, 600);
  const pagina = Math.max(Number(req.query.pagina) || 1, 1);
  const { busca, categoria } = req.query;
  res.json(await alimentoService.listar({ busca, categoria, limite, pagina }));
}

async function categorias(req, res) {
  res.json(await alimentoService.categorias());
}

async function estatisticas(req, res) {
  res.json(await alimentoService.estatisticas());
}

async function buscarPorId(req, res) {
  res.json(await alimentoService.buscarPorId(req.params.id));
}

module.exports = { listar, categorias, estatisticas, buscarPorId };
