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
      <div className="space-y-4">
        <Link to="/nutri/agenda" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar para a agenda
        </Link>
        <p className="text-muted-foreground">Data inválida.</p>
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
    <div className="space-y-6">
      <div>
        <Link to="/nutri/agenda" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="h-4 w-4" /> Voltar para o calendário
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <CalendarDays className="h-7 w-7 text-primary" />
              {dataExtenso(data)}
            </h1>
            <p className="text-muted-foreground mt-1">{diaSemana(data)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => mudar(-1)}>
              <ChevronLeft className="h-4 w-4" /> Dia anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => mudar(1)}>
              Próximo dia <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Carregando />
      ) : consultas.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">Nenhuma consulta marcada para este dia.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {consultas.map((c) => (
            <Card key={c.id} className="p-5 flex flex-wrap items-center gap-4">
              <Avatar nome={c.paciente.nome} cor={c.paciente.avatarCor} className="h-12 w-12" />
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold font-sans">{c.paciente.nome}</h3>
                  <Badge variant="outline">{c.tipo}</Badge>
                  {data >= hoje ? <Badge>Agendada</Badge> : <Badge variant="muted">Realizada</Badge>}
                  {!c.paciente.ativo && <Badge variant="outline">Paciente inativo</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Horário: {c.horario}</p>
                {c.observacoes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.observacoes}</p>}
              </div>
              <Link to={`/nutri/pacientes/${c.paciente.id}`}>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4" /> Ver paciente
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
