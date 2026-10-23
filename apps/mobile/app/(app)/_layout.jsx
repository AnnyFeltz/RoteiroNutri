import { Redirect, Stack } from 'expo-router'
import { useAuth } from '../../lib/auth'
import { useTempoReal } from '../../lib/tempoReal'
import { Carregando } from '../../components/ui'
import { cores } from '../../lib/tema'

// Área logada: só o paciente autenticado entra aqui
export default function AreaDoPaciente() {
  const { token, pronto, sair } = useAuth()
  useTempoReal(token, sair)
  if (!pronto) return <Carregando />
  if (!token) return <Redirect href="/login" />
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.creme } }} />
}
