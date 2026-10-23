'use strict';

const timestamps = (Sequelize) => ({
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
});

const fkPaciente = (Sequelize) => ({
  type: Sequelize.UUID,
  allowNull: false,
  references: { model: 'pacientes', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consultas', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      paciente_id: fkPaciente(Sequelize),
      nutricionista_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'nutricionistas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      data: { type: Sequelize.DATEONLY, allowNull: false },
      horario: { type: Sequelize.TIME, allowNull: false },
      tipo: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Retorno' },
      observacoes: Sequelize.TEXT,
      ...timestamps(Sequelize),
    });
    // RN17 - o nutricionista não pode ter duas consultas no mesmo dia e horário
    await queryInterface.addIndex('consultas', ['nutricionista_id', 'data', 'horario'], {
      unique: true,
      name: 'consultas_sem_conflito_de_agenda',
    });
    await queryInterface.addIndex('consultas', ['paciente_id', 'data']);

    // RF21 - evolução de peso e medidas
    await queryInterface.createTable('evolucao_peso', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      paciente_id: fkPaciente(Sequelize),
      data: { type: Sequelize.DATEONLY, allowNull: false },
      peso_kg: { type: Sequelize.FLOAT, allowNull: false },
      gordura_pct: Sequelize.FLOAT,
      massa_magra_pct: Sequelize.FLOAT,
      registrado_por: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'nutricionista' },
      ...timestamps(Sequelize),
    });
    await queryInterface.addIndex('evolucao_peso', ['paciente_id', 'data']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('evolucao_peso');
    await queryInterface.dropTable('consultas');
  },
};
