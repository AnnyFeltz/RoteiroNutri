# Roteiro Nutri

Sistema de gerenciamento de pacientes e planos alimentares para nutricionistas — TCC de Análise e
Desenvolvimento de Sistemas (IFPR Paranaguá).

| App | Para quem | Tecnologia |
|-----|-----------|------------|
| [`apps/web`](apps/web) | **Nutricionista** (painel web) | React + Vite + Tailwind |
| [`apps/mobile`](apps/mobile) | **Paciente** (app no celular) | React Native + Expo Router |
| [`apps/backend`](apps/backend) | API REST + tempo real | Node.js + Express + Sequelize + PostgreSQL + Socket.io |
| [`packages/shared`](packages/shared) | Validações (Zod) e cálculos nutricionais usados pelos três | JavaScript |

A divisão de acesso é garantida pela API: rotas do painel só aceitam token de nutricionista e as rotas
`/api/app/*` só aceitam token de paciente.

## Como rodar

Pré-requisitos: Node 20+, pnpm 9, PostgreSQL.

```bash
pnpm install

# 1. backend
cp apps/backend/.env.example apps/backend/.env   # ajuste DB_* e JWT_SECRET
cd apps/backend && npm run db:create && cd ../..
pnpm db:setup          # migrations + tabela TACO (596 alimentos)
pnpm db:seed:demo      # opcional: dados de demonstração
pnpm dev:backend       # http://localhost:3001/api

# 2. web do nutricionista (outro terminal)
cp apps/web/.env.example apps/web/.env
pnpm dev:web           # http://localhost:5173

# 3. app do paciente (outro terminal)
pnpm dev:mobile        # abra no Expo Go (mesma rede Wi-Fi)
```

Acessos de demonstração (senha `demo1234`): nutricionista `caroline@roteironutri.com` no web;
pacientes `ana@email.com`, `joao@email.com`, ... no app.

Detalhes de cada parte (endpoints, modelo de dados, telas) nos READMEs de cada app.

## Dados

A tabela TACO (NEPA/UNICAMP, 4ª edição) vem de [raulfdm/taco-api](https://github.com/raulfdm/taco-api) (MIT)
e é carregada no banco pelo seed `20260920200000-alimentos-taco.js`.
