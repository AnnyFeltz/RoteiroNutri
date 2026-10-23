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
      <div className="calendario-topo">
        <button className="botao-redondo" onClick={() => onMudarMes(new Date(ano, m - 1, 1))} aria-label="Mês anterior">
          <ChevronLeft />
        </button>
        <p className="calendario-mes">
          {MESES[m]} {ano}
        </p>
        <button className="botao-redondo" onClick={() => onMudarMes(new Date(ano, m + 1, 1))} aria-label="Próximo mês">
          <ChevronRight />
        </button>
      </div>
      <div className="calendario-grade">
        {SEMANA.map((d) => (
          <div key={d} className="calendario-semana">
            {d}
          </div>
        ))}
        {celulas.map((d, i) => {
          if (!d) return <div key={`v${i}`} />
          const data = iso(d)
          return (
            <button
              key={data}
              onClick={() => onSelecionar(data)}
              className={cn('calendario-dia', data === hoje && 'calendario-hoje', marcados.has(data) && 'calendario-com-consulta')}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}
