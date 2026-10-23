import { progressoMeta } from '@RoteiroNutri/shared'

/** Conquistas calculadas a partir dos dados reais do paciente. */
export function conquistas(perfil, evolucao) {
  if (!perfil || !evolucao) return []
  const p = evolucao.paciente
  const inicial = p.pesoInicialKg ?? evolucao.registros[0]?.pesoKg
  const variacao = p.pesoAtualKg != null && inicial != null ? Math.abs(p.pesoAtualKg - inicial) : 0
  const progresso = progressoMeta(inicial, p.pesoAtualKg, p.pesoMetaKg)
  const dias = evolucao.diasDeAcompanhamento
  const seq = evolucao.sequenciaDias
  const hoje = evolucao.adesaoSemanal[evolucao.adesaoSemanal.length - 1]
  const mediaMeses = evolucao.adesaoMensal.slice(-1)[0]?.pct ?? 0
  const pesagens = evolucao.registros.length

  return [
    { icone: '🌱', titulo: 'Primeira semana', descricao: 'Completou os primeiros 7 dias de acompanhamento', obtida: dias >= 7, categoria: 'Início' },
    { icone: '📋', titulo: 'Avaliação inicial', descricao: 'Primeira pesagem registrada', obtida: pesagens >= 1, categoria: 'Início' },
    { icone: '🍽️', titulo: 'Plano ativo', descricao: 'Possui um plano alimentar em curso', obtida: !!perfil.planoAtivo, categoria: 'Plano' },
    { icone: '✅', titulo: 'Refeição do dia', descricao: 'Marcou ao menos uma refeição hoje', obtida: (hoje?.consumidas ?? 0) > 0, categoria: 'Adesão' },
    { icone: '🔥', titulo: '7 dias de sequência', descricao: 'Registrou refeições 7 dias seguidos', obtida: seq >= 7, categoria: 'Adesão' },
    { icone: '🧘', titulo: 'Equilíbrio', descricao: 'Adesão acima de 80% no mês', obtida: mediaMeses >= 80, categoria: 'Adesão' },
    { icone: '📈', titulo: '30 dias de uso', descricao: 'Um mês de acompanhamento', obtida: dias >= 30, categoria: 'Engajamento' },
    { icone: '⚖️', titulo: 'Disciplina na balança', descricao: '5 pesagens registradas', obtida: pesagens >= 5, categoria: 'Engajamento' },
    { icone: '🎯', titulo: `${variacao.toFixed(1)} kg de variação`, descricao: 'Mudança desde o início', obtida: variacao >= 1, categoria: 'Evolução' },
    { icone: '🥇', titulo: '50% até a meta', descricao: 'Metade do caminho percorrido', obtida: progresso >= 50, categoria: 'Evolução' },
    { icone: '🏆', titulo: 'Meta atingida', descricao: 'Chegou na meta de peso', obtida: progresso >= 100, categoria: 'Evolução' },
    { icone: '💪', titulo: 'Constância de ouro', descricao: '100 dias de acompanhamento', obtida: dias >= 100, categoria: 'Engajamento' },
    { icone: '👑', titulo: 'Mentor de hábitos', descricao: '1 ano completo no Roteiro Nutri', obtida: dias >= 365, categoria: 'Engajamento' },
  ]
}
