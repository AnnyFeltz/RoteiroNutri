module.exports = (sequelize, DataTypes) => {
  const Paciente = sequelize.define(
    'Paciente',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nutricionistaId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'nutricionista_id',
      },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      senhaHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'senha_hash',
      },
      tokenRecuperacao: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'token_recuperacao',
      },
      tokenExpiraEm: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'token_expira_em',
      },
      idade: DataTypes.INTEGER,
      sexo: DataTypes.CHAR(1),
      alturaCm: { type: DataTypes.FLOAT, field: 'altura_cm' },
      pesoInicialKg: { type: DataTypes.FLOAT, field: 'peso_inicial_kg' },
      pesoAtualKg: { type: DataTypes.FLOAT, field: 'peso_atual_kg' },
      pesoMetaKg: { type: DataTypes.FLOAT, field: 'peso_meta_kg' },
      gorduraPct: { type: DataTypes.FLOAT, field: 'gordura_pct' },
      massaMagraPct: { type: DataTypes.FLOAT, field: 'massa_magra_pct' },
      objetivo: DataTypes.STRING,
      alergias: DataTypes.TEXT,
      historicoClinico: { type: DataTypes.TEXT, field: 'historico_clinico' },
      estiloVida: { type: DataTypes.TEXT, field: 'estilo_vida' },
      recordatorioAlimentar: { type: DataTypes.TEXT, field: 'recordatorio_alimentar' },
      dataInicio: { type: DataTypes.DATEONLY, field: 'data_inicio' },
      // RN03/RN04 - o nutricionista pode desativar o paciente
      ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'pacientes',
      underscored: true,
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ['senhaHash', 'tokenRecuperacao', 'tokenExpiraEm'] },
      },
      scopes: {
        comSenha: { attributes: {} },
      },
    }
  );

  return Paciente;
};
