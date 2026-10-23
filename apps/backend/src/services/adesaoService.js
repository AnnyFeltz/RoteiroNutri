const { Op, fn, col } = require('sequelize');
const { Adesao, PlanoAlimentar, Refeicao } = require('../models');
const { hoje, somarDias, diferencaDias } = require('../utils/datas');

/**
 * Adesão diária (RF20) de vários pacientes entre `inicio` e `fim` (AAAA-MM-DD).
 * Para cada dia: refeições consumidas / refeições do plano ativo.
 * Dias anteriores ao primeiro plano do paciente não entram no cálculo.
 *
 * @returns {Promise<Record<string, {data: string, consumidas: number, total: number, pct: number}[]>>}
 */
async function adesaoDiaria(pacienteIds, inicio, fim = hoje()) {
  const resultado = {};
  if (!pacienteIds.length) return resultado;

  const planosAtivos = await PlanoAlimentar.findAll({
    where: { pacienteId: pacienteIds, ativo: true },
    attributes: ['id', 'pacienteId'],
    include: [{ model: Refeicao, as: 'refeicoes', attributes: ['id'] }],
  });
  const primeiroPlano = await PlanoAlimentar.findAll({
    where: { pacienteId: pacienteIds },
    attributes: ['pacienteId', [fn('MIN', col('created_at')), 'inicio']],
    group: ['paciente_id'],
    raw: true,
  });
  const consumos = await Adesao.findAll({
    where: { pacienteId: pacienteIds, consumida: true, data: { [Op.between]: [inicio, fim] } },
    attributes: ['pacienteId', 'data', [fn('COUNT', col('id')), 'qtd']],
    group: ['paciente_id', 'data'],
    raw: true,
  });

  const totalPorPaciente = Object.fromEntries(planosAtivos.map((p) => [p.pacienteId, p.refeicoes.length]));
  const inicioPorPaciente = Object.fromEntries(
    primeiroPlano.map((p) => [p.pacienteId, hoje(new Date(p.inicio))])
  );
  const consumoPorChave = Object.fromEntries(consumos.map((c) => [`${c.pacienteId}|${c.data}`, Number(c.qtd)]));

  const dias = diferencaDias(inicio, fim);
  for (const id of pacienteIds) {
    const total = totalPorPaciente[id] || 0;
    const comecou = inicioPorPaciente[id];
    const lista = [];
    for (let i = 0; i <= dias; i++) {
      const data = somarDias(inicio, i);
      if (!total || !comecou || data < comecou) continue;
      const consumidas = Math.min(total, consumoPorChave[`${id}|${data}`] || 0);
      lista.push({ data, consumidas, total, pct: Math.round((consumidas / total) * 100) });
    }
    resultado[id] = lista;
  }
  return resultado;
}

/** Média (0-100) de uma lista de dias; null se não houver dias. */
function mediaAdesao(dias) {
  if (!dias || !dias.length) return null;
  return Math.round(dias.reduce((s, d) => s + d.pct, 0) / dias.length);
}

/** Dias seguidos (até hoje, ou ontem se hoje ainda não houve registro) com ao menos uma refeição consumida. */
function sequenciaDias(dias, dataHoje = hoje()) {
  const porData = Object.fromEntries(dias.map((d) => [d.data, d.consumidas]));
  let cursor = porData[dataHoje] ? dataHoje : somarDias(dataHoje, -1);
  let seq = 0;
  while (porData[cursor]) {
    seq++;
    cursor = somarDias(cursor, -1);
  }
  return seq;
}

module.exports = { adesaoDiaria, mediaAdesao, sequenciaDias };
