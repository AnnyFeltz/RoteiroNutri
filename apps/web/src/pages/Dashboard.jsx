import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, CalendarDays, Apple, TrendingUp, ArrowUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Badge, Card, Carregando, ErroCarregamento } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { sinal } from '../lib/format'

const CORES_ADESAO = ['var(--leaf)', 'var(--chart-3)', 'var(--terracotta)', 'var(--destructive)']

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Bem-vinda, {nutricionista.nome}! 👋</h1>
        <p className="text-muted-foreground mt-1">Aqui está um resumo do seu consultório.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users} label="Pacientes ativos" value={d.pacientesAtivos} delta={`+${d.novosPacientesMes} este mês`} />
        <Kpi
          icon={CalendarDays}
          label="Consultas hoje"
          value={d.consultasHoje.length}
          delta={d.proximaConsultaHoje ? `próxima às ${d.proximaConsultaHoje}` : `${d.consultasMes} no mês`}
          tone="terracotta"
        />
        <Kpi icon={Apple} label="Planos alimentares ativos" value={d.planosAtivos} delta={`+${d.planosCriadosMes} versões este mês`} />
        <Kpi icon={TrendingUp} label="Taxa de adesão (30 dias)" value={temAdesao ? `${d.taxaAdesao}%` : '—'} delta="refeições marcadas no app" tone="leaf" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-lg mb-4">Consultas de hoje</h3>
          {d.consultasHoje.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta marcada para hoje.</p>
          ) : (
            <ul className="space-y-3">
              {d.consultasHoje.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-mono text-muted-foreground w-12">{c.horario}</span>
                    <Link to={`/nutri/pacientes/${c.paciente.id}`} className="font-medium text-sm hover:text-primary truncate">
                      {c.paciente.nome}
                    </Link>
                  </div>
                  <Badge variant="outline" className={c.tipo === 'Avaliação' ? 'border-terracotta text-terracotta' : 'border-primary text-primary'}>
                    {c.tipo}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/nutri/agenda" className="block text-center text-sm text-primary hover:underline mt-5 pt-4 border-t border-border">
            Ver agenda completa
          </Link>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-lg mb-1">Adesão dos pacientes</h3>
          <p className="text-xs text-muted-foreground mb-2">Últimos 30 dias · pacientes com plano</p>
          <div className="relative h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie startAngle={90} endAngle={-270} data={pizza} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={temAdesao ? 2 : 0} dataKey="pct" stroke="none">
                  {pizza.map((_, i) => (
                    <Cell key={i} fill={temAdesao ? CORES_ADESAO[i] : 'var(--muted)'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-display font-semibold text-primary">{temAdesao ? `${d.taxaAdesao}%` : '—'}</p>
              <p className="text-xs text-muted-foreground">Adesão geral</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {d.distribuicaoAdesao.map((a, i) => (
              <li key={a.nome} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES_ADESAO[i] }} />
                  {a.nome}
                </span>
                <span className="font-medium">
                  {a.pct}% <span className="text-muted-foreground font-normal">({a.total})</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Evolução geral (média)</h3>
            <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer>
              <LineChart data={d.evolucaoMensal} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`${sinal(v)} kg`, 'Variação média']}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="variacaoMediaKg" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--primary)' }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-border">
            <div>
              <p className="text-xl font-display font-semibold text-leaf">-{d.perdaMediaKg.toLocaleString('pt-BR')} kg</p>
              <p className="text-xs text-muted-foreground">Perda média (quem emagreceu)</p>
            </div>
            <div>
              <p className="text-xl font-display font-semibold text-terracotta">+{d.ganhoMedioKg.toLocaleString('pt-BR')} kg</p>
              <p className="text-xs text-muted-foreground">Ganho médio (quem ganhou)</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, delta, tone = 'default' }) {
  const cor = tone === 'leaf' ? 'bg-primary/10 text-primary' : tone === 'terracotta' ? 'bg-terracotta/10 text-terracotta' : 'bg-muted text-muted-foreground'
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-4xl font-display font-semibold mt-2">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
        <ArrowUp className="h-3 w-3 text-leaf" /> {delta}
      </p>
    </Card>
  )
}
