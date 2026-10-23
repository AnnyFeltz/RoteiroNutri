module.exports = (sequelize, DataTypes) => {
  const RefeicaoAlimento = sequelize.define(
    'RefeicaoAlimento',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      refeicaoId: { type: DataTypes.UUID, allowNull: false, field: 'refeicao_id' },
      alimentoId: { type: DataTypes.INTEGER, allowNull: false, field: 'alimento_id' },
      gramas: { type: DataTypes.FLOAT, allowNull: false },
      ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      // RN13 - substituto escolhido pelo paciente (null = alimento original)
      substitutoEscolhidoId: { type: DataTypes.UUID, field: 'substituto_escolhido_id' },
    },
    {
      tableName: 'refeicao_alimentos',
      underscored: true,
      timestamps: false,
    }
  );

  return RefeicaoAlimento;
};
