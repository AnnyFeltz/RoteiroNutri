module.exports = (sequelize, DataTypes) => {
  const SolicitacaoSenha = sequelize.define(
    'SolicitacaoSenha',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pacienteId: { type: DataTypes.UUID, allowNull: false, field: 'paciente_id' },
      nutricionistaId: { type: DataTypes.UUID, allowNull: false, field: 'nutricionista_id' },
      status: {
        type: DataTypes.ENUM('pendente', 'aprovada', 'negada'),
        allowNull: false,
        defaultValue: 'pendente',
      },
      resolvidaEm: { type: DataTypes.DATE, field: 'resolvida_em' },
    },
    {
      tableName: 'solicitacoes_senha',
      underscored: true,
      timestamps: true,
      updatedAt: false,
    }
  );

  return SolicitacaoSenha;
};
