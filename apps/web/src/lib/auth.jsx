import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, definirAoExpirarSessao, lerToken, salvarToken } from './api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => lerToken())
  const [nutricionista, setNutricionista] = useState(null)
  const [carregando, setCarregando] = useState(!!lerToken())

  const sair = useCallback(() => {
    salvarToken(null)
    setToken(null)
    setNutricionista(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    definirAoExpirarSessao(sair)
  }, [sair])

  // Ao abrir a página com um token salvo, confirma que ele ainda é válido
  useEffect(() => {
    if (!token || nutricionista) return
    let ativo = true
    api('/auth/me')
      .then(({ tipo, usuario }) => {
        if (!ativo) return
        // a web é exclusiva do nutricionista
        if (tipo !== 'nutricionista') sair()
        else setNutricionista(usuario)
      })
      .catch(() => ativo && sair())
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [token, nutricionista, sair])

  const entrar = useCallback(async (email, senha) => {
    const r = await api('/auth/nutricionistas/login', { method: 'POST', body: { email, senha } })
    salvarToken(r.token)
    setToken(r.token)
    setNutricionista(r.nutricionista)
    setCarregando(false)
    return r.nutricionista
  }, [])

  const cadastrar = useCallback(async (dados) => {
    const r = await api('/auth/nutricionistas/registrar', { method: 'POST', body: dados })
    salvarToken(r.token)
    setToken(r.token)
    setNutricionista(r.nutricionista)
    setCarregando(false)
    return r.nutricionista
  }, [])

  const valor = useMemo(
    () => ({ token, nutricionista, setNutricionista, carregando, entrar, cadastrar, sair }),
    [token, nutricionista, carregando, entrar, cadastrar, sair],
  )
  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
