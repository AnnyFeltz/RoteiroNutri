'use strict';

const fkPaciente = (Sequelize) => ({
  type: Sequelize.UUID,
  allowNull: false,
  references: { model: 'pacientes', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

const fkNutricionista = (Sequelize) => ({
  type: Sequelize.UUID,
  allowNull: false,
  references: { model: 'nutricionistas', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

module.exports = {
  async up(queryInterface, Sequelize) {
    // Alterações que o paciente faz no próprio perfil (RN18) — o nutricionista é notificado
    await queryInterface.createTable('alteracoes_perfil', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      paciente_id: fkPaciente(Sequelize),
      nutricionista_id: fkNutricionista(Sequelize),
      campo: { type: Sequelize.STRING, allowNull: false },
      valor_antigo: Sequelize.TEXT,
      valor_novo: Sequelize.TEXT,
      lida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('alteracoes_perfil', ['nutricionista_id', 'lida']);

    // Pedido de nova senha do paciente, aprovado pelo nutricionista (RN08/RN09)
    await queryInterface.createTable('solicitacoes_senha', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      paciente_id: fkPaciente(Sequelize),
      nutricionista_id: fkNutricionista(Sequelize),
      status: {
        type: Sequelize.ENUM('pendente', 'aprovada', 'negada'),
        allowNull: false,
        defaultValue: 'pendente',
      },
      resolvida_em: Sequelize.DATE,
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('solicitacoes_senha', ['nutricionista_id', 'status']);

    // Preferências (notificações/privacidade) e dados de contato
    await queryInterface.addColumn('pacientes', 'telefone', Sequelize.STRING);
    await queryInterface.addColumn('pacientes', 'avatar_cor', Sequelize.STRING);
    await queryInterface.addColumn('pacientes', 'preferencias', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
    });
    await queryInterface.addColumn('nutricionistas', 'telefone', Sequelize.STRING);
    await queryInterface.addColumn('nutricionistas', 'preferencias', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('nutricionistas', 'preferencias');
    await queryInterface.removeColumn('nutricionistas', 'telefone');
    await queryInterface.removeColumn('pacientes', 'preferencias');
    await queryInterface.removeColumn('pacientes', 'avatar_cor');
    await queryInterface.removeColumn('pacientes', 'telefone');
    await queryInterface.dropTable('solicitacoes_senha');
    await queryInterface.dropTable('alteracoes_perfil');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_solicitacoes_senha_status";');
  },
};
