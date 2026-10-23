import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, authToken, ApiError } from "../lib/api-client";

// Só paciente. Login é real (apps/backend); plano/evolução ainda são mock local
// porque o back só tem as rotas de auth. Ver MOBILE_MIGRATION_NOTES.md.
const SEED_PATIENTS = [
  { id: "p1", name: "Ana Clara Silva", email: "ana@email.com", age: 25, heightCm: 168, weightKg: 62, initialWeightKg: 67, targetWeightKg: 57, active: true, status: "Retorno", goal: "emagrecimento", allergies: "Lactose (intolerância leve)", evolution: [{ month: "Jan", weight: 67 }, { month: "Fev", weight: 66.2 }, { month: "Mar", weight: 65 }, { month: "Abr", weight: 63.8 }, { month: "Mai", weight: 62.5 }, { month: "Jun", weight: 62 }], avatarColor: "#ae5528" },
  { id: "p2", name: "João Pedro Souza", email: "joao@email.com", age: 32, heightCm: 178, weightKg: 84, initialWeightKg: 80, targetWeightKg: 88, active: true, status: "Retorno", goal: "hipertrofia", allergies: "Nenhuma", evolution: [{ month: "Jan", weight: 80 }, { month: "Fev", weight: 81 }, { month: "Mar", weight: 82 }, { month: "Abr", weight: 82.8 }, { month: "Mai", weight: 83.5 }, { month: "Jun", weight: 84 }], avatarColor: "#367b30" },
];

const SEED_PLAN = {
  id: "v1", patientId: "p1", name: "Plano - Emagrecimento", active: true, targetKcal: 1700,
  macros: { carbs: 40, protein: 26, fat: 34 },
  meals: [
    { id: "m1", name: "Café da manhã", time: "08:00", items: ["Tapioca (50g)", "Ovo cozido (100g)", "Mamão (150g)"] },
    { id: "m2", name: "Lanche da manhã", time: "10:00", items: ["Iogurte natural (170g)"] },
    { id: "m3", name: "Almoço", time: "12:30", items: ["Arroz integral (100g)", "Feijão carioca (80g)", "Peito de frango (120g)", "Brócolis (100g)"] },
    { id: "m4", name: "Lanche da tarde", time: "16:00", items: ["Banana prata (100g)", "Castanha-do-pará (15g)"] },
    { id: "m5", name: "Jantar", time: "19:00", items: ["Tilápia (150g)", "Batata-doce (120g)", "Brócolis (100g)"] },
  ],
  adherenceLog: { today: ["m1", "m2"] },
};

const SESSION_KEY = "roteironutri_session";
const DATA_KEY = "roteironutri_data";
const AppStoreCtx = createContext(null);

export function AppStoreProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState({ role: null });
  const [patients, setPatients] = useState(SEED_PATIENTS);
  const [plans, setPlans] = useState([SEED_PLAN]);

  useEffect(() => {
    (async () => {
      try {
        const [rawSession, rawData] = await Promise.all([AsyncStorage.getItem(SESSION_KEY), AsyncStorage.getItem(DATA_KEY)]);
        if (rawSession) setSessionState(JSON.parse(rawSession));
        if (rawData) {
          const parsed = JSON.parse(rawData);
          if (parsed.patients) setPatients(parsed.patients);
          if (parsed.plans) setPlans(parsed.plans);
        }
      } catch {
        // dados locais corrompidos: segue com os padrões
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setSession = useCallback((next) => {
    setSessionState(next);
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(DATA_KEY, JSON.stringify({ patients, plans })).catch(() => {});
  }, [ready, patients, plans]);

  const loginPatient = useCallback(async (email, senha) => {
    try {
      const { paciente, token } = await authApi.loginPaciente({ email, senha });
      await authToken.set(token);
      const existing = patients.find((p) => p.email.toLowerCase() === email.toLowerCase());
      let patientId = existing?.id;
      if (!existing) {
        patientId = `p${Date.now()}`;
        setPatients((prev) => [{ id: patientId, name: paciente?.nome ?? email, email, active: true, status: "Novo", evolution: [], avatarColor: "#367b30" }, ...prev]);
      }
      setSession({ role: "paciente", patientId });
      return { ok: true, patientId };
    } catch (err) {
      return { ok: false, error: err instanceof ApiError ? err.message : "Não foi possível entrar." };
    }
  }, [patients, setSession]);

  const logout = useCallback(async () => {
    await authToken.clear();
    setSession({ role: null });
  }, [setSession]);

  const getPatient = useCallback((id) => patients.find((p) => p.id === id), [patients]);
  const getActivePlan = useCallback((patientId) => plans.find((pl) => pl.patientId === patientId && pl.active), [plans]);

  const toggleMealConsumed = useCallback((planId, mealId) => {
    setPlans((prev) => prev.map((pl) => {
      if (pl.id !== planId) return pl;
      const today = pl.adherenceLog?.today ?? [];
      return { ...pl, adherenceLog: { ...pl.adherenceLog, today: today.includes(mealId) ? today.filter((m) => m !== mealId) : [...today, mealId] } };
    }));
  }, []);

  const value = { ready, session, patients, plans, loginPatient, logout, getPatient, getActivePlan, toggleMealConsumed };
  return <AppStoreCtx.Provider value={value}>{children}</AppStoreCtx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreCtx);
  if (!ctx) throw new Error("useAppStore precisa estar dentro de <AppStoreProvider>");
  return ctx;
}
