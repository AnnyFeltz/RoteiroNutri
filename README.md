# Roteiro Nutri

Sistema de gerenciamento de pacientes e planos alimentares para nutricionistas — TCC de Análise e
Desenvolvimento de Sistemas (IFPR Paranaguá).

| App | Para quem | Tecnologia |
|-----|-----------|------------|
| [`apps/web`](apps/web) | **Nutricionista** (painel web) | React + CSS |
| [`apps/mobile`](apps/mobile) | **Paciente** (app no celular) | React Native (Expo) |
| [`apps/backend`](apps/backend) | API REST + notificações em tempo real | Node.js + PostgreSQL |
| [`packages/shared`](packages/shared) | Validações (Zod) e cálculos nutricionais usados pelos três | JavaScript |

A divisão de acesso é garantida pela API: rotas do painel só aceitam token de nutricionista e as rotas
`/api/app/*` só aceitam token de paciente.

## Tecnologias

| Tecnologia | Onde é usada |
|------------|--------------|
| **JavaScript** | Linguagem de todo o projeto (web, mobile, API e pacote compartilhado) |
| **React** | Front-end web do nutricionista (`apps/web`) |
| **React Native** | Front-end mobile do paciente (`apps/mobile`, com Expo) |
| **Node.js** | Back-end / API REST (`apps/backend`, com Express) |
| **PostgreSQL** | Banco de dados (administrado pelo **DBeaver**) |
| **Lucide** | Ícones (`lucide-react` na web e `lucide-react-native` no app) |
| **Zod** | Validação: os mesmos schemas validam os formulários da web, do app e as requisições na API |
| **Socket.io** | Notificações em tempo real (paciente alterou o perfil, pediu nova senha, novo plano publicado...) |
| **CSS** | Estilo da web em CSS puro (`apps/web/src/estilos`); no app, `StyleSheet` do React Native |

### Bibliotecas de apoio

| Biblioteca | Para quê |
|------------|----------|
| Express | Rotas e middlewares da API |
| Sequelize + sequelize-cli | Acesso ao PostgreSQL, migrations e seeds |
| bcrypt / jsonwebtoken | Senhas criptografadas e login com token JWT |
| nodemailer | Envio de e-mail (senha do paciente, recuperação de senha) |
| React Router / Expo Router | Navegação entre telas (web / app) |
| TanStack React Query | Cache e atualização dos dados vindos da API |
| Recharts / react-native-svg | Gráficos (web / app) |
| jsPDF + jspdf-autotable | Exportação da ficha do paciente em PDF |
| Sonner | Avisos (toasts) na web |
| expo-secure-store | Guarda o login do paciente com segurança no celular |
| expo-image-picker + expo-image-manipulator | Foto de perfil do paciente (escolhida da galeria e reduzida antes de enviar) |
| Turborepo + pnpm | Monorepo (roda web, mobile e API juntos) |

## Como rodar

Pré-requisitos: Node 20+, pnpm 9, PostgreSQL.

```bash
pnpm install

# 1. backend
cp apps/backend/.env.example apps/backend/.env   # ajuste DB_* e JWT_SECRET
cd apps/backend && npm run db:create && cd ../..
pnpm db:setup          # migrations + tabela TACO (597 alimentos)
pnpm db:seed:demo      # opcional: dados de demonstração
pnpm dev:backend       # http://localhost:3001/api

# 2. web do nutricionista (outro terminal)
cp apps/web/.env.example apps/web/.env
pnpm dev:web           # http://localhost:5173

# 3. app do paciente (outro terminal)
pnpm dev:mobile        # mostra o QR code: abra no Expo Go (mesma rede Wi-Fi)
```

Acessos de demonstração (senha `demo1234`): nutricionista `caroline@roteironutri.com` no web;
pacientes `ana@email.com`, `joao@email.com`, ... no app.

## Banco de dados no DBeaver

1. No DBeaver: **Banco de dados → Nova conexão → PostgreSQL**.
2. Preencha com os mesmos dados do `apps/backend/.env`: host `localhost`, porta `5432`, banco `roteironutri`,
   usuário e senha do seu Postgres.
3. Rode as migrations (`pnpm db:setup`) e atualize a conexão (F5): as tabelas aparecem em
   `roteironutri → Schemas → public → Tabelas` (`nutricionistas`, `pacientes`, `planos_alimentares`, `refeicoes`,
   `refeicao_alimentos`, `substitutos`, `alimentos`, `adesoes`, `consultas`, `evolucao_peso`, ...).
4. Para ver o diagrama ER (modelo relacional): clique com o botão direito em **Tabelas → Visualizar diagrama**.

As tabelas são criadas pelas **migrations** (`apps/backend/src/migrations`), não pelo DBeaver: assim qualquer pessoa
recria o banco igualzinho com um comando. A tabela `SequelizeMeta` registra quais migrations já rodaram.

Detalhes de cada parte (endpoints, modelo de dados, telas) nos READMEs de cada app.

## Dados

A tabela TACO (NEPA/UNICAMP, 4ª edição) vem de [raulfdm/taco-api](https://github.com/raulfdm/taco-api) (MIT)
e é carregada no banco pelo seed `20260920200000-alimentos-taco.js`.
