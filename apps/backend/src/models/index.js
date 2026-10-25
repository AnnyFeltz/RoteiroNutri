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
const MODELS = [
  'Nutricionista',
  'Paciente',
  'Alimento',
  'PlanoAlimentar',
  'Refeicao',
  'RefeicaoAlimento',
  'Substituto',
  'Adesao',
  'Consulta',
  'EvolucaoPeso',
  'AlteracaoPerfil',
];
for (const nome of MODELS) {
  db[nome] = require(`./${nome}`)(sequelize, Sequelize.DataTypes);
}

const {
  Nutricionista, Paciente, Alimento, PlanoAlimentar, Refeicao, RefeicaoAlimento,
  Substituto, Adesao, Consulta, EvolucaoPeso, AlteracaoPerfil,
} = db;

// Associações (seguem o modelo relacional do TCC)
Nutricionista.hasMany(Paciente, { foreignKey: 'nutricionistaId', as: 'pacientes' });
Paciente.belongsTo(Nutricionista, { foreignKey: 'nutricionistaId', as: 'nutricionista' });

Paciente.hasMany(PlanoAlimentar, { foreignKey: 'pacienteId', as: 'planos' });
PlanoAlimentar.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'paciente' });

PlanoAlimentar.hasMany(Refeicao, { foreignKey: 'planoId', as: 'refeicoes' });
Refeicao.belongsTo(PlanoAlimentar, { foreignKey: 'planoId', as: 'plano' });

Refeicao.hasMany(RefeicaoAlimento, { foreignKey: 'refeicaoId', as: 'itens' });
RefeicaoAlimento.belongsTo(Refeicao, { foreignKey: 'refeicaoId', as: 'refeicao' });
RefeicaoAlimento.belongsTo(Alimento, { foreignKey: 'alimentoId', as: 'alimento' });

RefeicaoAlimento.hasMany(Substituto, { foreignKey: 'refeicaoAlimentoId', as: 'substitutos' });
Substituto.belongsTo(RefeicaoAlimento, { foreignKey: 'refeicaoAlimentoId', as: 'item' });
Substituto.belongsTo(Alimento, { foreignKey: 'alimentoId', as: 'alimento' });

Refeicao.hasMany(Adesao, { foreignKey: 'refeicaoId', as: 'adesoes' });
Adesao.belongsTo(Refeicao, { foreignKey: 'refeicaoId', as: 'refeicao' });
Paciente.hasMany(Adesao, { foreignKey: 'pacienteId', as: 'adesoes' });

Paciente.hasMany(Consulta, { foreignKey: 'pacienteId', as: 'consultas' });
Consulta.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'paciente' });
Nutricionista.hasMany(Consulta, { foreignKey: 'nutricionistaId', as: 'consultas' });

Paciente.hasMany(EvolucaoPeso, { foreignKey: 'pacienteId', as: 'evolucao' });
EvolucaoPeso.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'paciente' });

AlteracaoPerfil.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'paciente' });

module.exports = db;
