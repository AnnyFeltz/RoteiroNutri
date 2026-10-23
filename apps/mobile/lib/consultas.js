import { useQuery } from '@tanstack/react-query'
import { api } from './api'

// Hooks de dados do app (React Query faz cache e atualização)
export const usePerfil = () => useQuery({ queryKey: ['perfil'], queryFn: () => api('/app/perfil') })
export const usePlanoDoDia = () => useQuery({ queryKey: ['plano'], queryFn: () => api('/app/plano', { query: { data: hojeLocal() } }) })
export const useEvolucao = () => useQuery({ queryKey: ['evolucao'], queryFn: () => api('/app/evolucao') })
export const useHistoricoPlanos = () => useQuery({ queryKey: ['planos'], queryFn: () => api('/app/planos') })
export const useConsultas = () => useQuery({ queryKey: ['consultas'], queryFn: () => api('/app/consultas') })

/** Data local do aparelho (AAAA-MM-DD) — o "hoje" do paciente. */
export function hojeLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
