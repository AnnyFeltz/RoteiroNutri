import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

/** Debounce simples para não consultar a API a cada tecla. */
export function useDebounce(valor, ms = 300) {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return atrasado
}

export function useCategoriasTaco() {
  return useQuery({ queryKey: ['alimentos', 'categorias'], queryFn: () => api('/alimentos/categorias'), staleTime: Infinity })
}

// junta nomes de classes CSS ignorando os vazios: cn('btn', ativo && 'btn-ativo')
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
