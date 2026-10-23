const { hhmm } = require('../utils/datas');

module.exports = (sequelize, DataTypes) => {
  const Refeicao = sequelize.define(
    'Refeicao',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      planoId: { type: DataTypes.UUID, allowNull: false, field: 'plano_id' },
      nome: { type: DataTypes.STRING, allowNull: false },
      horario: {
        type: DataTypes.TIME,
        allowNull: false,
        // o Postgres devolve "08:00:00"; a API trabalha com "08:00"
        get() {
          return hhmm(this.getDataValue('horario'));
        },
      },
      ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'refeicoes',
      underscored: true,
      timestamps: false,
    }
  );

  return Refeicao;
};
