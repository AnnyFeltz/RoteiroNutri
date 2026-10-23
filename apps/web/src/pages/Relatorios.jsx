import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search, ClipboardList, TrendingDown, TrendingUp, Users, Apple, Target } from 'lucide-react'
import { imc, classificacaoImc } from '@RoteiroNutri/shared'
import { Avatar, Badge, Button, Card, Carregando, ErroCarregamento, Input, Segmented } from '../components/ui'
import { api } from '../lib/api'
import { objetivoLabel } from '../lib/format'

// RF15 - Relatórios e fichas em PDF
export default function Relatorios() {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const { data: pacientes, isLoading, error, refetch } = useQuery({ queryKey: ['pacientes', { busca: '', filtro: 'todos' }], queryFn: () => api('/pacientes') })

  const lista = useMemo(
    () =>
      (pacientes || [])
        .filter((p) => (filtro === 'todos' ? true : filtro === 'ativos' ? p.ativo : !p.ativo))
        .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [pacientes, busca, filtro],
  )

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const ativos = pacientes.filter((p) => p.ativo)
  const perdido = ativos.reduce((s, p) => s + (p.pesoInicialKg && p.pesoAtualKg ? Math.max(0, p.pesoInicialKg - p.pesoAtualKg) : 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold">Relatórios e fichas</h1>
        <p className="text-muted-foreground mt-1">Gere a ficha médica/nutricional profissional de cada paciente em PDF.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={Users} rotulo="Pacientes ativos" valor={ativos.length} />
        <Stat icon={Apple} rotulo="Planos ativos" valor={ativos.filter((p) => p.planoAtivo).length} />
        <Stat icon={TrendingDown} rotulo="Peso perdido (total)" valor={`${perdido.toFixed(1)} kg`} />
        <Stat icon={Target} rotulo="Fichas disponíveis" valor={pacientes.length} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar paciente..." className="pl-9 bg-background" />
          </div>
          <Segmented
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: 'ativos', label: 'Ativos' },
              { value: 'inativos', label: 'Inativos' },
              { value: 'todos', label: 'Todos' },
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium">Fichas médicas/nutricionais por paciente</p>
        </div>
        <ul className="divide-y divide-border">
          {lista.map((p) => {
            const valorImc = imc(p.pesoAtualKg, p.alturaCm)
            const dif = p.pesoInicialKg && p.pesoAtualKg ? +(p.pesoAtualKg - p.pesoInicialKg).toFixed(1) : 0
            const Icon = dif < 0 ? TrendingDown : TrendingUp
            return (
              <li key={p.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                <Avatar nome={p.nome} cor={p.avatarCor} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {objetivoLabel(p.objetivo)}
                    {valorImc ? ` · IMC ${valorImc.toFixed(1)} (${classificacaoImc(valorImc)})` : ''}
                    {p.pesoInicialKg && p.pesoAtualKg ? ` · ${p.pesoInicialKg}→${p.pesoAtualKg}kg` : ''}
                  </p>
                </div>
                <Badge variant="outline" className={`${dif < 0 ? 'border-leaf text-leaf' : dif > 0 ? 'border-terracotta text-terracotta' : ''} hidden sm:inline-flex`}>
                  <Icon className="h-3 w-3" /> {Math.abs(dif)} kg
                </Badge>
                {p.ativo ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                <Link to={`/nutri/pacientes/${p.id}/ficha`}>
                  <Button size="sm">
                    <FileText className="h-3.5 w-3.5" /> Abrir ficha
                  </Button>
                </Link>
              </li>
            )
          })}
          {lista.length === 0 && <li className="text-center py-12 text-sm text-muted-foreground">Nenhum paciente encontrado.</li>}
        </ul>
      </Card>
    </div>
  )
}

function Stat({ icon: Icon, rotulo, valor }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="text-2xl sm:text-3xl font-display font-semibold mt-1">{valor}</p>
    </Card>
  )
}
