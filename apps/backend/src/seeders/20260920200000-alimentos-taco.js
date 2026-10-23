'use strict';

// Tabela TACO 4ª edição (NEPA/UNICAMP) — 596 alimentos, valores por 100g.
// Dados extraídos de https://github.com/raulfdm/taco-api (licença MIT).
const alimentos = require('./data/taco.json');

module.exports = {
  async up(queryInterface) {
    const linhas = alimentos.map((a) => ({
      id: a.id,
      nome: a.nome,
      categoria: a.categoria,
      kcal_100g: a.kcal100g,
      carboidrato_g: a.carboidratoG,
      proteina_g: a.proteinaG,
      gordura_g: a.gorduraG,
      fibra_g: a.fibraG,
      sodio_mg: a.sodioMg,
      origem: 'TACO',
    }));
    // idempotente: pode rodar de novo sem duplicar
    await queryInterface.bulkInsert('alimentos', linhas, {
      updateOnDuplicate: ['nome', 'categoria', 'kcal_100g', 'carboidrato_g', 'proteina_g', 'gordura_g', 'fibra_g', 'sodio_mg'],
      upsertKeys: ['id'],
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('alimentos', { origem: 'TACO' });
  },
};
