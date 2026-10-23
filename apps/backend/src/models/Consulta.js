const { hhmm } = require('../utils/datas');

module.exports = (sequelize, DataTypes) => {
  const Consulta = sequelize.define(
    'Consulta',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      pacienteId: { type: DataTypes.UUID, allowNull: false, field: 'paciente_id' },
      nutricionistaId: { type: DataTypes.UUID, allowNull: false, field: 'nutricionista_id' },
      data: { type: DataTypes.DATEONLY, allowNull: false },
      horario: {
        type: DataTypes.TIME,
        allowNull: false,
        // o Postgres devolve "08:00:00"; a API trabalha com "08:00"
        get() {
          return hhmm(this.getDataValue('horario'));
        },
      },
      tipo: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Retorno' },
      observacoes: DataTypes.TEXT,
    },
    {
      tableName: 'consultas',
      underscored: true,
      timestamps: true,
    }
  );

  return Consulta;
};
