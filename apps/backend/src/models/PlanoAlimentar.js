module.exports = (sequelize, DataTypes) => {
  const PlanoAlimentar = sequelize.define(
    'PlanoAlimentar',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pacienteId: { type: DataTypes.UUID, allowNull: false, field: 'paciente_id' },
      nome: { type: DataTypes.STRING, allowNull: false },
      versao: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      // RN07 - apenas um plano ativo por paciente
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      kcalAlvo: { type: DataTypes.INTEGER, allowNull: false, field: 'kcal_alvo' },
      pctCarbo: { type: DataTypes.INTEGER, allowNull: false, field: 'pct_carbo' },
      pctProteina: { type: DataTypes.INTEGER, allowNull: false, field: 'pct_proteina' },
      pctGordura: { type: DataTypes.INTEGER, allowNull: false, field: 'pct_gordura' },
    },
    {
      tableName: 'planos_alimentares',
      underscored: true,
      timestamps: true,
    }
  );

  return PlanoAlimentar;
};
