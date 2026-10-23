import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { iconeAlimento } from '@RoteiroNutri/shared'
import { Input, Modal, Select } from './ui'
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
    <Modal open={open} onClose={onClose} title={titulo} description="Busque um alimento (valores por 100g)." largo>
      <div className="seletor-alimento-filtros">
        <Input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex: arroz integral" />
        <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.nome} value={c.nome}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="lista-rolavel" style={{ marginTop: 12, maxHeight: 320 }}>
        {isFetching && !data && (
          <div className="carregando" style={{ padding: '32px 0' }}>
            <Loader2 className="girando" />
          </div>
        )}
        {data?.itens.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              onPick(a)
              setBusca('')
            }}
            className="opcao-alimento"
          >
            <span className="emoji">{iconeAlimento(a)}</span>
            <span className="expandir">
              <span className="texto-medio" style={{ display: 'block' }}>
                {a.nome}
              </span>
              <span className="texto-pequeno texto-suave">
                {a.kcal100g} kcal · C {a.carboidratoG}g · P {a.proteinaG}g · G {a.gorduraG}g
              </span>
            </span>
          </button>
        ))}
        {data && data.itens.length === 0 && <p className="centro texto-suave" style={{ padding: '24px 0' }}>Nenhum alimento encontrado.</p>}
        {data && data.total > data.itens.length && (
          <p className="centro texto-pequeno texto-suave" style={{ padding: '8px 0' }}>
            Mostrando {data.itens.length} de {data.total}. Refine a busca.
          </p>
        )}
      </div>
    </Modal>
  )
}
