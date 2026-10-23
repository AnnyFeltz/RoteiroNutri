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
    <div className="pagina">
      <div>
        <h1 className="titulo-pagina">Relatórios e fichas</h1>
        <p className="subtitulo-pagina">Gere a ficha médica/nutricional profissional de cada paciente em PDF.</p>
      </div>

      <div className="grade grade-2 grade-4-lg">
        <Stat icon={Users} rotulo="Pacientes ativos" valor={ativos.length} />
        <Stat icon={Apple} rotulo="Planos ativos" valor={ativos.filter((p) => p.planoAtivo).length} />
        <Stat icon={TrendingDown} rotulo="Peso perdido (total)" valor={`${perdido.toFixed(1)} kg`} />
        <Stat icon={Target} rotulo="Fichas disponíveis" valor={pacientes.length} />
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
            { value: 'ativos', label: 'Ativos' },
            { value: 'inativos', label: 'Inativos' },
            { value: 'todos', label: 'Todos' },
          ]}
        />
      </Card>

      <Card className="card-sem-espaco">
        <div className="linha-sm" style={{ padding: '12px 20px', borderBottom: '1px solid var(--borda)' }}>
          <ClipboardList size={16} className="cor-primaria" />
          <p className="texto-medio">Fichas médicas/nutricionais por paciente</p>
        </div>
        <ul className="lista-divisoria">
          {lista.map((p) => {
            const valorImc = imc(p.pesoAtualKg, p.alturaCm)
            const dif = p.pesoInicialKg && p.pesoAtualKg ? +(p.pesoAtualKg - p.pesoInicialKg).toFixed(1) : 0
            const Icon = dif < 0 ? TrendingDown : TrendingUp
            return (
              <li key={p.id} className="linha linha-quebra" style={{ padding: '12px 20px' }}>
                <Avatar nome={p.nome} cor={p.avatarCor} foto={p.foto} />
                <div className="expandir">
                  <p className="texto-medio cortar">{p.nome}</p>
                  <p className="texto-pequeno texto-suave cortar">
                    {objetivoLabel(p.objetivo)}
                    {valorImc ? ` · IMC ${valorImc.toFixed(1)} (${classificacaoImc(valorImc)})` : ''}
                    {p.pesoInicialKg && p.pesoAtualKg ? ` · ${p.pesoInicialKg}→${p.pesoAtualKg}kg` : ''}
                  </p>
                </div>
                <Badge variant={dif < 0 ? 'folha' : dif > 0 ? 'terracota' : 'outline'} className="so-desktop">
                  <Icon /> {Math.abs(dif)} kg
                </Badge>
                {p.ativo ? <Badge>Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}
                <Link to={`/nutri/pacientes/${p.id}/ficha`}>
                  <Button size="sm">
                    <FileText /> Abrir ficha
                  </Button>
                </Link>
              </li>
            )
          })}
          {lista.length === 0 && (
            <li className="centro texto-suave" style={{ padding: '48px 0' }}>
              Nenhum paciente encontrado.
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}

function Stat({ icon: Icon, rotulo, valor }) {
  return (
    <Card>
      <div className="icone-caixa icone-caixa-primaria" style={{ marginBottom: 12 }}>
        <Icon />
      </div>
      <p className="texto-pequeno texto-suave">{rotulo}</p>
      <p className="numero-medio" style={{ marginTop: 4 }}>
        {valor}
      </p>
    </Card>
  )
}
