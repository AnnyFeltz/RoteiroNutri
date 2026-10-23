import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { API_URL } from './api'

/** Atualiza o app quando o nutricionista publica um plano novo ou mexe na agenda. */
export function useTempoReal(token, aoDesativar) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!token) return
    const socket = io(API_URL.replace(/\/api\/?$/, ''), { auth: { token }, transports: ['websocket'] })
    socket.on('plano:atualizado', () => queryClient.invalidateQueries())
    socket.on('consulta:atualizada', () => queryClient.invalidateQueries({ queryKey: ['perfil'] }))
    socket.on('conta:desativada', () => aoDesativar('Seu acesso foi desativado pelo nutricionista.'))
    return () => socket.disconnect()
  }, [token, queryClient, aoDesativar])
}
