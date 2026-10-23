import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Apple, Search, Pencil, Eye, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { Avatar, Badge, Button, Card, Carregando, ErroCarregamento, Input, Segmented } from '../components/ui'
import { api } from '../lib/api'
import { objetivoLabel } from '../lib/format'

// RF14 - Painel global dos planos alimentares ativos
export default function Planos() {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['planos', 'painel'], queryFn: () => api('/planos') })

  const linhas = useMemo(
    () =>
      (data || [])
        .filter((r) => (filtro === 'com-plano' ? !!r.planoAtivo : filtro === 'sem-plano' ? !r.planoAtivo : true))
        .filter((r) => r.paciente.nome.toLowerCase().includes(busca.toLowerCase())),
    [data, busca, filtro],
  )

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const comPlano = data.filter((r) => r.planoAtivo).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Planos Alimentares</h1>
        <p className="text-muted-foreground mt-1">Visualize, edite e versione os planos de todos os pacientes ativos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard rotulo="Pacientes ativos" valor={data.length} icone={<Apple className="h-4 w-4" />} />
        <StatCard rotulo="Planos ativos" valor={comPlano} icone={<CheckCircle2 className="h-4 w-4 text-primary" />} />
        <StatCard rotulo="Sem plano" valor={data.length - comPlano} icone={<AlertCircle className="h-4 w-4 text-terracotta" />} />
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
              { value: 'todos', label: 'Todos' },
              { value: 'com-plano', label: 'Com plano' },
              { value: 'sem-plano', label: 'Sem plano' },
            ]}
          />
        </div>
      </Card>

      <div className="space-y-3">
        {linhas.length === 0 && (
          <Card className="p-12 text-center">
            <Apple className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
          </Card>
        )}
        {linhas.map(({ paciente: p, planoAtivo: ativo, totalVersoes }) => (
          <Card key={p.id} className="p-5 hover:shadow-sm transition">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar nome={p.nome} cor={p.avatarCor} className="h-12 w-12" />
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium">{p.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {objetivoLabel(p.objetivo)}
                  {p.idade ? ` · ${p.idade} anos` : ''} · {totalVersoes} {totalVersoes === 1 ? 'versão' : 'versões'} no histórico
                </p>
              </div>

              {ativo ? (
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Plano ativo</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px] py-0">
                        v{ativo.versao}
                      </Badge>
                      {ativo.nome}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Meta</p>
                    <p className="font-mono text-primary">{ativo.kcalAlvo} kcal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Soma refeições</p>
                    <p className="font-mono">{ativo.kcalTotal} kcal</p>
                  </div>
                </div>
              ) : (
                <Badge variant="outline" className="text-terracotta border-terracotta/40">
                  Sem plano ativo
                </Badge>
              )}

              <div className="flex gap-2 ml-auto">
                {ativo ? (
                  <>
                    <Link to={`/nutri/pacientes/${p.id}/plano/${ativo.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </Button>
                    </Link>
                    <Link to={`/nutri/pacientes/${p.id}/plano/${ativo.id}/editar`}>
                      <Button size="sm">
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link to={`/nutri/pacientes/${p.id}/plano/novo`}>
                    <Button size="sm">
                      <Plus className="h-3.5 w-3.5" /> Criar plano
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function StatCard({ rotulo, valor, icone }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{rotulo}</p>
        {icone}
      </div>
      <p className="text-3xl font-display font-semibold mt-1">{valor}</p>
    </Card>
  )
}
