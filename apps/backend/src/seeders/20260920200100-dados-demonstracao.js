'use strict';

/**
 * Dados de DEMONSTRAÇÃO (para apresentar o TCC e testar localmente).
 * As datas são relativas ao dia em que o seed roda, para o sistema sempre
 * parecer "vivo" (consultas hoje, adesão da última semana, etc).
 *
 * Acessos criados (senha de todos: demo1234):
 *   Nutricionista (web):  caroline@roteironutri.com
 *   Pacientes (mobile):   ana@email.com, joao@email.com, mariana@email.com,
 *                         lucas@email.com, beatriz@email.com
 *
 * NÃO rode em produção. Para desfazer: npm run db:seed:undo:demo
 */
const {
  sequelize, Nutricionista, Paciente, PlanoAlimentar, Refeicao, RefeicaoAlimento,
  Substituto, Adesao, Consulta, EvolucaoPeso,
} = require('../models');
const { gerarHash } = require('../utils/senha');
const { hoje, somarDias } = require('../utils/datas');

const EMAIL_NUTRI = 'caroline@roteironutri.com';
const SENHA_DEMO = 'demo1234';

// ids da TACO
const A = {
  arrozIntegral: 1, aveia: 7, paoIntegral: 52, alface: 78, batataDoce: 88, brocolis: 100, mandioca: 129,
  banana: 182, maca: 222, mamao: 226, melao: 236, morango: 239, azeite: 260, salmao: 317, patinho: 377,
  frango: 410, iogurte: 448, queijoMinas: 461, ovo: 488, merluza: 301, feijaoCarioca: 561, feijaoPreto: 567,
  castanha: 589,
};

const PACIENTES = [
  {
    nome: 'Ana Clara Silva', email: 'ana@email.com', idade: 25, sexo: 'F', alturaCm: 168,
    pesos: [67, 66.2, 65, 63.8, 62.5, 62], pesoMetaKg: 57, gorduraPct: 28, massaMagraPct: 72,
    objetivo: 'emagrecimento', avatarCor: 'oklch(0.55 0.13 45)', telefone: '(41) 99999-1111',
    alergias: 'Lactose (intolerância leve)',
    historicoClinico: 'Sem comorbidades. Exames de sangue dentro do padrão.',
    estiloVida: 'Trabalha 8h em escritório, treina musculação 3x/semana à noite.',
    recordatorioAlimentar: 'Café: pão francês + café com leite. Almoço: arroz, feijão, frango, salada. Jantar: lanche.',
    consultaHoje: '08:00', proxima: { dias: 7, horario: '09:00', tipo: 'Retorno' },
    historico: [
      { dias: -26, tipo: 'Retorno', obs: 'Ajuste no plano alimentar. Adesão de 92%. Paciente relata mais energia.' },
      { dias: -60, tipo: 'Retorno', obs: 'Redução de 1,2kg desde a última consulta. Mantida a estratégia.' },
      { dias: -150, tipo: 'Avaliação', obs: 'Início do acompanhamento. Plano de emagrecimento criado. Meta: -5kg em 6 meses.' },
    ],
  },
  {
    nome: 'João Pedro Souza', email: 'joao@email.com', idade: 32, sexo: 'M', alturaCm: 178,
    pesos: [80, 81, 82, 82.8, 83.5, 84], pesoMetaKg: 88, gorduraPct: 18, massaMagraPct: 82,
    objetivo: 'hipertrofia', avatarCor: 'oklch(0.52 0.13 142)',
    alergias: 'Nenhuma', historicoClinico: 'Saudável.',
    estiloVida: 'Treina musculação 5x/semana, trabalha em home office.',
    recordatorioAlimentar: 'Refeições frequentes, alta ingestão de proteína.',
    consultaHoje: '09:30', proxima: { dias: 14, horario: '10:00', tipo: 'Retorno' },
    historico: [{ dias: -30, tipo: 'Retorno', obs: 'Ganho de 0,7kg. Aumentada a proteína do jantar.' }],
  },
  {
    nome: 'Mariana Lima', email: 'mariana@email.com', idade: 41, sexo: 'F', alturaCm: 162,
    pesos: [74, 73.5, 72.8, 71.5, 70.8, 70], pesoMetaKg: 64, gorduraPct: 32, massaMagraPct: 68,
    objetivo: 'emagrecimento', avatarCor: 'oklch(0.72 0.14 70)',
    alergias: 'Glúten', historicoClinico: 'Hipotireoidismo controlado.',
    estiloVida: 'Caminhadas 3x/semana, rotina corrida.',
    recordatorioAlimentar: 'Alimentação irregular durante a semana.',
    consultaHoje: '11:00', proxima: { dias: 21, horario: '14:00', tipo: 'Avaliação' },
    historico: [],
  },
  {
    nome: 'Lucas Martins', email: 'lucas@email.com', idade: 28, sexo: 'M', alturaCm: 175,
    pesos: [70, 70.5, 71, 71.5, 71.8, 72], pesoMetaKg: 76, gorduraPct: 14, massaMagraPct: 86,
    objetivo: 'performance', avatarCor: 'oklch(0.42 0.09 142)',
    alergias: 'Nenhuma', historicoClinico: 'Atleta amador.',
    estiloVida: 'Corrida 4x/semana + musculação 3x/semana.',
    recordatorioAlimentar: 'Dieta balanceada, alta em carboidratos pré-treino.',
    consultaHoje: '14:00', proxima: { dias: 10, horario: '15:30', tipo: 'Retorno' },
    historico: [{ dias: -40, tipo: 'Retorno', obs: 'Ajuste de carboidratos para provas de 10km.' }],
  },
  {
    nome: 'Beatriz Oliveira', email: 'beatriz@email.com', idade: 36, sexo: 'F', alturaCm: 165,
    pesos: [72, 71, 70, 69.5, 68.8, 68], pesoMetaKg: 62, gorduraPct: 30, massaMagraPct: 70,
    objetivo: 'saude', avatarCor: 'oklch(0.6 0.1 250)',
    alergias: 'Frutos do mar', historicoClinico: 'Colesterol elevado.',
    estiloVida: 'Pilates 2x/semana.',
    recordatorioAlimentar: 'Café da manhã reforçado, almoço executivo, jantar leve.',
    consultaHoje: '16:00', proxima: { dias: 28, horario: '08:30', tipo: 'Avaliação' },
    historico: [{ dias: -35, tipo: 'Retorno', obs: 'Colesterol em queda. Mantida a estratégia.' }],
  },
];

// item: [alimentoId, gramas, [[substitutoId, gramas], ...]]
const REFEICOES_EMAGRECIMENTO = [
  ['Café da manhã', '08:00', [
    [A.paoIntegral, 50, [[A.aveia, 35]]],
    [A.ovo, 100, [[A.queijoMinas, 55]]],
    [A.mamao, 150, [[A.morango, 200], [A.melao, 200]]],
  ]],
  ['Lanche da manhã', '10:00', [
    [A.iogurte, 170, [[A.banana, 90], [A.maca, 150]]],
  ]],
  ['Almoço', '12:30', [
    [A.arrozIntegral, 100, [[A.batataDoce, 160], [A.mandioca, 100]]],
    [A.feijaoCarioca, 80, [[A.feijaoPreto, 80]]],
    [A.frango, 120, [[A.merluza, 155], [A.patinho, 90]]],
    [A.brocolis, 100, [[A.alface, 150]]],
    [A.azeite, 5, []],
  ]],
  ['Lanche da tarde', '16:00', [
    [A.banana, 100, [[A.maca, 175]]],
    [A.castanha, 15, []],
  ]],
  ['Jantar', '19:00', [
    [A.merluza, 150, [[A.salmao, 75], [A.frango, 115]]],
    [A.batataDoce, 120, [[A.arrozIntegral, 75]]],
    [A.brocolis, 100, [[A.alface, 150]]],
  ]],
];

const REFEICOES_HIPERTROFIA = [
  ['Café da manhã', '07:30', [
    [A.aveia, 60, [[A.paoIntegral, 95]]],
    [A.ovo, 150, []],
    [A.banana, 120, [[A.maca, 210]]],
  ]],
  ['Almoço', '12:00', [
    [A.arrozIntegral, 200, [[A.batataDoce, 320]]],
    [A.feijaoPreto, 120, [[A.feijaoCarioca, 120]]],
    [A.patinho, 180, [[A.frango, 250]]],
    [A.brocolis, 100, []],
  ]],
  ['Lanche pré-treino', '16:00', [
    [A.iogurte, 200, []],
    [A.aveia, 30, []],
  ]],
  ['Jantar', '20:00', [
    [A.frango, 180, [[A.salmao, 120]]],
    [A.mandioca, 150, [[A.batataDoce, 245]]],
  ]],
];

async function criarPlano(pacienteId, { nome, versao, ativo, kcalAlvo, macros, refeicoes, criadoEm }, transaction) {
  const plano = await PlanoAlimentar.create(
    { pacienteId, nome, versao, ativo, kcalAlvo, ...macros, createdAt: criadoEm, updatedAt: criadoEm },
    { transaction }
  );
  const ids = [];
  for (const [ordem, [nomeRef, horario, itens]] of refeicoes.entries()) {
    const refeicao = await Refeicao.create({ planoId: plano.id, nome: nomeRef, horario, ordem }, { transaction });
    ids.push(refeicao.id);
    for (const [ordemItem, [alimentoId, gramas, subs]] of itens.entries()) {
      const item = await RefeicaoAlimento.create(
        { refeicaoId: refeicao.id, alimentoId, gramas, ordem: ordemItem },
        { transaction }
      );
      if (subs.length) {
        await Substituto.bulkCreate(
          subs.map(([sid, g]) => ({ refeicaoAlimentoId: item.id, alimentoId: sid, gramas: g })),
          { transaction }
        );
      }
    }
  }
  return { plano, refeicaoIds: ids };
}

module.exports = {
  async up() {
    if (await Nutricionista.findOne({ where: { email: EMAIL_NUTRI } })) {
      console.log('Dados de demonstração já existem — nada a fazer.');
      return;
    }

    const dataHoje = hoje();
    const senhaHash = await gerarHash(SENHA_DEMO);

    await sequelize.transaction(async (transaction) => {
      const nutri = await Nutricionista.create(
        { nome: 'Dra. Caroline', email: EMAIL_NUTRI, senhaHash, crn: 'CRN-8 12345', telefone: '(41) 3333-0000' },
        { transaction }
      );

      for (const [indice, dados] of PACIENTES.entries()) {
        const dataInicio = somarDias(dataHoje, -150);
        const { pesos, consultaHoje, proxima, historico, ...campos } = dados;
        const paciente = await Paciente.create(
          {
            ...campos,
            nutricionistaId: nutri.id,
            senhaHash,
            dataInicio,
            pesoInicialKg: pesos[0],
            pesoAtualKg: pesos[pesos.length - 1],
          },
          { transaction }
        );

        // uma pesagem a cada ~30 dias
        await EvolucaoPeso.bulkCreate(
          pesos.map((peso, i) => ({
            pacienteId: paciente.id,
            data: somarDias(dataInicio, i * 30),
            pesoKg: peso,
          })),
          { transaction }
        );

        // histórico de atendimentos, consulta de hoje e a próxima
        const consultas = [
          ...historico.map((h) => ({ data: somarDias(dataHoje, h.dias), horario: '10:00', tipo: h.tipo, observacoes: h.obs })),
          { data: dataHoje, horario: consultaHoje, tipo: indice % 2 ? 'Avaliação' : 'Retorno' },
          { data: somarDias(dataHoje, proxima.dias), horario: proxima.horario, tipo: proxima.tipo },
        ];
        await Consulta.bulkCreate(
          consultas.map((c) => ({ ...c, pacienteId: paciente.id, nutricionistaId: nutri.id })),
          { transaction }
        );

        // Mariana ainda está sem plano (aparece como "Sem plano" no painel)
        if (dados.email === 'mariana@email.com') continue;

        const hipertrofia = ['hipertrofia', 'performance'].includes(dados.objetivo);
        const refeicoes = hipertrofia ? REFEICOES_HIPERTROFIA : REFEICOES_EMAGRECIMENTO;
        const macros = hipertrofia
          ? { pctCarbo: 50, pctProteina: 25, pctGordura: 25 }
          : { pctCarbo: 40, pctProteina: 30, pctGordura: 30 };

        // versão antiga (encerrada) para mostrar o histórico de versões
        if (dados.email === 'ana@email.com') {
          await criarPlano(paciente.id, {
            nome: 'Plano inicial - Emagrecimento', versao: 1, ativo: false, kcalAlvo: 1800, macros,
            refeicoes: REFEICOES_EMAGRECIMENTO.slice(0, 4), criadoEm: new Date(`${somarDias(dataHoje, -150)}T12:00:00Z`),
          }, transaction);
        }

        const { plano, refeicaoIds } = await criarPlano(paciente.id, {
          nome: hipertrofia ? 'Plano - Ganho de massa' : 'Plano - Emagrecimento',
          versao: dados.email === 'ana@email.com' ? 2 : 1,
          ativo: true,
          kcalAlvo: hipertrofia ? 2800 : 1700,
          macros,
          refeicoes,
          criadoEm: new Date(`${somarDias(dataHoje, -60)}T12:00:00Z`),
        }, transaction);
        await paciente.update({ ultimoPlanoId: plano.id }, { transaction });

        // adesão dos últimos 30 dias (cada paciente com um "perfil" de adesão diferente)
        const taxa = [0.9, 0.75, 0, 0.55, 0.35][indice];
        const adesoes = [];
        for (let d = 30; d >= 1; d--) {
          refeicaoIds.forEach((refeicaoId, r) => {
            // pseudo-aleatório determinístico para o seed ser reprodutível
            const sorteio = ((d * 31 + r * 17 + indice * 7) % 100) / 100;
            if (sorteio < taxa) adesoes.push({ refeicaoId, pacienteId: paciente.id, data: somarDias(dataHoje, -d), consumida: true });
          });
        }
        // hoje: a Ana já marcou café e lanche da manhã
        if (dados.email === 'ana@email.com') {
          adesoes.push(...refeicaoIds.slice(0, 2).map((refeicaoId) => ({ refeicaoId, pacienteId: paciente.id, data: dataHoje, consumida: true })));
        }
        if (adesoes.length) await Adesao.bulkCreate(adesoes, { transaction });
      }
    });
  },

  async down() {
    // apagar o nutricionista remove em cascata pacientes, planos, consultas, etc.
    await Nutricionista.destroy({ where: { email: EMAIL_NUTRI } });
  },
};
