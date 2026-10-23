import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Token guardado de forma segura (Keychain/Keystore). No navegador (expo web) usa localStorage.
const CHAVE = 'roteiro-nutri.token'

export async function lerToken() {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(CHAVE)
    } catch {
      return null
    }
  }
  return SecureStore.getItemAsync(CHAVE)
}

export async function salvarToken(token) {
  if (Platform.OS === 'web') {
    try {
      if (token) localStorage.setItem(CHAVE, token)
      else localStorage.removeItem(CHAVE)
    } catch {
      // navegação privada: sessão só em memória
    }
    return
  }
  if (token) await SecureStore.setItemAsync(CHAVE, token)
  else await SecureStore.deleteItemAsync(CHAVE)
}
