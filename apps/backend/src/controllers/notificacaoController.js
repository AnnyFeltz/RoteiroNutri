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

async function aprovarPedidoSenha(req, res) {
  res.json(await notificacaoService.aprovarPedidoSenha(req.usuario.id, req.params.id));
}

async function negarPedidoSenha(req, res) {
  await notificacaoService.negarPedidoSenha(req.usuario.id, req.params.id);
  res.status(204).end();
}

module.exports = { listar, contagem, marcarLidas, limpar, aprovarPedidoSenha, negarPedidoSenha };
