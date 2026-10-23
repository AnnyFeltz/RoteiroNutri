import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { api, definirAoExpirarSessao, definirToken } from './api'
import { lerToken, salvarToken } from './armazenamento'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(null)
  const [pronto, setPronto] = useState(false)

  const sair = useCallback(
    async (motivo) => {
      definirToken(null)
      setToken(null)
      queryClient.clear()
      await salvarToken(null)
      if (typeof motivo === 'string' && motivo) Alert.alert('Sessão encerrada', motivo)
    },
    [queryClient],
  )

  useEffect(() => {
    definirAoExpirarSessao(sair)
  }, [sair])

  // restaura a sessão salva e confirma que o token ainda vale
  useEffect(() => {
    ;(async () => {
      const salvo = await lerToken()
      if (salvo) {
        definirToken(salvo)
        try {
          const { tipo } = await api('/auth/me')
          if (tipo === 'paciente') setToken(salvo)
          else await sair()
        } catch {
          definirToken(null)
          await salvarToken(null)
        }
      }
      setPronto(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // RF16 / RN08 - login com as credenciais fornecidas pelo nutricionista
  const entrar = useCallback(async (email, senha) => {
    const r = await api('/auth/pacientes/login', { method: 'POST', body: { email, senha } })
    definirToken(r.token)
    await salvarToken(r.token)
    setToken(r.token)
    return r.paciente
  }, [])

  const valor = useMemo(() => ({ token, pronto, entrar, sair }), [token, pronto, entrar, sair])
  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
