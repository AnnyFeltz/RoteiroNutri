import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { API_URL } from './api'

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '')

/** Conecta ao Socket.io e recarrega os dados quando um paciente atualiza algo pelo app. */
export function useAtualizacoesTempoReal(token) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] })

    socket.on('paciente:atualizado', () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      queryClient.invalidateQueries({ queryKey: ['evolucao'] })
    })

    return () => socket.disconnect()
  }, [token, queryClient])
}
