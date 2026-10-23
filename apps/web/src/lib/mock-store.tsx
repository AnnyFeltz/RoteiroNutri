import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { authApi, authToken, ApiError } from "./api-client";
// ---------- Types ----------
export interface Nutritionist {
  id: string;
  name: string;
  email: string;
  crn: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  age: number;
  sex: "M" | "F";
  heightCm: number;
  weightKg: number;
  initialWeightKg: number;
  targetWeightKg: number;
  bodyFatPct: number;
  leanMassPct: number;
  active: boolean;
  status: "Retorno" | "Avaliação" | "Novo";
  goal: "emagrecimento" | "manutencao" | "hipertrofia" | "saude" | "performance";
  startDate: string;
  nextConsult: string;
  lastConsult: string;
  todayTime?: string;
  lastActivePlanId?: string;
  // Anamnese
  allergies: string;
  medicalHistory: string;
  lifestyle: string;
  foodRecall: string;
  // Evolution series (weight by month label)
  evolution: { month: string; weight: number }[];
  consultations?: { id: string; date: string; time?: string; type: string; notes: string }[];
  avatarColor: string;
}

export interface MealFoodItem {
  foodId: string;
  grams: number;
  substitutes: { foodId: string; grams: number }[];
}

export interface Meal {
  id: string;
  name: string;
  time: string; // "08:00"
  foods: MealFoodItem[];
}

export interface MealPlan {
  id: string;
  patientId: string;
  name: string;
  active: boolean;
  createdAt: string;
  targetKcal: number;
  macros: { carbs: number; protein: number; fat: number }; // percent
  meals: Meal[];
  adherenceLog: Record<string, string[]>; // date -> array of completed meal ids
}

export type Role = "nutricionista" | "paciente" | null;

interface Session {
  role: Role;
  nutritionistId?: string;
  patientId?: string;
}

// ---------- Seed data ----------
const NUTRI: Nutritionist = {
  id: "n1",
  name: "Dra. Caroline",
  email: "caroline@roteironutri.com",
  crn: "CRN-8 12345",
};

const PATIENTS: Patient[] = [
  {
    id: "p1", name: "Ana Clara Silva", email: "ana@email.com", age: 25, sex: "F",
    heightCm: 168, weightKg: 62, initialWeightKg: 67, targetWeightKg: 57,
    bodyFatPct: 28, leanMassPct: 72, active: true, status: "Retorno",
    goal: "emagrecimento", startDate: "12/03/2024",
    nextConsult: "18/06/2024", lastConsult: "28/05/2024", todayTime: "08:00",
    allergies: "Lactose (intolerância leve)",
    medicalHistory: "Sem comorbidades. Exames de sangue dentro do padrão.",
    lifestyle: "Trabalha 8h em escritório, treina musculação 3x/semana à noite.",
    foodRecall: "Café: pão francês + café com leite. Almoço: arroz, feijão, frango, salada. Jantar: lanche.",
    evolution: [
      { month: "Jan", weight: 67 }, { month: "Fev", weight: 66.2 },
      { month: "Mar", weight: 65 }, { month: "Abr", weight: 63.8 },
      { month: "Mai", weight: 62.5 }, { month: "Jun", weight: 62 },
    ],
    avatarColor: "oklch(0.55 0.13 45)",
    consultations: [
      { id: "c1", date: "28/05/2024", type: "Retorno", notes: "Ajuste no plano alimentar. Adesão de 92%. Paciente relata mais energia." },
      { id: "c2", date: "20/04/2024", type: "Retorno", notes: "Redução de 1,2kg desde a última consulta. Mantida a estratégia." },
      { id: "c3", date: "12/03/2024", type: "Avaliação inicial", notes: "Início do acompanhamento. Plano de emagrecimento criado. Meta: -5kg em 6 meses." },
    ],
  },
  {
    id: "p2", name: "João Pedro Souza", email: "joao@email.com", age: 32, sex: "M",
    heightCm: 178, weightKg: 84, initialWeightKg: 80, targetWeightKg: 88,
    bodyFatPct: 18, leanMassPct: 82, active: true, status: "Retorno",
    goal: "hipertrofia", startDate: "05/02/2024",
    nextConsult: "20/06/2024", lastConsult: "22/05/2024", todayTime: "09:30",
    allergies: "Nenhuma",
    medicalHistory: "Saudável.",
    lifestyle: "Treina musculação 5x/semana, trabalha em home office.",
    foodRecall: "Refeições frequentes, alta ingestão de proteína.",
    evolution: [
      { month: "Jan", weight: 80 }, { month: "Fev", weight: 81 },
      { month: "Mar", weight: 82 }, { month: "Abr", weight: 82.8 },
      { month: "Mai", weight: 83.5 }, { month: "Jun", weight: 84 },
    ],
    avatarColor: "oklch(0.52 0.13 142)",
  },
  {
    id: "p3", name: "Mariana Lima", email: "mariana@email.com", age: 41, sex: "F",
    heightCm: 162, weightKg: 70, initialWeightKg: 74, targetWeightKg: 64,
    bodyFatPct: 32, leanMassPct: 68, active: true, status: "Avaliação",
    goal: "emagrecimento", startDate: "20/04/2024",
    nextConsult: "25/06/2024", lastConsult: "20/05/2024", todayTime: "11:00",
    allergies: "Glúten",
    medicalHistory: "Hipotireoidismo controlado.",
    lifestyle: "Caminhadas 3x/semana, rotina corrida.",
    foodRecall: "Alimentação irregular durante a semana.",
    evolution: [
      { month: "Jan", weight: 74 }, { month: "Fev", weight: 73.5 },
      { month: "Mar", weight: 72.8 }, { month: "Abr", weight: 71.5 },
      { month: "Mai", weight: 70.8 }, { month: "Jun", weight: 70 },
    ],
    avatarColor: "oklch(0.72 0.14 70)",
  },
  {
    id: "p4", name: "Lucas Martins", email: "lucas@email.com", age: 28, sex: "M",
    heightCm: 175, weightKg: 72, initialWeightKg: 70, targetWeightKg: 76,
    bodyFatPct: 14, leanMassPct: 86, active: true, status: "Retorno",
    goal: "hipertrofia", startDate: "10/01/2024",
    nextConsult: "22/06/2024", lastConsult: "18/05/2024", todayTime: "14:00",
    allergies: "Nenhuma",
    medicalHistory: "Atleta amador.",
    lifestyle: "Corrida 4x/semana + musculação 3x/semana.",
    foodRecall: "Dieta balanceada, alta em carboidratos pré-treino.",
    evolution: [
      { month: "Jan", weight: 70 }, { month: "Fev", weight: 70.5 },
      { month: "Mar", weight: 71 }, { month: "Abr", weight: 71.5 },
      { month: "Mai", weight: 71.8 }, { month: "Jun", weight: 72 },
    ],
    avatarColor: "oklch(0.42 0.09 142)",
  },
  {
    id: "p5", name: "Beatriz Oliveira", email: "beatriz@email.com", age: 36, sex: "F",
    heightCm: 165, weightKg: 68, initialWeightKg: 72, targetWeightKg: 62,
    bodyFatPct: 30, leanMassPct: 70, active: true, status: "Avaliação",
    goal: "saude", startDate: "15/03/2024",
    nextConsult: "28/06/2024", lastConsult: "15/05/2024", todayTime: "16:00",
    allergies: "Frutos do mar",
    medicalHistory: "Colesterol elevado.",
    lifestyle: "Pilates 2x/semana.",
    foodRecall: "Café da manhã reforçado, almoço executivo, jantar leve.",
    evolution: [
      { month: "Jan", weight: 72 }, { month: "Fev", weight: 71 },
      { month: "Mar", weight: 70 }, { month: "Abr", weight: 69.5 },
      { month: "Mai", weight: 68.8 }, { month: "Jun", weight: 68 },
    ],
    avatarColor: "oklch(0.55 0.13 45)",
  },
];

// Default seed plan for Ana Clara (p1)
const seedPlan: MealPlan = {
  id: "v1",
  patientId: "p1",
  name: "Plano - Emagrecimento",
  active: true,
  createdAt: "12/03/2024",
  targetKcal: 1700,
  macros: { carbs: 40, protein: 26, fat: 34 },
  meals: [
    {
      id: "m1", name: "Café da manhã", time: "08:00",
      foods: [
        { foodId: "tapioca", grams: 50, substitutes: [{ foodId: "pao-integral", grams: 50 }, { foodId: "aveia", grams: 40 }] },
        { foodId: "ovo-cozido", grams: 100, substitutes: [{ foodId: "queijo-cottage", grams: 80 }] },
        { foodId: "mamao", grams: 150, substitutes: [{ foodId: "morango", grams: 200 }, { foodId: "melao", grams: 200 }] },
      ],
    },
    {
      id: "m2", name: "Lanche da manhã", time: "10:00",
      foods: [
        { foodId: "iogurte-natural", grams: 170, substitutes: [
          { foodId: "iogurte-grego", grams: 170 },
          { foodId: "queijo-cottage", grams: 100 },
          { foodId: "vitamina-frutas", grams: 200 },
          { foodId: "pudim-chia", grams: 100 },
        ] },
      ],
    },
    {
      id: "m3", name: "Almoço", time: "12:30",
      foods: [
        { foodId: "arroz-integral", grams: 100, substitutes: [{ foodId: "batata-doce", grams: 130 }, { foodId: "mandioca", grams: 80 }] },
        { foodId: "feijao-carioca", grams: 80, substitutes: [{ foodId: "feijao-preto", grams: 80 }] },
        { foodId: "peito-frango", grams: 120, substitutes: [{ foodId: "tilapia", grams: 130 }, { foodId: "patinho-bovino", grams: 100 }] },
        { foodId: "brocolis", grams: 100, substitutes: [{ foodId: "alface", grams: 80 }] },
      ],
    },
    {
      id: "m4", name: "Lanche da tarde", time: "16:00",
      foods: [
        { foodId: "banana-prata", grams: 100, substitutes: [{ foodId: "maca", grams: 130 }] },
        { foodId: "castanha-para", grams: 15, substitutes: [] },
      ],
    },
    {
      id: "m5", name: "Jantar", time: "19:00",
      foods: [
        { foodId: "tilapia", grams: 150, substitutes: [{ foodId: "salmao", grams: 120 }, { foodId: "peito-frango", grams: 130 }] },
        { foodId: "batata-doce", grams: 120, substitutes: [{ foodId: "arroz-integral", grams: 100 }] },
        { foodId: "brocolis", grams: 100, substitutes: [{ foodId: "alface", grams: 80 }] },
      ],
    },
  ],
  adherenceLog: { today: ["m1", "m2"] },
};

export interface PatientUpdate {
  id: string;
  patientId: string;
  field: string;
  oldValue: string;
  newValue: string;
  at: string; // ISO
  read: boolean;
}

export interface PasswordResetRequest {
  id: string;
  patientId: string;
  at: string;
  status: "pendente" | "aprovada" | "negada";
  newPassword?: string;
}

// ---------- Store ----------
interface Store {
  session: Session;
  nutritionist: Nutritionist;
  patients: Patient[];
  plans: MealPlan[];
  patientUpdates: PatientUpdate[];
  passwordResets: PasswordResetRequest[];
  nutriPassword: string;
  patientPasswords: Record<string, string>;
  loginNutri: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  signupNutri: (data: { name: string; email: string; password: string; crn: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  addPatient: (p: Omit<Patient, "id" | "active" | "evolution" | "avatarColor">) => string;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  updatePatientByPatient: (id: string, patch: Partial<Patient>) => void;
  deactivatePatient: (id: string) => void;
  reactivatePatient: (id: string) => void;
  getPatient: (id: string) => Patient | undefined;
  getActivePlan: (patientId: string) => MealPlan | undefined;
  getPlansForPatient: (patientId: string) => MealPlan[];
  getPlanById: (planId: string) => MealPlan | undefined;
  upsertPlan: (plan: MealPlan) => void;
  toggleMealConsumed: (planId: string, mealId: string) => void;
  substituteFood: (planId: string, mealId: string, foodIndex: number, newFoodId: string, grams: number) => void;
  addConsultation: (patientId: string, c: { date: string; time?: string; type: string; notes: string }) => { ok: boolean; error?: string };
  deleteConsultation: (patientId: string, consultationId: string) => void;
  markUpdatesRead: () => void;
  clearUpdates: () => void;
  changeNutriPassword: (current: string, next: string) => boolean;
  requestPatientPasswordReset: (email: string) => { ok: boolean; patientName?: string; error?: string };
  approvePasswordReset: (id: string) => { ok: boolean; email?: string; newPassword?: string };
  denyPasswordReset: (id: string) => void;
}

const StoreCtx = createContext<Store | null>(null);

const SESSION_KEY = "roteiro-nutri-session";
const DATA_KEY = "roteiro-nutri-data-v2";

function loadData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() => loadData<Session>(SESSION_KEY, { role: null }));
  const initial = loadData<{
    patients?: Patient[]; plans?: MealPlan[]; patientUpdates?: PatientUpdate[];
    passwordResets?: PasswordResetRequest[]; nutriPassword?: string;
    patientPasswords?: Record<string, string>;
  }>(DATA_KEY, {});
  const [patients, setPatients] = useState<Patient[]>(initial.patients ?? PATIENTS);
  const [plans, setPlans] = useState<MealPlan[]>(initial.plans ?? [seedPlan]);
  const [patientUpdates, setPatientUpdates] = useState<PatientUpdate[]>(initial.patientUpdates ?? []);
  const [passwordResets, setPasswordResets] = useState<PasswordResetRequest[]>(initial.passwordResets ?? []);
  const [nutriPassword, setNutriPassword] = useState<string>(initial.nutriPassword ?? "demo1234");
  const [patientPasswords, setPatientPasswords] = useState<Record<string, string>>(
    initial.patientPasswords ?? Object.fromEntries((initial.patients ?? PATIENTS).map((p) => [p.id, "demo1234"]))
  );

  useEffect(() => {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify({
        patients, plans, patientUpdates, passwordResets, nutriPassword, patientPasswords,
      }));
    } catch {}
    // light-weight cookie marker for visit persistence
    try { document.cookie = `roteiro-nutri-visited=1; max-age=${60*60*24*365}; path=/; SameSite=Lax`; } catch {}
  }, [patients, plans, patientUpdates, passwordResets, nutriPassword, patientPasswords]);

  const genPwd = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let s = "";
    for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };

  const store: Store = {
    session,
    nutritionist: NUTRI,
    patients,
    plans,
    patientUpdates,
    passwordResets,
    nutriPassword,
    patientPasswords,
    // Autenticação real contra o apps/backend. O restante dos dados (pacientes,
    // planos, agenda...) segue mockado, pois o back só tem as rotas de auth.
    // Ver MIGRATION_NOTES.md.
    loginNutri: async (email, password) => {
      try {
        const { token } = await authApi.loginNutricionista({ email, senha: password });
        authToken.set(token);
        setSession({ role: "nutricionista", nutritionistId: NUTRI.id });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof ApiError ? err.message : "Não foi possível entrar." };
      }
    },
    logout: () => {
      authToken.clear();
      setSession({ role: null });
    },
    signupNutri: async (data) => {
      try {
        const { token } = await authApi.registrarNutricionista({
          nome: data.name, email: data.email, senha: data.password, crn: data.crn,
        });
        authToken.set(token);
        setSession({ role: "nutricionista", nutritionistId: NUTRI.id });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof ApiError ? err.message : "Não foi possível criar a conta." };
      }
    },
    addPatient: (p) => {
      const id = `p${Date.now()}`;
      const newP: Patient = {
        ...p, id, active: true,
        evolution: [{ month: "Atual", weight: p.weightKg }],
        avatarColor: "oklch(0.52 0.13 142)",
      };
      setPatients((prev) => [newP, ...prev]);
      setPatientPasswords((prev) => ({ ...prev, [id]: "demo1234" }));
      return id;
    },
    updatePatient: (id, patch) => {
      setPatients((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      if (patch.active === false) {
        setPlans((prev) => prev.map((pl) => (pl.patientId === id ? { ...pl, active: false } : pl)));
      }
    },
    updatePatientByPatient: (id, patch) => {
      setPatients((prev) => prev.map((x) => {
        if (x.id !== id) return x;
        const updates: PatientUpdate[] = [];
        (Object.keys(patch) as (keyof Patient)[]).forEach((k) => {
          const oldV = (x as any)[k];
          const newV = (patch as any)[k];
          if (oldV !== newV) {
            updates.push({
              id: `u${Date.now()}-${k}`,
              patientId: id,
              field: String(k),
              oldValue: String(oldV ?? ""),
              newValue: String(newV ?? ""),
              at: new Date().toISOString(),
              read: false,
            });
          }
        });
        if (updates.length) setPatientUpdates((prev) => [...updates, ...prev]);
        return { ...x, ...patch };
      }));
    },
    deactivatePatient: (id) => {
      const activePlan = plans.find((pl) => pl.patientId === id && pl.active);
      setPatients((prev) => prev.map((x) => (x.id === id ? { ...x, active: false, lastActivePlanId: activePlan?.id ?? x.lastActivePlanId } : x)));
      setPlans((prev) => prev.map((pl) => (pl.patientId === id ? { ...pl, active: false } : pl)));
    },
    reactivatePatient: (id) => {
      const pat = patients.find((x) => x.id === id);
      const restoreId = pat?.lastActivePlanId;
      setPatients((prev) => prev.map((x) => (x.id === id ? { ...x, active: true } : x)));
      if (restoreId) {
        setPlans((prev) => prev.map((pl) => {
          if (pl.patientId !== id) return pl;
          return pl.id === restoreId ? { ...pl, active: true } : { ...pl, active: false };
        }));
      }
    },
    getPatient: (id) => patients.find((p) => p.id === id),
    getActivePlan: (patientId) => {
      const pat = patients.find((x) => x.id === patientId);
      if (!pat?.active) return undefined;
      return plans.find((p) => p.patientId === patientId && p.active);
    },
    getPlansForPatient: (patientId) => plans.filter((p) => p.patientId === patientId),
    getPlanById: (planId) => plans.find((p) => p.id === planId),
    upsertPlan: (plan) => {
      setPlans((prev) => {
        const filtered = prev.map((p) =>
          p.patientId === plan.patientId && p.id !== plan.id ? { ...p, active: false } : p
        );
        const exists = filtered.some((p) => p.id === plan.id);
        return exists ? filtered.map((p) => (p.id === plan.id ? plan : p)) : [...filtered, plan];
      });
    },
    markUpdatesRead: () => setPatientUpdates((prev) => prev.map((u) => ({ ...u, read: true }))),
    clearUpdates: () => setPatientUpdates([]),
    toggleMealConsumed: (planId, mealId) => {
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== planId) return p;
          const log = { ...p.adherenceLog };
          const today = log.today ?? [];
          log.today = today.includes(mealId) ? today.filter((m) => m !== mealId) : [...today, mealId];
          return { ...p, adherenceLog: log };
        })
      );
    },
    substituteFood: (planId, mealId, foodIndex, newFoodId, grams) => {
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== planId) return p;
          const meals = p.meals.map((m) => {
            if (m.id !== mealId) return m;
            const foods = m.foods.map((f, i) =>
              i === foodIndex ? { ...f, foodId: newFoodId, grams } : f
            );
            return { ...m, foods };
          });
          return { ...p, meals };
        })
      );
    },
    addConsultation: (patientId, c) => {
      // Conflict check across all patients on same date+time
      if (c.time) {
        const conflict = patients.some((pp) =>
          (pp.consultations ?? []).some((cc) => cc.date === c.date && cc.time === c.time)
        );
        if (conflict) {
          return { ok: false, error: `Já existe uma consulta marcada em ${c.date} às ${c.time}.` };
        }
      }
      const newC = { id: `c${Date.now()}`, ...c };
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? { ...p, consultations: [newC, ...(p.consultations ?? [])] }
            : p
        )
      );
      return { ok: true };
    },
    deleteConsultation: (patientId, consultationId) => {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? { ...p, consultations: (p.consultations ?? []).filter((c) => c.id !== consultationId) }
            : p
        )
      );
    },
    changeNutriPassword: (current, next) => {
      if (current !== nutriPassword) return false;
      if (!next || next.length < 6) return false;
      setNutriPassword(next);
      return true;
    },
    requestPatientPasswordReset: (email) => {
      const p = patients.find((x) => x.email.toLowerCase() === email.toLowerCase());
      if (!p) return { ok: false, error: "E-mail não cadastrado." };
      // avoid duplicate pending requests
      if (passwordResets.some((r) => r.patientId === p.id && r.status === "pendente")) {
        return { ok: true, patientName: p.name };
      }
      setPasswordResets((prev) => [
        { id: `pr${Date.now()}`, patientId: p.id, at: new Date().toISOString(), status: "pendente" },
        ...prev,
      ]);
      return { ok: true, patientName: p.name };
    },
    approvePasswordReset: (id) => {
      const req = passwordResets.find((r) => r.id === id);
      if (!req) return { ok: false };
      const pat = patients.find((p) => p.id === req.patientId);
      if (!pat) return { ok: false };
      const newPwd = genPwd();
      setPatientPasswords((prev) => ({ ...prev, [req.patientId]: newPwd }));
      setPasswordResets((prev) => prev.map((r) => (r.id === id ? { ...r, status: "aprovada", newPassword: newPwd } : r)));
      return { ok: true, email: pat.email, newPassword: newPwd };
    },
    denyPasswordReset: (id) => {
      setPasswordResets((prev) => prev.map((r) => (r.id === id ? { ...r, status: "negada" } : r)));
    },
  };

  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be inside MockStoreProvider");
  return ctx;
}
