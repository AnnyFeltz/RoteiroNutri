'use strict';

// RN09 (como no TCC): o paciente redefine a senha pelo código enviado ao e-mail
// cadastrado, sem aprovação do nutricionista. A tabela de pedidos deixa de existir.
module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('solicitacoes_senha');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_solicitacoes_senha_status";');
  },

  async down(queryInterface, Sequelize) {
    const fk = (tabela) => ({
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: tabela, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.createTable('solicitacoes_senha', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      paciente_id: fk('pacientes'),
      nutricionista_id: fk('nutricionistas'),
      status: { type: Sequelize.ENUM('pendente', 'aprovada', 'negada'), allowNull: false, defaultValue: 'pendente' },
      resolvida_em: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('solicitacoes_senha', ['nutricionista_id', 'status']);
  },
};
