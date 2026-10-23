# RoteiroNutri — Web (nutricionista)

Painel web **exclusivo do nutricionista** (React + Vite + Tailwind). O paciente usa o app mobile (`apps/mobile`).

```bash
cp .env.example .env      # VITE_API_URL=http://localhost:3001/api
pnpm dev:web              # a partir da raiz do monorepo
```

Telas: dashboard, pacientes (cadastro, anamnese, avaliação, evolução, consultas), editor de planos com
calculadora (Mifflin-St Jeor / Harris-Benedict) e substitutos, painel de planos, agenda, tabela TACO,
evolução, relatórios/ficha em PDF, notificações e configurações.
