import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Avatar, Badge, Button, Card, Carregando } from '../components/ui'
import { api } from '../lib/api'
import { dataExtenso, diaSemana, isoLocal, paraDate } from '../lib/format'

export default function AgendaDia() {
  const { data } = useParams()
  const nav = useNavigate()
  const valida = /^\d{4}-\d{2}-\d{2}$/.test(data || '') && !isNaN(paraDate(data).getTime())
  const { data: consultas, isLoading } = useQuery({
    queryKey: ['consultas', { inicio: data, fim: data }],
    queryFn: () => api('/consultas', { query: { inicio: data, fim: data } }),
    enabled: valida,
  })

  if (!valida) {
    return (
      <div className="pilha">
        <Link to="/nutri/agenda" className="link linha-sm">
          <ArrowLeft size={16} /> Voltar para a agenda
        </Link>
        <p className="texto-suave">Data inválida.</p>
      </div>
    )
  }

  const mudar = (dias) => {
    const d = paraDate(data)
    d.setDate(d.getDate() + dias)
    nav(`/nutri/agenda/${isoLocal(d)}`)
  }
  const hoje = isoLocal()

  return (
    <div className="pagina">
      <div>
        <Link to="/nutri/agenda" className="link linha-sm" style={{ marginBottom: 12, display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Voltar para o calendário
        </Link>
        <div className="cabecalho-pagina" style={{ alignItems: 'center' }}>
          <div>
            <h1 className="titulo-pagina titulo-icone">
              <CalendarDays size={28} />
              {dataExtenso(data)}
            </h1>
            <p className="subtitulo-pagina">{diaSemana(data)}</p>
          </div>
          <div className="acoes">
            <Button variant="outline" size="sm" onClick={() => mudar(-1)}>
              <ChevronLeft /> Dia anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => mudar(1)}>
              Próximo dia <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Carregando />
      ) : consultas.length === 0 ? (
        <Card className="card-vazio">
          <p>Nenhuma consulta marcada para este dia.</p>
        </Card>
      ) : (
        <div className="pilha">
          {consultas.map((c) => (
            <Card key={c.id} className="linha linha-quebra" style={{ gap: 16 }}>
              <Avatar nome={c.paciente.nome} cor={c.paciente.avatarCor} tamanho="md" />
              <div className="expandir" style={{ minWidth: 200 }}>
                <div className="linha-sm linha-quebra">
                  <h3 className="texto-forte" style={{ fontFamily: 'var(--fonte-texto)', fontSize: 15 }}>
                    {c.paciente.nome}
                  </h3>
                  <Badge variant="outline">{c.tipo}</Badge>
                  {data >= hoje ? <Badge>Agendada</Badge> : <Badge variant="muted">Realizada</Badge>}
                  {!c.paciente.ativo && <Badge variant="outline">Paciente inativo</Badge>}
                </div>
                <p className="texto-pequeno texto-suave" style={{ marginTop: 2 }}>
                  Horário: {c.horario}
                </p>
                {c.observacoes && <p className="texto-suave resumo-2-linhas" style={{ marginTop: 8 }}>{c.observacoes}</p>}
              </div>
              <Link to={`/nutri/pacientes/${c.paciente.id}`}>
                <Button variant="outline" size="sm">
                  <User /> Ver paciente
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
