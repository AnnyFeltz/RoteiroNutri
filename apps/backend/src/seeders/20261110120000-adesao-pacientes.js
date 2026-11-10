'use strict';

/**
 * Adesão de DEMONSTRAÇÃO para os gráficos (RF20/RF21).
 * Preenche as refeições marcadas como consumidas nos últimos dias para TODOS os
 * pacientes ativos com plano ativo (inclusive os cadastrados por você), até ontem.
 * Hoje fica livre para marcar pelo app.
 *
 * - Cada paciente ganha um "perfil" de adesão (ótima, boa, regular ou baixa,
 *   em rodízio), com fins de semana um pouco piores, para os gráficos variarem.
 * - Pode rodar de novo: dias que já têm registro não são duplicados.
 * - Se o primeiro plano do paciente for mais novo que o período, a data dele é
 *   recuada para o início do período (senão esses dias não entram no cálculo).
 *
 * Uso: npm run db:seed:adesao            (últimos 60 dias)
 *      ADESAO_DIAS=90 npm run db:seed:adesao
 * Não há "desfazer" automático: a adesão gerada fica igual à marcada pelo app.
 *
 * NÃO rode em produção.
 */
const { Op } = require('sequelize');
const { sequelize, Paciente, PlanoAlimentar, Refeicao, Adesao } = require('../models');
const { hoje, somarDias } = require('../utils/datas');

const DIAS = Number(process.env.ADESAO_DIAS) || 60;
// perfis em rodízio: cobre as faixas do gráfico (ótima, boa, regular, baixa)
const PERFIS = [0.92, 0.68, 0.4, 0.85, 0.15, 0.6];

// número de 0 a 1 que depende só do texto: o seed é reprodutível
function sorteio(texto) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function fimDeSemana(dataIso) {
  const dia = new Date(`${dataIso}T12:00:00Z`).getUTCDay();
  return dia === 0 || dia === 6;
}

module.exports = {
  async up() {
    const ontem = somarDias(hoje(), -1);
    const inicio = somarDias(ontem, -(DIAS - 1));

    const planos = await PlanoAlimentar.findAll({
      where: { ativo: true },
      include: [
        { model: Paciente, as: 'paciente', where: { ativo: true }, attributes: ['id'] },
        { model: Refeicao, as: 'refeicoes', attributes: ['id'] },
      ],
    });

    planos.sort((x, y) => (x.pacienteId < y.pacienteId ? -1 : 1));

    await sequelize.transaction(async (transaction) => {
      for (const [indice, plano] of planos.entries()) {
        const pacienteId = plano.pacienteId;
        const refeicaoIds = plano.refeicoes.map((r) => r.id);
        if (!refeicaoIds.length) continue;

        // o cálculo de adesão ignora dias anteriores ao primeiro plano
        const primeiro = await PlanoAlimentar.findOne({
          where: { pacienteId },
          order: [['createdAt', 'ASC']],
          transaction,
        });
        if (hoje(primeiro.createdAt) > inicio) {
          await sequelize.query('UPDATE planos_alimentares SET created_at = :data WHERE id = :id', {
            replacements: { data: `${inicio}T12:00:00Z`, id: primeiro.id },
            transaction,
          });
        }

        const jaMarcados = await Adesao.findAll({
          where: { pacienteId, data: { [Op.between]: [inicio, ontem] } },
          attributes: ['data'],
          group: ['data'],
          raw: true,
          transaction,
        });
        const diasComRegistro = new Set(jaMarcados.map((a) => a.data));

        const taxaBase = PERFIS[indice % PERFIS.length];
        const novos = [];
        for (let i = 0; i < DIAS; i++) {
          const data = somarDias(inicio, i);
          if (diasComRegistro.has(data)) continue;
          // melhora um pouco ao longo do período e cai no fim de semana
          const taxa = Math.min(0.98, taxaBase + (i / DIAS) * 0.08 - (fimDeSemana(data) ? 0.15 : 0));
          refeicaoIds.forEach((refeicaoId) => {
            if (sorteio(`${pacienteId}|${refeicaoId}|${data}`) < taxa) {
              novos.push({ refeicaoId, pacienteId, data, consumida: true });
            }
          });
        }
        if (novos.length) await Adesao.bulkCreate(novos, { transaction, ignoreDuplicates: true });
      }
    });
  },

  // sem desfazer: não dá para separar a adesão gerada da que o paciente marcou de verdade
  async down() {},
};
