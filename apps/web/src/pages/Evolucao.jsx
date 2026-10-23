import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { progressoMeta } from '@RoteiroNutri/shared'
import { Avatar, Badge, Card, Carregando, ErroCarregamento } from '../components/ui'
import { api } from '../lib/api'
import { mesCurto, objetivoLabel, sinal } from '../lib/format'

const CORES = ['var(--folha)', 'var(--terracota)', 'var(--grafico-carbo)', 'var(--grafico-4)', 'var(--grafico-5)', 'var(--primaria)']

function iconeVariacao(delta) {
  if (delta < -0.1) return { Icon: TrendingDown, cor: 'cor-folha' }
  if (delta > 0.1) return { Icon: TrendingUp, cor: 'cor-terracota' }
  return { Icon: Minus, cor: 'texto-suave' }
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
    <div className="pagina">
      <div>
        <h1 className="titulo-pagina titulo-icone">
          <TrendingUp size={28} /> Evolução dos pacientes
        </h1>
        <p className="subtitulo-pagina">Acompanhe o progresso de peso e metas de todos os pacientes ativos.</p>
      </div>

      <div className="grade grade-3-md">
        <Card>
          <p className="texto-pequeno texto-suave">Total perdido (kg)</p>
          <p className="numero-medio cor-folha" style={{ marginTop: 4 }}>
            -{totalPerdido.toFixed(1)}
          </p>
        </Card>
        <Card>
          <p className="texto-pequeno texto-suave">Total ganho (kg)</p>
          <p className="numero-medio cor-terracota" style={{ marginTop: 4 }}>
            +{totalGanho.toFixed(1)}
          </p>
        </Card>
        <Card>
          <p className="texto-pequeno texto-suave">Próximos da meta (≥90%)</p>
          <p className="numero-medio cor-primaria linha-sm" style={{ marginTop: 4 }}>
            <Target size={24} /> {pertoDaMeta}/{pacientes.length}
          </p>
        </Card>
      </div>

      <Card>
        <div className="card-cabecalho linha-quebra">
          <h3>Evolução de peso (kg)</h3>
          <p className="texto-pequeno texto-suave">Clique nos pacientes abaixo para comparar</p>
        </div>
        {serie.length === 0 ? (
          <p className="centro texto-suave" style={{ padding: '64px 0' }}>
            Selecione pacientes com pesagens registradas.
          </p>
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" />
                <XAxis dataKey="mes" stroke="var(--texto-suave)" fontSize={12} />
                <YAxis stroke="var(--texto-suave)" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--borda)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {visiveis.map((p, i) => (
                  <Line key={p.id} type="monotone" dataKey={p.nome} stroke={CORES[i % CORES.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="card-titulo">Progresso por paciente</h3>
        {pacientes.length === 0 && <p className="texto-suave">Nenhum paciente ativo.</p>}
        <div className="pilha">
          {pacientes.map((p) => {
            const pct = progressoMeta(p.pesoInicialKg, p.pesoAtualKg, p.pesoMetaKg)
            const delta = p.pesoAtualKg != null && p.pesoInicialKg != null ? p.pesoAtualKg - p.pesoInicialKg : 0
            const { Icon, cor } = iconeVariacao(delta)
            const ativo = selecionados?.includes(p.id)
            return (
              <div key={p.id} onClick={() => alternar(p.id)} className={`progresso-paciente ${ativo ? 'progresso-paciente-ativo' : ''}`}>
                <Avatar nome={p.nome} cor={p.avatarCor} foto={p.foto} />
                <div className="expandir">
                  <div className="linha-sm linha-quebra">
                    <Link to={`/nutri/pacientes/${p.id}`} onClick={(e) => e.stopPropagation()} className="texto-medio link-texto">
                      {p.nome}
                    </Link>
                    <Badge variant="outline">{objetivoLabel(p.objetivo)}</Badge>
                  </div>
                  <div className="linha linha-quebra texto-pequeno texto-suave" style={{ gap: '4px 16px', marginTop: 4 }}>
                    <span>
                      Inicial: <b style={{ color: 'var(--texto)' }}>{p.pesoInicialKg ?? '—'}kg</b>
                    </span>
                    <span>
                      Atual: <b style={{ color: 'var(--texto)' }}>{p.pesoAtualKg ?? '—'}kg</b>
                    </span>
                    <span>
                      Meta: <b style={{ color: 'var(--texto)' }}>{p.pesoMetaKg ?? '—'}kg</b>
                    </span>
                    <span className={`linha-sm ${cor}`} style={{ gap: 4 }}>
                      <Icon size={12} /> {sinal(delta)}kg
                    </span>
                  </div>
                  <div className="barra" style={{ marginTop: 8 }}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="direita">
                  <p className="numero-medio cor-primaria">{pct}%</p>
                  <p className="texto-pequeno texto-suave">da meta</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
