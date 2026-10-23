module.exports = (sequelize, DataTypes) => {
  const Substituto = sequelize.define(
    'Substituto',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      refeicaoAlimentoId: { type: DataTypes.UUID, allowNull: false, field: 'refeicao_alimento_id' },
      alimentoId: { type: DataTypes.INTEGER, allowNull: false, field: 'alimento_id' },
      gramas: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
      tableName: 'substitutos',
      underscored: true,
      timestamps: false,
    }
  );

  return Substituto;
};
