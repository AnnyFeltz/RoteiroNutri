'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('planos_alimentares', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      paciente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING, allowNull: false },
      versao: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      kcal_alvo: { type: Sequelize.INTEGER, allowNull: false },
      pct_carbo: { type: Sequelize.INTEGER, allowNull: false },
      pct_proteina: { type: Sequelize.INTEGER, allowNull: false },
      pct_gordura: { type: Sequelize.INTEGER, allowNull: false },
      ...timestamps(Sequelize),
    });
    // RN07 - cada paciente possui no máximo UM plano ativo (garantido pelo banco)
    await queryInterface.addIndex('planos_alimentares', ['paciente_id'], {
      unique: true,
      where: { ativo: true },
      name: 'planos_alimentares_um_ativo_por_paciente',
    });

    await queryInterface.createTable('refeicoes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      plano_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'planos_alimentares', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING, allowNull: false },
      horario: { type: Sequelize.TIME, allowNull: false },
      ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    });

    await queryInterface.createTable('refeicao_alimentos', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      refeicao_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'refeicoes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      alimento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'alimentos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      gramas: { type: Sequelize.FLOAT, allowNull: false },
      ordem: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    });

    // RN12 - alimentos substitutos com gramagem equivalente
    await queryInterface.createTable('substitutos', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      refeicao_alimento_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'refeicao_alimentos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      alimento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'alimentos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      gramas: { type: Sequelize.FLOAT, allowNull: false },
    });

    // RN13 / RF19 - substituto escolhido pelo paciente para aquele item
    await queryInterface.addColumn('refeicao_alimentos', 'substituto_escolhido_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'substitutos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // RN19 / RF20 / RF25 - log diário de adesão (refeição consumida)
    await queryInterface.createTable('adesoes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      refeicao_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'refeicoes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      paciente_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pacientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      data: { type: Sequelize.DATEONLY, allowNull: false },
      consumida: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps(Sequelize),
    });
    await queryInterface.addIndex('adesoes', ['refeicao_id', 'data'], { unique: true });
    await queryInterface.addIndex('adesoes', ['paciente_id', 'data']);

    // Guarda o último plano ativo para restaurar ao reativar o paciente (RN04)
    await queryInterface.addColumn('pacientes', 'ultimo_plano_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'planos_alimentares', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pacientes', 'ultimo_plano_id');
    await queryInterface.dropTable('adesoes');
    await queryInterface.removeColumn('refeicao_alimentos', 'substituto_escolhido_id');
    await queryInterface.dropTable('substitutos');
    await queryInterface.dropTable('refeicao_alimentos');
    await queryInterface.dropTable('refeicoes');
    await queryInterface.dropTable('planos_alimentares');
  },
};
