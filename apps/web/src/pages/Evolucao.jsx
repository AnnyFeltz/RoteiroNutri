import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { progressoMeta } from '@RoteiroNutri/shared'
import { Avatar, Badge, Card, Carregando, ErroCarregamento } from '../components/ui'
import { api } from '../lib/api'
import { mesCurto, objetivoLabel, sinal } from '../lib/format'

const CORES = ['var(--leaf)', 'var(--terracotta)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--primary)']

function iconeVariacao(delta) {
  if (delta < -0.1) return { Icon: TrendingDown, cor: 'text-leaf' }
  if (delta > 0.1) return { Icon: TrendingUp, cor: 'text-terracotta' }
  return { Icon: Minus, cor: 'text-muted-foreground' }
}

/** Últimos 12 meses: peso de cada paciente no fim de cada mês (última pesagem até então). */
function montarSerie(pacientes) {
  const meses = []
  const agora = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const linhas = meses.map((mes) => {
    const linha = { mes: mesCurto(`${mes}-01`) }
    for (const p of pacientes) {
      let peso = null
      for (const e of p.evolucao) if (e.data.slice(0, 7) <= mes) peso = e.pesoKg
      linha[p.nome] = peso
    }
    return linha
  })
  // corta meses iniciais sem nenhum dado
  const primeiro = linhas.findIndex((l) => pacientes.some((p) => l[p.nome] != null))
  return primeiro === -1 ? [] : linhas.slice(primeiro)
}

// RF21 - Gráficos de evolução de todos os pacientes
export default function Evolucao() {
  const { data: pacientes, isLoading, error, refetch } = useQuery({ queryKey: ['evolucao'], queryFn: () => api('/nutricionista/evolucao') })
  const [selecionados, setSelecionados] = useState(null)

  useEffect(() => {
    if (pacientes && selecionados === null) setSelecionados(pacientes.slice(0, 3).map((p) => p.id))
  }, [pacientes, selecionados])

  const visiveis = useMemo(() => (pacientes || []).filter((p) => selecionados?.includes(p.id)), [pacientes, selecionados])
  const serie = useMemo(() => montarSerie(visiveis), [visiveis])

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const alternar = (id) => setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const comPeso = pacientes.filter((p) => p.pesoInicialKg && p.pesoAtualKg)
  const totalPerdido = comPeso.reduce((acc, p) => acc + Math.max(0, p.pesoInicialKg - p.pesoAtualKg), 0)
  const totalGanho = comPeso.reduce((acc, p) => acc + Math.max(0, p.pesoAtualKg - p.pesoInicialKg), 0)
  const pertoDaMeta = comPeso.filter((p) => p.pesoMetaKg && progressoMeta(p.pesoInicialKg, p.pesoAtualKg, p.pesoMetaKg) >= 90).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-primary" /> Evolução dos pacientes
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe o progresso de peso e metas de todos os pacientes ativos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Total perdido (kg)</p>
          <p className="text-3xl font-display font-semibold text-leaf mt-1">-{totalPerdido.toFixed(1)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Total ganho (kg)</p>
          <p className="text-3xl font-display font-semibold text-terracotta mt-1">+{totalGanho.toFixed(1)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Próximos da meta (≥90%)</p>
          <p className="text-3xl font-display font-semibold text-primary mt-1 flex items-center gap-2">
            <Target className="h-6 w-6" /> {pertoDaMeta}/{pacientes.length}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display font-semibold text-lg">Evolução de peso (kg)</h3>
          <p className="text-xs text-muted-foreground">Clique nos pacientes abaixo para comparar</p>
        </div>
        {serie.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">Selecione pacientes com pesagens registradas.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {visiveis.map((p, i) => (
                  <Line key={p.id} type="monotone" dataKey={p.nome} stroke={CORES[i % CORES.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-display font-semibold text-lg mb-4">Progresso por paciente</h3>
        {pacientes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum paciente ativo.</p>}
        <div className="space-y-3">
          {pacientes.map((p) => {
            const pct = progressoMeta(p.pesoInicialKg, p.pesoAtualKg, p.pesoMetaKg)
            const delta = p.pesoAtualKg != null && p.pesoInicialKg != null ? p.pesoAtualKg - p.pesoInicialKg : 0
            const { Icon, cor } = iconeVariacao(delta)
            const ativo = selecionados?.includes(p.id)
            return (
              <div
                key={p.id}
                onClick={() => alternar(p.id)}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${ativo ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-accent/40'}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar nome={p.nome} cor={p.avatarCor} textClassName="text-xs" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/nutri/pacientes/${p.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:text-primary">
                        {p.nome}
                      </Link>
                      <Badge variant="outline">{objetivoLabel(p.objetivo)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>
                        Inicial: <b className="text-foreground">{p.pesoInicialKg ?? '—'}kg</b>
                      </span>
                      <span>
                        Atual: <b className="text-foreground">{p.pesoAtualKg ?? '—'}kg</b>
                      </span>
                      <span>
                        Meta: <b className="text-foreground">{p.pesoMetaKg ?? '—'}kg</b>
                      </span>
                      <span className={`flex items-center gap-1 ${cor}`}>
                        <Icon className="h-3 w-3" /> {sinal(delta)}kg
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-display font-semibold text-primary">{pct}%</p>
                    <p className="text-xs text-muted-foreground">da meta</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
