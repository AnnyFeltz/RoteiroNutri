import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure EXPO_PUBLIC_API_URL no .env (use o IP da máquina, não localhost, no celular).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";
const TOKEN_KEY = "roteironutri_token";

export const authToken = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  clear: () => AsyncStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = await authToken.get();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : undefined;
  if (!res.ok) {
    throw new ApiError(data?.erro ?? data?.mensagem ?? data?.message ?? "Não foi possível falar com o servidor.", res.status);
  }
  return data;
}

// Mobile é só paciente; nutricionista usa o apps/web.
export const authApi = {
  loginPaciente: (body) => request("/auth/pacientes/login", { method: "POST", body: JSON.stringify(body) }),
  solicitarRecuperacaoSenha: (body) => request("/auth/recuperar-senha", { method: "POST", body: JSON.stringify(body) }),
  redefinirSenha: (body) => request("/auth/redefinir-senha", { method: "POST", body: JSON.stringify(body) }),
};
