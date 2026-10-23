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
    <div className="pagina">
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina titulo-icone">
            <CalendarDays size={28} /> Agenda
          </h1>
          <p className="subtitulo-pagina">Clique em um dia para ver as consultas. Para agendar, abra o paciente → aba Consultas.</p>
        </div>
        <Badge variant="outline" style={{ fontSize: 14 }}>
          {doMes.data?.length ?? 0} consulta{doMes.data?.length === 1 ? '' : 's'} neste mês
        </Badge>
      </div>

      <div className="grade grade-3-lg" style={{ gap: 24 }}>
        <Card className="card-compacto ocupa-2-lg">
          <Calendario mes={mes} onMudarMes={setMes} marcados={marcados} hoje={hoje} onSelecionar={(d) => nav(`/nutri/agenda/${d}`)} />
          <div className="linha-sm texto-pequeno texto-suave separador-topo" style={{ marginTop: 16, paddingTop: 12 }}>
            <span className="ponto" style={{ background: 'var(--primaria)' }} /> Dia com consulta
          </div>
        </Card>

        <Card>
          <h3 className="card-titulo linha-sm">
            <Clock size={16} className="cor-primaria" /> Próximas consultas
          </h3>
          {proximas.isLoading ? (
            <Carregando />
          ) : proximas.data.length === 0 ? (
            <p className="texto-suave">Nenhuma consulta agendada.</p>
          ) : (
            <ul className="pilha-sm">
              {proximas.data.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link to={`/nutri/agenda/${c.data}`} className="item-agenda">
                    <Avatar nome={c.paciente.nome} cor={c.paciente.avatarCor} foto={c.paciente.foto} tamanho="sm" />
                    <div className="expandir">
                      <p className="texto-medio cortar">{c.paciente.nome}</p>
                      <p className="texto-pequeno texto-suave">
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
