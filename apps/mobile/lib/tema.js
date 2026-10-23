import { Platform } from 'react-native'

// Mesma paleta do protótipo (convertida de oklch para hex)
export const cores = {
  fundo: '#faf7ec',
  texto: '#162316',
  card: '#fffdf9',
  primaria: '#2e5929',
  primariaTexto: '#faf8f1',
  folha: '#367b30',
  folhaEscura: '#1c4219',
  suave: '#efebe0',
  textoSuave: '#5e6657',
  destaque: '#f2e2d0',
  terracota: '#ae5528',
  areia: '#ece4d2',
  creme: '#f9f5eb',
  perigo: '#c53732',
  borda: '#dbd7cd',
  carbo: '#dc932e',
  branco: '#ffffff',
}

// Fonte serifada para títulos (equivalente ao Fraunces do protótipo)
export const fonteTitulo = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' })
export const fonteMono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })

export const raio = 14
