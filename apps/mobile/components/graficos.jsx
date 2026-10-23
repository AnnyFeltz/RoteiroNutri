import { View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop, Text as SvgText } from 'react-native-svg'
import { cores } from '../lib/tema'

/** Anel de progresso (ex: kcal consumidas / meta). */
export function Anel({ pct, tamanho = 112, espessura = 14, cor = cores.primaria, fundo = cores.suave, children }) {
  const r = (tamanho - espessura) / 2
  const circ = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, pct))
  return (
    <View style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tamanho} height={tamanho} style={{ position: 'absolute' }}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={r} stroke={fundo} strokeWidth={espessura} fill="none" />
        {p > 0 && (
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          stroke={cor}
          strokeWidth={espessura}
          fill="none"
          strokeDasharray={`${(circ * p) / 100} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
        )}
      </Svg>
      {children}
    </View>
  )
}

/** Barras verticais simples (adesão semanal). */
export function Barras({ dados, largura = 300, altura = 96, destaqueUltimo = true }) {
  const n = dados.length || 1
  const espaco = largura / n
  const larguraBarra = Math.min(28, espaco * 0.6)
  const alturaUtil = altura - 18
  return (
    <Svg width={largura} height={altura}>
      {dados.map((d, i) => {
        const h = Math.max(3, (alturaUtil * Math.min(100, d.valor)) / 100)
        const x = i * espaco + (espaco - larguraBarra) / 2
        const ultimo = destaqueUltimo && i === n - 1
        return (
          <Rect key={i} x={x} y={alturaUtil - h} width={larguraBarra} height={h} rx={6} fill={ultimo ? cores.primaria : cores.folha} opacity={ultimo ? 1 : 0.45} />
        )
      })}
      {dados.map((d, i) => (
        <SvgText key={`t${i}`} x={i * espaco + espaco / 2} y={altura - 2} fontSize={10} fill={cores.textoSuave} textAnchor="middle">
          {d.rotulo}
        </SvgText>
      ))}
    </Svg>
  )
}

/** Linha/área (evolução de peso, adesão mensal). */
export function Linha({ dados, largura = 300, altura = 180, cor = cores.primaria, area = true, minimo, maximo, sufixo = '' }) {
  if (!dados.length) return null
  const valores = dados.map((d) => d.valor)
  const min = minimo ?? Math.floor(Math.min(...valores) - 1)
  const max = maximo ?? Math.ceil(Math.max(...valores) + 1)
  const esq = 34
  const base = altura - 20
  const passo = dados.length > 1 ? (largura - esq - 10) / (dados.length - 1) : 0
  const x = (i) => esq + (dados.length > 1 ? i * passo : (largura - esq) / 2)
  const y = (v) => 8 + ((max - v) / (max - min || 1)) * (base - 8)
  const caminho = dados.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.valor)}`).join(' ')
  const caminhoArea = `${caminho} L${x(dados.length - 1)},${base} L${x(0)},${base} Z`
  const marcas = [max, (max + min) / 2, min]
  const rotulosVisiveis = Math.ceil(dados.length / 6)

  return (
    <Svg width={largura} height={altura}>
      <Defs>
        <LinearGradient id="preenchimento" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={cor} stopOpacity={0.35} />
          <Stop offset="1" stopColor={cor} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {marcas.map((m, i) => (
        <Line key={i} x1={esq} x2={largura - 4} y1={y(m)} y2={y(m)} stroke={cores.borda} strokeDasharray="3 3" />
      ))}
      {marcas.map((m, i) => (
        <SvgText key={`m${i}`} x={esq - 6} y={y(m) + 3} fontSize={10} fill={cores.textoSuave} textAnchor="end">
          {Math.round(m)}
          {sufixo}
        </SvgText>
      ))}
      {area && <Path d={caminhoArea} fill="url(#preenchimento)" />}
      <Path d={caminho} stroke={cor} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {dados.map((d, i) => (
        <Circle key={`c${i}`} cx={x(i)} cy={y(d.valor)} r={3.5} fill={cor} />
      ))}
      {dados.map((d, i) =>
        i % rotulosVisiveis === 0 || i === dados.length - 1 ? (
          <SvgText key={`r${i}`} x={x(i)} y={altura - 4} fontSize={10} fill={cores.textoSuave} textAnchor={i === dados.length - 1 && i > 0 ? 'end' : 'middle'}>
            {d.rotulo}
          </SvgText>
        ) : null,
      )}
    </Svg>
  )
}
