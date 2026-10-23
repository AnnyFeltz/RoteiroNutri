import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MESES } from '../lib/format'
import { cn } from '../lib/hooks'

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** Calendário mensal. `marcados` é um Set de datas "AAAA-MM-DD" com consulta. */
export function Calendario({ mes, onMudarMes, marcados, hoje, onSelecionar }) {
  const ano = mes.getFullYear()
  const m = mes.getMonth()
  const primeiroDia = new Date(ano, m, 1).getDay()
  const diasNoMes = new Date(ano, m + 1, 0).getDate()
  const celulas = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)]
  const iso = (d) => `${ano}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button className="p-2 rounded-md hover:bg-muted" onClick={() => onMudarMes(new Date(ano, m - 1, 1))} aria-label="Mês anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display font-semibold capitalize">
          {MESES[m]} {ano}
        </p>
        <button className="p-2 rounded-md hover:bg-muted" onClick={() => onMudarMes(new Date(ano, m + 1, 1))} aria-label="Próximo mês">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {SEMANA.map((d) => (
          <div key={d} className="text-xs text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {celulas.map((d, i) => {
          if (!d) return <div key={`v${i}`} />
          const data = iso(d)
          const temConsulta = marcados.has(data)
          return (
            <button
              key={data}
              onClick={() => onSelecionar(data)}
              className={cn(
                'relative h-11 rounded-md text-sm transition hover:bg-accent',
                data === hoje && 'bg-primary/10 font-semibold',
                temConsulta && 'font-semibold text-primary',
              )}
            >
              {d}
              {temConsulta && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
