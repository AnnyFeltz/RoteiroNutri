module.exports = (sequelize, DataTypes) => {
  const Adesao = sequelize.define(
    'Adesao',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      refeicaoId: { type: DataTypes.UUID, allowNull: false, field: 'refeicao_id' },
      pacienteId: { type: DataTypes.UUID, allowNull: false, field: 'paciente_id' },
      data: { type: DataTypes.DATEONLY, allowNull: false },
      consumida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'adesoes',
      underscored: true,
      timestamps: true,
    }
  );

  return Adesao;
};
