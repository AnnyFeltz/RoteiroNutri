import { OBJETIVO_LABEL } from '@RoteiroNutri/shared'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

/** "2026-10-23" -> "23/10/2026" */
export function dataBR(iso) {
  if (!iso) return '—'
  const [a, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

/** Timestamp ISO -> "23/10/2026" no fuso local */
export function dataHoraBR(iso, comHora = false) {
  if (!iso) return '—'
  const d = new Date(iso)
  return comHora ? d.toLocaleString('pt-BR') : d.toLocaleDateString('pt-BR')
}

/** Date local -> "2026-10-23" */
export function isoLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** "2026-10-23" -> Date local (meia-noite) */
export function paraDate(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function dataExtenso(iso) {
  const d = paraDate(iso)
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

export function diaSemana(iso) {
  return DIAS_SEMANA[paraDate(iso).getDay()]
}

export function mesCurto(iso) {
  const [a, m] = iso.split('-')
  return `${MESES_CURTOS[Number(m) - 1]}/${a.slice(2)}`
}

export { MESES, MESES_CURTOS }

export function iniciais(nome = '') {
  return nome
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function objetivoLabel(objetivo) {
  return OBJETIVO_LABEL[objetivo] || objetivo || '—'
}

export function kg(valor) {
  return valor == null ? '—' : `${Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`
}

export function sinal(valor, casas = 1) {
  if (valor == null || Number.isNaN(valor)) return '—'
  const n = Number(valor.toFixed(casas))
  return `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR')}`
}
