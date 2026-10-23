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
    <div className="pagina">
      <div>
        <h1 className="titulo-pagina">Planos Alimentares</h1>
        <p className="subtitulo-pagina">Visualize, edite e versione os planos de todos os pacientes ativos.</p>
      </div>

      <div className="grade grade-3-sm">
        <StatCard rotulo="Pacientes ativos" valor={data.length} icone={<Apple size={16} />} />
        <StatCard rotulo="Planos ativos" valor={comPlano} icone={<CheckCircle2 size={16} className="cor-primaria" />} />
        <StatCard rotulo="Sem plano" valor={data.length - comPlano} icone={<AlertCircle size={16} className="cor-terracota" />} />
      </div>

      <Card className="card-compacto filtros">
        <div className="busca">
          <Search />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar paciente..." />
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
      </Card>

      <div className="pilha">
        {linhas.length === 0 && (
          <Card className="card-vazio">
            <Apple />
            <p>Nenhum paciente encontrado.</p>
          </Card>
        )}
        {linhas.map(({ paciente: p, planoAtivo: ativo, totalVersoes }) => (
          <Card key={p.id} className="linha linha-quebra" style={{ gap: 16 }}>
            <Avatar nome={p.nome} cor={p.avatarCor} tamanho="md" />
            <div className="expandir" style={{ minWidth: 200 }}>
              <p className="texto-medio">{p.nome}</p>
              <p className="texto-pequeno texto-suave">
                {objetivoLabel(p.objetivo)}
                {p.idade ? ` · ${p.idade} anos` : ''} · {totalVersoes} {totalVersoes === 1 ? 'versão' : 'versões'} no histórico
              </p>
            </div>

            {ativo ? (
              <div className="linha" style={{ gap: 24 }}>
                <div>
                  <p className="texto-pequeno texto-suave">Plano ativo</p>
                  <p className="texto-medio linha-sm">
                    <Badge variant="outline" className="mono selo-mini">
                      v{ativo.versao}
                    </Badge>
                    {ativo.nome}
                  </p>
                </div>
                <div className="direita">
                  <p className="texto-pequeno texto-suave">Meta</p>
                  <p className="mono cor-primaria">{ativo.kcalAlvo} kcal</p>
                </div>
                <div className="direita">
                  <p className="texto-pequeno texto-suave">Soma refeições</p>
                  <p className="mono">{ativo.kcalTotal} kcal</p>
                </div>
              </div>
            ) : (
              <Badge variant="terracota">Sem plano ativo</Badge>
            )}

            <div className="acoes empurrar">
              {ativo ? (
                <>
                  <Link to={`/nutri/pacientes/${p.id}/plano/${ativo.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye /> Ver
                    </Button>
                  </Link>
                  <Link to={`/nutri/pacientes/${p.id}/plano/${ativo.id}/editar`}>
                    <Button size="sm">
                      <Pencil /> Editar
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to={`/nutri/pacientes/${p.id}/plano/novo`}>
                  <Button size="sm">
                    <Plus /> Criar plano
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function StatCard({ rotulo, valor, icone }) {
  return (
    <Card className="card-compacto">
      <div className="linha entre">
        <p className="texto-pequeno texto-suave">{rotulo}</p>
        {icone}
      </div>
      <p className="numero-medio" style={{ marginTop: 4 }}>
        {valor}
      </p>
    </Card>
  )
}
