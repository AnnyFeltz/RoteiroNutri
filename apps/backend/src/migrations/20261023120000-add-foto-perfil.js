'use strict';

// Foto de perfil (imagem em base64, já reduzida pelo front para ~256px)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('nutricionistas', 'foto', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('pacientes', 'foto', { type: Sequelize.TEXT, allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pacientes', 'foto');
    await queryInterface.removeColumn('nutricionistas', 'foto');
  },
};
