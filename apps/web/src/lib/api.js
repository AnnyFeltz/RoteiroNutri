// Cliente HTTP da API do Roteiro Nutri.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const TOKEN_KEY = 'roteiro-nutri:token'

export function lerToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function salvarToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // navegação privada: a sessão vale só enquanto a aba estiver aberta
  }
}

export class ApiError extends Error {
  constructor(mensagem, status, detalhes) {
    super(mensagem)
    this.status = status
    this.detalhes = detalhes
  }
}

let aoExpirarSessao = () => {}
export function definirAoExpirarSessao(fn) {
  aoExpirarSessao = fn
}

export async function api(caminho, { method = 'GET', body, query } = {}) {
  let url = `${API_URL}${caminho}`
  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    )
    if ([...params].length) url += `?${params}`
  }
  const headers = { Accept: 'application/json' }
  const token = lerToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let resposta
  try {
    resposta = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se a API está rodando.', 0)
  }

  if (resposta.status === 204) return null
  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    if (resposta.status === 401 && token) aoExpirarSessao()
    throw new ApiError(dados?.erro || 'Erro inesperado', resposta.status, dados?.detalhes)
  }
  return dados
}
