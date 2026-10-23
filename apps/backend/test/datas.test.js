const test = require('node:test');
const assert = require('node:assert/strict');

process.env.APP_TZ = 'America/Sao_Paulo';
const { hoje, somarDias, diferencaDias } = require('../src/utils/datas');
const { sequenciaDias, mediaAdesao } = require('../src/services/adesaoService');

test('"hoje" respeita o fuso do consultório', () => {
  // 01:30 UTC de 24/10 ainda é 23/10 em São Paulo
  assert.equal(hoje(new Date('2026-10-24T01:30:00Z')), '2026-10-23');
});

test('soma e diferença de dias atravessando o mês', () => {
  assert.equal(somarDias('2026-10-30', 3), '2026-11-02');
  assert.equal(diferencaDias('2026-10-30', '2026-11-02'), 3);
});

test('sequência conta dias seguidos com refeição registrada', () => {
  const dias = [
    { data: '2026-10-20', consumidas: 2, pct: 40 },
    { data: '2026-10-21', consumidas: 0, pct: 0 },
    { data: '2026-10-22', consumidas: 3, pct: 60 },
    { data: '2026-10-23', consumidas: 5, pct: 100 },
  ];
  assert.equal(sequenciaDias(dias, '2026-10-23'), 2);
  // hoje ainda sem registro: conta a partir de ontem
  assert.equal(sequenciaDias(dias, '2026-10-24'), 2);
  assert.equal(mediaAdesao(dias), 50);
});
