const { sequelize, Paciente, AlteracaoPerfil, SolicitacaoSenha } = require('../models');
const { gerarHash } = require('../utils/senha');
const { gerarSenhaProvisoria } = require('../utils/aleatorio');
const { enviarEmail } = require('../utils/email');
const AppError = require('../utils/AppError');

const incluirPaciente = [{ model: Paciente, as: 'paciente', attributes: ['id', 'nome', 'email', 'avatarCor', 'foto'] }];

async function contagem(nutricionistaId) {
  const [alteracoes, pedidos] = await Promise.all([
    AlteracaoPerfil.count({ where: { nutricionistaId, lida: false } }),
    SolicitacaoSenha.count({ where: { nutricionistaId, status: 'pendente' } }),
  ]);
  return { alteracoesNaoLidas: alteracoes, pedidosSenhaPendentes: pedidos, total: alteracoes + pedidos };
}

async function listar(nutricionistaId) {
  const [alteracoes, pendentes, resolvidas] = await Promise.all([
    AlteracaoPerfil.findAll({ where: { nutricionistaId }, include: incluirPaciente, order: [['createdAt', 'DESC']], limit: 100 }),
    SolicitacaoSenha.findAll({ where: { nutricionistaId, status: 'pendente' }, include: incluirPaciente, order: [['createdAt', 'DESC']] }),
    SolicitacaoSenha.findAll({
      where: { nutricionistaId, status: ['aprovada', 'negada'] },
      include: incluirPaciente,
      order: [['resolvidaEm', 'DESC']],
      limit: 5,
    }),
  ]);
  return { alteracoes, pedidosSenhaPendentes: pendentes, pedidosSenhaResolvidos: resolvidas };
}

async function marcarAlteracoesLidas(nutricionistaId) {
  await AlteracaoPerfil.update({ lida: true }, { where: { nutricionistaId, lida: false } });
}

async function limparAlteracoes(nutricionistaId) {
  await AlteracaoPerfil.destroy({ where: { nutricionistaId } });
}

async function buscarPedidoPendente(nutricionistaId, id) {
  const pedido = await SolicitacaoSenha.findOne({ where: { id, nutricionistaId }, include: incluirPaciente });
  if (!pedido) throw new AppError('Pedido não encontrado', 404);
  if (pedido.status !== 'pendente') throw new AppError('Este pedido já foi resolvido', 409);
  return pedido;
}

// Aprovar o pedido gera uma nova senha e envia ao e-mail do paciente (RN09)
async function aprovarPedidoSenha(nutricionistaId, id) {
  const pedido = await buscarPedidoPendente(nutricionistaId, id);
  const novaSenha = gerarSenhaProvisoria();
  await sequelize.transaction(async (transaction) => {
    await Paciente.update({ senhaHash: await gerarHash(novaSenha) }, { where: { id: pedido.pacienteId }, transaction });
    await pedido.update({ status: 'aprovada', resolvidaEm: new Date() }, { transaction });
  });
  const emailEnviado = await enviarEmail({
    para: pedido.paciente.email,
    assunto: 'Sua nova senha do Roteiro Nutri',
    texto: `Olá, ${pedido.paciente.nome}!\n\nSeu pedido foi aprovado. Sua nova senha é: ${novaSenha}\n`,
  });
  return { email: pedido.paciente.email, novaSenha, emailEnviado };
}

async function negarPedidoSenha(nutricionistaId, id) {
  const pedido = await buscarPedidoPendente(nutricionistaId, id);
  await pedido.update({ status: 'negada', resolvidaEm: new Date() });
}

module.exports = {
  contagem,
  listar,
  marcarAlteracoesLidas,
  limparAlteracoes,
  aprovarPedidoSenha,
  negarPedidoSenha,
};
