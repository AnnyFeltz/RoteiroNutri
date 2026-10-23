import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, CalendarDays, Apple, TrendingUp, ArrowUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Badge, Card, Carregando, ErroCarregamento } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { sinal } from '../lib/format'

const CORES_ADESAO = ['var(--folha)', 'var(--grafico-carbo)', 'var(--terracota)', 'var(--perigo)']
const TOOLTIP = { background: 'var(--card)', border: '1px solid var(--borda)', borderRadius: 8 }
const EIXO = { fontSize: 11, fill: 'var(--texto-suave)' }

// RF09 - Dashboard com agenda do dia e métricas rápidas
export default function Dashboard() {
  const { nutricionista } = useAuth()
  const { data: d, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api('/nutricionista/dashboard'),
  })

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const temAdesao = d.taxaAdesao !== null
  const pizza = temAdesao ? d.distribuicaoAdesao : [{ nome: 'Sem dados', pct: 100 }]

  return (
    <div className="pagina">
      <div>
        <h1 className="titulo-pagina">Bem-vinda, {nutricionista.nome}! 👋</h1>
        <p className="subtitulo-pagina">Aqui está um resumo do seu consultório.</p>
      </div>

      <div className="grade grade-2-md grade-4-lg">
        <Kpi icon={Users} label="Pacientes ativos" value={d.pacientesAtivos} delta={`+${d.novosPacientesMes} este mês`} />
        <Kpi
          icon={CalendarDays}
          label="Consultas hoje"
          value={d.consultasHoje.length}
          delta={d.proximaConsultaHoje ? `próxima às ${d.proximaConsultaHoje}` : `${d.consultasMes} no mês`}
          tom="terracota"
        />
        <Kpi icon={Apple} label="Planos alimentares ativos" value={d.planosAtivos} delta={`+${d.planosCriadosMes} versões este mês`} />
        <Kpi icon={TrendingUp} label="Taxa de adesão (30 dias)" value={temAdesao ? `${d.taxaAdesao}%` : '—'} delta="refeições marcadas no app" tom="primaria" />
      </div>

      <div className="grade grade-3-lg">
        <Card>
          <h3 className="card-titulo">Consultas de hoje</h3>
          {d.consultasHoje.length === 0 ? (
            <p className="texto-suave">Nenhuma consulta marcada para hoje.</p>
          ) : (
            <ul className="pilha">
              {d.consultasHoje.map((c) => (
                <li key={c.id} className="linha entre">
                  <div className="linha expandir">
                    <span className="mono texto-suave" style={{ width: 48 }}>
                      {c.horario}
                    </span>
                    <Link to={`/nutri/pacientes/${c.paciente.id}`} className="texto-medio cortar link-texto">
                      {c.paciente.nome}
                    </Link>
                  </div>
                  <Badge variant={c.tipo === 'Avaliação' ? 'terracota' : 'primaria'}>{c.tipo}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/nutri/agenda" className="card-rodape-link">
            Ver agenda completa
          </Link>
        </Card>

        <Card>
          <h3 className="titulo-secao">Adesão dos pacientes</h3>
          <p className="texto-pequeno texto-suave" style={{ marginBottom: 8 }}>
            Últimos 30 dias · pacientes com plano
          </p>
          <div className="grafico" style={{ height: 192 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pizza} startAngle={90} endAngle={-270} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={temAdesao ? 2 : 0} dataKey="pct" stroke="none">
                  {pizza.map((_, i) => (
                    <Cell key={i} fill={temAdesao ? CORES_ADESAO[i] : 'var(--suave)'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grafico-centro">
              <p className="numero-medio cor-primaria">{temAdesao ? `${d.taxaAdesao}%` : '—'}</p>
              <p className="texto-pequeno texto-suave">Adesão geral</p>
            </div>
          </div>
          <ul className="legenda" style={{ marginTop: 12 }}>
            {d.distribuicaoAdesao.map((a, i) => (
              <li key={a.nome}>
                <span className="linha-sm">
                  <span className="ponto" style={{ background: CORES_ADESAO[i] }} />
                  {a.nome}
                </span>
                <span className="texto-medio">
                  {a.pct}% <span className="texto-suave">({a.total})</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="card-cabecalho">
            <h3>Evolução geral (média)</h3>
            <span className="texto-pequeno texto-suave">Últimos 6 meses</span>
          </div>
          <div style={{ height: 176 }}>
            <ResponsiveContainer>
              <LineChart data={d.evolucaoMensal} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--borda)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={EIXO} axisLine={false} tickLine={false} />
                <YAxis tick={EIXO} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${sinal(v)} kg`, 'Variação média']} contentStyle={TOOLTIP} />
                <Line type="monotone" dataKey="variacaoMediaKg" stroke="var(--primaria)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--primaria)' }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grade grade-2 separador-topo" style={{ marginTop: 8 }}>
            <div>
              <p className="numero-pequeno cor-folha">-{d.perdaMediaKg.toLocaleString('pt-BR')} kg</p>
              <p className="texto-pequeno texto-suave">Perda média (quem emagreceu)</p>
            </div>
            <div>
              <p className="numero-pequeno cor-terracota">+{d.ganhoMedioKg.toLocaleString('pt-BR')} kg</p>
              <p className="texto-pequeno texto-suave">Ganho médio (quem ganhou)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, delta, tom }) {
  return (
    <Card>
      <div className="linha entre alinhar-topo">
        <div>
          <p className="texto-suave">{label}</p>
          <p className="numero-grande" style={{ marginTop: 8 }}>
            {value}
          </p>
        </div>
        <div className={`icone-caixa ${tom ? `icone-caixa-${tom}` : ''}`}>
          <Icon />
        </div>
      </div>
      <p className="kpi-delta">
        <ArrowUp /> {delta}
      </p>
    </Card>
  )
}
