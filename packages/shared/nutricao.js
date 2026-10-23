// Cálculos nutricionais compartilhados entre backend, web (nutricionista) e mobile (paciente).

const FATOR_ATIVIDADE = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muitoIntenso: 1.9,
};

const OBJETIVO_LABEL = {
  emagrecimento: 'Emagrecimento',
  manutencao: 'Manutenção',
  hipertrofia: 'Hipertrofia',
  saude: 'Saúde geral',
  performance: 'Performance',
};

function mifflinStJeor(peso, altura, idade, sexo) {
  const base = 10 * peso + 6.25 * altura - 5 * idade;
  return sexo === 'M' ? base + 5 : base - 161;
}

function harrisBenedict(peso, altura, idade, sexo) {
  return sexo === 'M'
    ? 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * idade
    : 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * idade;
}

// Gasto energético total = TMB x fator de atividade
function calcularGET(tmb, atividade) {
  return tmb * (FATOR_ATIVIDADE[atividade] || FATOR_ATIVIDADE.moderado);
}

function ajustarParaObjetivo(get, objetivo) {
  switch (objetivo) {
    case 'emagrecimento':
      return get - 500;
    case 'hipertrofia':
      return get + 400;
    case 'performance':
      return get + 250;
    default:
      return get;
  }
}

function macroGramas(kcal, { pctCarbo, pctProteina, pctGordura }) {
  return {
    carbo: Math.round((kcal * (pctCarbo / 100)) / 4),
    proteina: Math.round((kcal * (pctProteina / 100)) / 4),
    gordura: Math.round((kcal * (pctGordura / 100)) / 9),
  };
}

function imc(peso, alturaCm) {
  if (!peso || !alturaCm) return null;
  const m = alturaCm / 100;
  return peso / (m * m);
}

function classificacaoImc(valor) {
  if (valor == null) return '—';
  if (valor < 18.5) return 'Abaixo do peso';
  if (valor < 25) return 'Normal';
  if (valor < 30) return 'Sobrepeso';
  return 'Obesidade';
}

const arred1 = (n) => Math.round(n * 10) / 10;

// Valores de um alimento (por 100g na TACO) para uma gramagem
function calcularAlimento(alimento, gramas) {
  if (!alimento) return { kcal: 0, carbo: 0, proteina: 0, gordura: 0 };
  const f = gramas / 100;
  return {
    kcal: Math.round(alimento.kcal100g * f),
    carbo: arred1(alimento.carboidratoG * f),
    proteina: arred1(alimento.proteinaG * f),
    gordura: arred1(alimento.gorduraG * f),
  };
}

// RN12 - gramagem equivalente: mesma energia do alimento original
function gramasEquivalentes(alimentoOriginal, gramasOriginal, alimentoSubstituto) {
  if (!alimentoOriginal || !alimentoSubstituto || !alimentoSubstituto.kcal100g) return gramasOriginal;
  const kcal = (alimentoOriginal.kcal100g * gramasOriginal) / 100;
  return Math.max(1, Math.round((kcal / alimentoSubstituto.kcal100g) * 100));
}

// Alimento que vale para o paciente: o substituto escolhido ou o original
function itemEfetivo(item) {
  if (item.substitutoEscolhidoId && Array.isArray(item.substitutos)) {
    const s = item.substitutos.find((x) => x.id === item.substitutoEscolhidoId);
    if (s) return { alimento: s.alimento, gramas: s.gramas, substituido: true };
  }
  return { alimento: item.alimento, gramas: item.gramas, substituido: false };
}

function totaisRefeicao(refeicao, { usarSubstitutos = false } = {}) {
  const acc = { kcal: 0, carbo: 0, proteina: 0, gordura: 0 };
  for (const item of refeicao.itens || []) {
    const { alimento, gramas } = usarSubstitutos ? itemEfetivo(item) : item;
    const c = calcularAlimento(alimento, gramas);
    acc.kcal += c.kcal;
    acc.carbo += c.carbo;
    acc.proteina += c.proteina;
    acc.gordura += c.gordura;
  }
  return { kcal: acc.kcal, carbo: arred1(acc.carbo), proteina: arred1(acc.proteina), gordura: arred1(acc.gordura) };
}

function totaisPlano(plano, opcoes) {
  return (plano.refeicoes || []).reduce(
    (acc, r) => {
      const t = totaisRefeicao(r, opcoes);
      return {
        kcal: acc.kcal + t.kcal,
        carbo: arred1(acc.carbo + t.carbo),
        proteina: arred1(acc.proteina + t.proteina),
        gordura: arred1(acc.gordura + t.gordura),
      };
    },
    { kcal: 0, carbo: 0, proteina: 0, gordura: 0 }
  );
}

// Progresso (0-100) do peso inicial em direção à meta
function progressoMeta(pesoInicial, pesoAtual, pesoMeta) {
  if (!pesoInicial || !pesoAtual || !pesoMeta || pesoInicial === pesoMeta) return 0;
  const p = ((pesoInicial - pesoAtual) / (pesoInicial - pesoMeta)) * 100;
  return Math.max(0, Math.min(100, Math.round(p)));
}

// Ícone por categoria da TACO
const ICONE_CATEGORIA = {
  'Cereais e derivados': '🌾',
  'Verduras, hortaliças e derivados': '🥦',
  'Frutas e derivados': '🍓',
  'Gorduras e óleos': '🫒',
  'Pescados e frutos do mar': '🐟',
  'Carnes e derivados': '🍗',
  'Leite e derivados': '🥛',
  'Bebidas (alcoólicas e não alcoólicas)': '🥤',
  'Ovos e derivados': '🥚',
  'Produtos açucarados': '🍯',
  'Miscelâneas': '🧂',
  'Outros alimentos industrializados': '🥫',
  'Alimentos preparados': '🍲',
  'Leguminosas e derivados': '🫘',
  'Nozes e sementes': '🥜',
};

function iconeAlimento(alimento) {
  return (alimento && ICONE_CATEGORIA[alimento.categoria]) || '🍽️';
}

module.exports = {
  FATOR_ATIVIDADE,
  OBJETIVO_LABEL,
  ICONE_CATEGORIA,
  mifflinStJeor,
  harrisBenedict,
  calcularGET,
  ajustarParaObjetivo,
  macroGramas,
  imc,
  classificacaoImc,
  calcularAlimento,
  gramasEquivalentes,
  itemEfetivo,
  totaisRefeicao,
  totaisPlano,
  progressoMeta,
  iconeAlimento,
};
