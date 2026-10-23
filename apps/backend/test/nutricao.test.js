const test = require('node:test');
const assert = require('node:assert/strict');
const {
  mifflinStJeor, calcularAlimento, gramasEquivalentes, itemEfetivo, totaisRefeicao, progressoMeta, imc, classificacaoImc,
  planoAlimentarSchema,
} = require('@RoteiroNutri/shared');

const arroz = { kcal100g: 124, carboidratoG: 25.8, proteinaG: 2.6, gorduraG: 1 };
const batata = { kcal100g: 77, carboidratoG: 18.4, proteinaG: 0.6, gorduraG: 0.1 };

test('Mifflin-St Jeor (mulher 62kg, 168cm, 25 anos)', () => {
  assert.equal(Math.round(mifflinStJeor(62, 168, 25, 'F')), 1384);
});

test('calcula macros de um alimento pela gramagem', () => {
  assert.deepEqual(calcularAlimento(arroz, 150), { kcal: 186, carbo: 38.7, proteina: 3.9, gordura: 1.5 });
});

test('RN12 - substituto recebe gramagem com a mesma energia', () => {
  // 100g de arroz = 124 kcal -> ~161g de batata doce
  assert.equal(gramasEquivalentes(arroz, 100, batata), 161);
});

test('RN13 - item efetivo usa o substituto escolhido pelo paciente', () => {
  const item = {
    alimento: arroz,
    gramas: 100,
    substitutoEscolhidoId: 's1',
    substitutos: [{ id: 's1', alimento: batata, gramas: 160 }],
  };
  assert.equal(itemEfetivo(item).alimento, batata);
  assert.equal(totaisRefeicao({ itens: [item] }, { usarSubstitutos: true }).kcal, 123);
  assert.equal(totaisRefeicao({ itens: [item] }).kcal, 124);
});

test('progresso até a meta (perda e ganho de peso)', () => {
  assert.equal(progressoMeta(67, 62, 57), 50);
  assert.equal(progressoMeta(80, 84, 88), 50);
  assert.equal(progressoMeta(67, 70, 57), 0);
});

test('IMC e classificação', () => {
  assert.equal(imc(62, 168).toFixed(1), '22.0');
  assert.equal(classificacaoImc(31), 'Obesidade');
});

test('plano exige macros somando 100%', () => {
  const base = { nome: 'Plano', kcalAlvo: 1700, pctProteina: 30, pctGordura: 30, refeicoes: [{ nome: 'Café', horario: '08:00', itens: [] }] };
  assert.equal(planoAlimentarSchema.safeParse({ ...base, pctCarbo: 40 }).success, true);
  assert.equal(planoAlimentarSchema.safeParse({ ...base, pctCarbo: 50 }).success, false);
});
