'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pacientes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      nutricionista_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'nutricionistas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      senha_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      token_recuperacao: Sequelize.STRING,
      token_expira_em: Sequelize.DATE,
      idade: Sequelize.INTEGER,
      sexo: Sequelize.CHAR(1),
      altura_cm: Sequelize.FLOAT,
      peso_inicial_kg: Sequelize.FLOAT,
      peso_atual_kg: Sequelize.FLOAT,
      peso_meta_kg: Sequelize.FLOAT,
      gordura_pct: Sequelize.FLOAT,
      massa_magra_pct: Sequelize.FLOAT,
      objetivo: Sequelize.STRING,
      alergias: Sequelize.TEXT,
      historico_clinico: Sequelize.TEXT,
      estilo_vida: Sequelize.TEXT,
      recordatorio_alimentar: Sequelize.TEXT,
      data_inicio: Sequelize.DATEONLY,
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pacientes');
  },
};
