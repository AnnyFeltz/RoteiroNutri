'use strict';

// Tabela TACO (Tabela Brasileira de Composição de Alimentos) — valores por 100g.
// O id segue a numeração oficial da TACO, por isso é INTEGER e não UUID.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('alimentos', {
      id: { type: Sequelize.INTEGER, primaryKey: true },
      nome: { type: Sequelize.STRING, allowNull: false },
      categoria: { type: Sequelize.STRING, allowNull: false },
      kcal_100g: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      carboidrato_g: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      proteina_g: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      gordura_g: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      fibra_g: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      sodio_mg: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      origem: { type: Sequelize.STRING, allowNull: false, defaultValue: 'TACO' },
    });
    await queryInterface.addIndex('alimentos', ['categoria']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('alimentos');
  },
};
