import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock } from 'lucide-react'
import { Avatar, Badge, Card, Carregando } from '../components/ui'
import { Calendario } from '../components/Calendario'
import { api } from '../lib/api'
import { dataBR, isoLocal } from '../lib/format'

// RN14 / RF09 - Agenda do nutricionista
export default function Agenda() {
  const nav = useNavigate()
  const hoje = isoLocal()
  const [mes, setMes] = useState(() => new Date())
  const inicio = isoLocal(new Date(mes.getFullYear(), mes.getMonth(), 1))
  const fim = isoLocal(new Date(mes.getFullYear(), mes.getMonth() + 1, 0))

  const doMes = useQuery({
    queryKey: ['consultas', { inicio, fim }],
    queryFn: () => api('/consultas', { query: { inicio, fim } }),
    placeholderData: (anterior) => anterior,
  })
  const proximas = useQuery({ queryKey: ['consultas', { inicio: hoje }], queryFn: () => api('/consultas', { query: { inicio: hoje } }) })

  const marcados = useMemo(() => new Set((doMes.data || []).map((c) => c.data)), [doMes.data])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-primary" /> Agenda
          </h1>
          <p className="text-muted-foreground mt-1">Clique em um dia para ver as consultas. Para agendar, abra o paciente → aba Consultas.</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {doMes.data?.length ?? 0} consulta{doMes.data?.length === 1 ? '' : 's'} neste mês
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <Calendario mes={mes} onMudarMes={setMes} marcados={marcados} hoje={hoje} onSelecionar={(d) => nav(`/nutri/agenda/${d}`)} />
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground border-t border-border pt-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary inline-block" /> Dia com consulta
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Próximas consultas
          </h3>
          {proximas.isLoading ? (
            <Carregando />
          ) : proximas.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada.</p>
          ) : (
            <ul className="space-y-3">
              {proximas.data.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link to={`/nutri/agenda/${c.data}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                    <Avatar nome={c.paciente.nome} cor={c.paciente.avatarCor} className="h-9 w-9" textClassName="text-xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.paciente.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {dataBR(c.data)} • {c.horario} • {c.tipo}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
