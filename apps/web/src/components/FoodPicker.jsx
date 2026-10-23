import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { iconeAlimento } from '@RoteiroNutri/shared'
import { Input, Modal, Select, Spinner } from './ui'
import { api } from '../lib/api'
import { useCategoriasTaco, useDebounce } from '../lib/hooks'

/** Busca na tabela TACO para escolher um alimento (RF13). */
export function FoodPicker({ open, onClose, onPick, titulo = 'Tabela TACO' }) {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const termo = useDebounce(busca)
  const { data: categorias = [] } = useCategoriasTaco()
  const { data, isFetching } = useQuery({
    queryKey: ['alimentos', { termo, categoria }],
    queryFn: () => api('/alimentos', { query: { busca: termo, categoria, limite: 30 } }),
    enabled: open,
    placeholderData: (anterior) => anterior,
  })

  return (
    <Modal open={open} onClose={onClose} title={titulo} description="Busque um alimento (valores por 100g)." className="max-w-xl">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex: arroz integral" />
        <Select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="sm:max-w-[200px]">
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.nome} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-3 max-h-80 overflow-auto space-y-1 relative">
        {isFetching && !data && (
          <div className="py-8 flex justify-center">
            <Spinner />
          </div>
        )}
        {data?.itens.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              onPick(a)
              setBusca('')
            }}
            className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition"
          >
            <span className="text-xl">{iconeAlimento(a)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{a.nome}</p>
              <p className="text-xs text-muted-foreground">
                {a.kcal100g} kcal · C {a.carboidratoG}g · P {a.proteinaG}g · G {a.gorduraG}g
              </p>
            </div>
          </button>
        ))}
        {data && data.itens.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum alimento encontrado.</p>}
        {data && data.total > data.itens.length && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Mostrando {data.itens.length} de {data.total}. Refine a busca.
          </p>
        )}
      </div>
    </Modal>
  )
}
