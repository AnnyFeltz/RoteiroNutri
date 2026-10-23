import { Platform } from 'react-native'
import Constants from 'expo-constants'

/**
 * URL da API. Ordem de prioridade:
 * 1. EXPO_PUBLIC_API_URL (arquivo .env do app)
 * 2. IP da máquina que está rodando o Expo (funciona no Expo Go pela rede local)
 * 3. localhost (ou 10.0.2.2 no emulador Android)
 */
function descobrirApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host && Platform.OS !== 'web') return `http://${host}:3001/api`
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001/api'
  return 'http://localhost:3001/api'
}

export const API_URL = descobrirApiUrl()

let tokenAtual = null
let aoExpirarSessao = () => {}

export function definirToken(token) {
  tokenAtual = token
}

export function definirAoExpirarSessao(fn) {
  aoExpirarSessao = fn
}

export class ApiError extends Error {
  constructor(mensagem, status) {
    super(mensagem)
    this.status = status
  }
}

export async function api(caminho, { method = 'GET', body, query } = {}) {
  let url = `${API_URL}${caminho}`
  if (query) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    if (params.length) url += `?${params.join('&')}`
  }
  const headers = { Accept: 'application/json' }
  if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let resposta
  try {
    resposta = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError('Sem conexão com o servidor. Verifique sua internet.', 0)
  }
  if (resposta.status === 204) return null
  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    // token expirado ou paciente desativado pelo nutricionista
    if ((resposta.status === 401 || resposta.status === 403) && tokenAtual) aoExpirarSessao(dados?.erro)
    throw new ApiError(dados?.erro || 'Erro inesperado', resposta.status)
  }
  return dados
}
