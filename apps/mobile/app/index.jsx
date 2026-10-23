import { Redirect } from 'expo-router'
import { useAuth } from '../lib/auth'
import { Carregando } from '../components/ui'

export default function Inicio() {
  const { token, pronto } = useAuth()
  if (!pronto) return <Carregando />
  return <Redirect href={token ? '/inicio' : '/login'} />
}
