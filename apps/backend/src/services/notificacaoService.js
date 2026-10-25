const { Paciente, AlteracaoPerfil } = require('../models');

const incluirPaciente = [{ model: Paciente, as: 'paciente', attributes: ['id', 'nome', 'email', 'avatarCor', 'foto'] }];

// RN18 - alterações de perfil feitas pelos pacientes
async function contagem(nutricionistaId) {
  const alteracoes = await AlteracaoPerfil.count({ where: { nutricionistaId, lida: false } });
  return { alteracoesNaoLidas: alteracoes, total: alteracoes };
}

async function listar(nutricionistaId) {
  const alteracoes = await AlteracaoPerfil.findAll({
    where: { nutricionistaId },
    include: incluirPaciente,
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
  return { alteracoes };
}

async function marcarAlteracoesLidas(nutricionistaId) {
  await AlteracaoPerfil.update({ lida: true }, { where: { nutricionistaId, lida: false } });
}

async function limparAlteracoes(nutricionistaId) {
  await AlteracaoPerfil.destroy({ where: { nutricionistaId } });
}

module.exports = {
  contagem,
  listar,
  marcarAlteracoesLidas,
  limparAlteracoes,
};
