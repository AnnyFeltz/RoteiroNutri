const planoService = require('../services/planoService');

async function painel(req, res) {
  res.json(await planoService.painel(req.usuario.id));
}

async function detalhar(req, res) {
  res.json(await planoService.detalhar(req.usuario.id, req.params.id));
}

module.exports = { painel, detalhar };
