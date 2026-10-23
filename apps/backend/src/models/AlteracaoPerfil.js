module.exports = (sequelize, DataTypes) => {
  const AlteracaoPerfil = sequelize.define(
    'AlteracaoPerfil',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pacienteId: { type: DataTypes.UUID, allowNull: false, field: 'paciente_id' },
      nutricionistaId: { type: DataTypes.UUID, allowNull: false, field: 'nutricionista_id' },
      campo: { type: DataTypes.STRING, allowNull: false },
      valorAntigo: { type: DataTypes.TEXT, field: 'valor_antigo' },
      valorNovo: { type: DataTypes.TEXT, field: 'valor_novo' },
      lida: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: 'alteracoes_perfil',
      underscored: true,
      timestamps: true,
      updatedAt: false,
    }
  );

  return AlteracaoPerfil;
};
