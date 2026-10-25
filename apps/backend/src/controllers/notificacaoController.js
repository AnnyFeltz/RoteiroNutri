const notificacaoService = require('../services/notificacaoService');

async function listar(req, res) {
  res.json(await notificacaoService.listar(req.usuario.id));
}

async function contagem(req, res) {
  res.json(await notificacaoService.contagem(req.usuario.id));
}

async function marcarLidas(req, res) {
  await notificacaoService.marcarAlteracoesLidas(req.usuario.id);
  res.status(204).end();
}

async function limpar(req, res) {
  await notificacaoService.limparAlteracoes(req.usuario.id);
  res.status(204).end();
}

module.exports = { listar, contagem, marcarLidas, limpar };
