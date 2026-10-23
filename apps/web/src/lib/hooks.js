import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { twMerge } from 'tailwind-merge'
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

// junta classes do Tailwind resolvendo conflitos (ex: "w-full" + "w-20" => "w-20")
export function cn(...classes) {
  return twMerge(classes.filter(Boolean).join(' '))
}
