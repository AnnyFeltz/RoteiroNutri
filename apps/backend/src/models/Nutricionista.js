module.exports = (sequelize, DataTypes) => {
  const Nutricionista = sequelize.define(
    'Nutricionista',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
      crn: {
        type: DataTypes.STRING,
        allowNull: false,
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
    },
    {
      tableName: 'nutricionistas',
      underscored: true,
      timestamps: true,
      defaultScope: {
        // nunca retorna a senha/token por padrão nas consultas
        attributes: { exclude: ['senhaHash', 'tokenRecuperacao', 'tokenExpiraEm'] },
      },
      scopes: {
        comSenha: { attributes: {} },
      },
    }
  );

  return Nutricionista;
};
