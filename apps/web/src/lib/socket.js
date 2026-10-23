import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { API_URL } from './api'

const SOCKET_URL = API_URL.replace(/\/api\/?$/, '')

/** Conecta ao Socket.io e atualiza a tela quando um paciente faz algo no app. */
export function useNotificacoesTempoReal(token, mostrarAvisos = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] })

    socket.on('notificacao', ({ tipo }) => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      if (!mostrarAvisos) return
      if (tipo === 'pedido-senha') toast.info('Um paciente pediu uma nova senha')
      else toast.info('Um paciente atualizou o perfil')
    })
    socket.on('paciente:peso', () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      queryClient.invalidateQueries({ queryKey: ['evolucao'] })
    })

    return () => socket.disconnect()
  }, [token, mostrarAvisos, queryClient])
}
