const { Refeicao, RefeicaoAlimento, Substituto, Alimento } = require('../models');

const ATRIBUTOS_ALIMENTO = ['id', 'nome', 'categoria', 'kcal100g', 'carboidratoG', 'proteinaG', 'gorduraG', 'fibraG'];

// Include/order padrão para carregar um plano completo:
// plano -> refeições -> itens (alimento) -> substitutos (alimento)
const includePlanoCompleto = [
  {
    model: Refeicao,
    as: 'refeicoes',
    include: [
      {
        model: RefeicaoAlimento,
        as: 'itens',
        include: [
          { model: Alimento, as: 'alimento', attributes: ATRIBUTOS_ALIMENTO },
          {
            model: Substituto,
            as: 'substitutos',
            include: [{ model: Alimento, as: 'alimento', attributes: ATRIBUTOS_ALIMENTO }],
          },
        ],
      },
    ],
  },
];

const orderPlanoCompleto = [
  [{ model: Refeicao, as: 'refeicoes' }, 'ordem', 'ASC'],
  [{ model: Refeicao, as: 'refeicoes' }, 'horario', 'ASC'],
  [{ model: Refeicao, as: 'refeicoes' }, { model: RefeicaoAlimento, as: 'itens' }, 'ordem', 'ASC'],
];

module.exports = { includePlanoCompleto, orderPlanoCompleto, ATRIBUTOS_ALIMENTO };
