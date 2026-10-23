module.exports = (sequelize, DataTypes) => {
  const Alimento = sequelize.define(
    'Alimento',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      categoria: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kcal100g: { type: DataTypes.FLOAT, allowNull: false, field: 'kcal_100g' },
      carboidratoG: { type: DataTypes.FLOAT, allowNull: false, field: 'carboidrato_g' },
      proteinaG: { type: DataTypes.FLOAT, allowNull: false, field: 'proteina_g' },
      gorduraG: { type: DataTypes.FLOAT, allowNull: false, field: 'gordura_g' },
      fibraG: { type: DataTypes.FLOAT, allowNull: false, field: 'fibra_g' },
      sodioMg: { type: DataTypes.FLOAT, allowNull: false, field: 'sodio_mg' },
      origem: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'TACO',
      },
    },
    {
      tableName: 'alimentos',
      underscored: true,
      timestamps: false,
    }
  );

  return Alimento;
};
