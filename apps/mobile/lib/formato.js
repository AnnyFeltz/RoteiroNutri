import { OBJETIVO_LABEL } from '@RoteiroNutri/shared'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

export function dataBR(iso) {
  if (!iso) return '—'
  const [a, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export function diaMes(iso) {
  return iso ? dataBR(iso).slice(0, 5) : '—'
}

export function mesAno(iso) {
  if (!iso) return '—'
  const [a, m] = iso.split('-')
  return `${MESES[Number(m) - 1]}/${a}`
}

export function mesCurto(iso) {
  const m = MESES[Number(iso.split('-')[1]) - 1]
  return m.charAt(0).toUpperCase() + m.slice(1)
}

export function dataExtensa(d = new Date()) {
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
}

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

export function num(v, casas = 1) {
  if (v == null || Number.isNaN(v)) return '—'
  return Number(v.toFixed(casas)).toLocaleString('pt-BR')
}

export function sinal(v) {
  if (v == null || Number.isNaN(v)) return '—'
  const n = Number(v.toFixed(1))
  return `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR')}`
}

export function saudacao(h = new Date().getHours()) {
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
