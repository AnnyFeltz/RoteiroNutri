'use strict';

// As notificações ao nutricionista (alterações de perfil feitas pelo paciente)
// ficaram para trabalhos futuros: o paciente atualiza os dados e eles são gravados direto.
module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('alteracoes_perfil');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('alteracoes_perfil', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      paciente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nutricionista_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'nutricionistas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      campo: { type: Sequelize.STRING, allowNull: false },
      valor_antigo: Sequelize.TEXT,
      valor_novo: Sequelize.TEXT,
      lida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('alteracoes_perfil', ['nutricionista_id', 'lida']);
  },
};
