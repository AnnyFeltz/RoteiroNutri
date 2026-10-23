module.exports = (sequelize, DataTypes) => {
  const EvolucaoPeso = sequelize.define(
    'EvolucaoPeso',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pacienteId: { type: DataTypes.UUID, allowNull: false, field: 'paciente_id' },
      data: { type: DataTypes.DATEONLY, allowNull: false },
      pesoKg: { type: DataTypes.FLOAT, allowNull: false, field: 'peso_kg' },
      gorduraPct: { type: DataTypes.FLOAT, field: 'gordura_pct' },
      massaMagraPct: { type: DataTypes.FLOAT, field: 'massa_magra_pct' },
      registradoPor: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'nutricionista',
        field: 'registrado_por',
      },
    },
    {
      tableName: 'evolucao_peso',
      underscored: true,
      timestamps: true,
    }
  );

  return EvolucaoPeso;
};
