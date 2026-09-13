const { Sequelize } = require('sequelize');
const config = require('../config/config')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    logging: false,
  }
);

const db = { sequelize, Sequelize };

// Cada model se registra em db.<NomeDoModel>
db.Nutricionista = require('./Nutricionista')(sequelize, Sequelize.DataTypes);
db.Paciente = require('./Paciente')(sequelize, Sequelize.DataTypes);

// Associações
db.Nutricionista.hasMany(db.Paciente, {
  foreignKey: 'nutricionistaId',
  as: 'pacientes',
});
db.Paciente.belongsTo(db.Nutricionista, {
  foreignKey: 'nutricionistaId',
  as: 'nutricionista',
});

module.exports = db;
