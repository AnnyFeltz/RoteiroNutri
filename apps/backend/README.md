# RoteiroNutri — Backend

API em Node.js (Express) + PostgreSQL (Sequelize), estruturada em camadas:

```
src/
  config/        # config do sequelize-cli / conexão
  models/        # models Sequelize (Nutricionista, Paciente, ...)
  migrations/    # migrations do banco
  seeders/       # dados de teste (a criar conforme necessário)
  routes/        # define os endpoints
  controllers/   # recebe a request, valida (Zod) e chama o service
  services/      # regra de negócio
  middlewares/   # autenticação JWT, tratamento de erros
  utils/         # helpers (jwt, hash de senha, etc)
  sockets/       # eventos de Socket.io (notificações em tempo real)
  server.js      # entry point
```

## Como rodar

1. Instale as dependências (na raiz do monorepo, usando pnpm):
   ```bash
   pnpm install
   ```

2. Configure o `.env` (copie de `.env.example`) com os dados do seu Postgres local.

3. Crie o banco, rode as migrations e carregue a tabela TACO:
   ```bash
   cd apps/backend
   npm run db:create      # se o banco ainda não existir
   npm run db:setup       # migrations + 597 alimentos da TACO
   npm run db:seed:demo   # (opcional) nutricionista e pacientes de demonstração
   ```

4. Suba o servidor:
   ```bash
   pnpm dev:backend   # a partir da raiz do monorepo
   ```

A API sobe em `http://localhost:3001` (ou a porta definida em `PORT`), com todas as rotas prefixadas por `/api`.

### Dados de demonstração (`db:seed:demo`)

Senha de todos: `demo1234`

| Perfil | E-mail |
|--------|--------|
| Nutricionista (web) | `caroline@roteironutri.com` |
| Pacientes (app) | `ana@email.com`, `joao@email.com`, `mariana@email.com`, `lucas@email.com`, `beatriz@email.com` |

As datas são relativas ao dia em que o seed roda. Para remover: `npm run db:seed:undo:demo`.

## Modelo de dados

Segue o modelo relacional do TCC:

```
nutricionistas 1─N pacientes 1─N planos_alimentares 1─N refeicoes 1─N refeicao_alimentos 1─N substitutos
                      │                                    │                │                     │
                      ├─N consultas                        └─N adesoes      └──── alimentos (TACO) ┘
                      ├─N evolucao_peso
                      ├─N alteracoes_perfil   (notificações para o nutricionista)
                      └─N solicitacoes_senha  (pedido de nova senha do paciente)
```

Regras garantidas pelo banco: e-mail único, **um único plano ativo por paciente** (índice único parcial — RN07)
e **sem duas consultas no mesmo dia/horário** para o mesmo nutricionista (índice único — RN17).

## Endpoints

Todas as rotas validam o corpo com **Zod** (`packages/shared`) e retornam erros no formato
`{ "erro": "mensagem", "detalhes": [{ "campo": "email", "mensagem": "..." }] }`.

### Autenticação (`/api/auth`) — pública

| Método | Rota | Requisito |
|--------|------|-----------|
| POST | `/nutricionistas/registrar` | RF01 |
| POST | `/nutricionistas/login` | RF02 |
| POST | `/pacientes/login` | RF16 |
| POST | `/recuperar-senha` · `/redefinir-senha` | RF03 (link por e-mail) |
| POST | `/pacientes/solicitar-senha` | RN09 (pedido aprovado pelo nutricionista) |
| GET | `/me` | usuário logado |

### Web — somente nutricionista

| Método | Rota | Requisito |
|--------|------|-----------|
| GET/PUT | `/nutricionista/perfil` · PUT `/senha` · PUT `/preferencias` | — |
| GET | `/nutricionista/dashboard` | RF09 |
| GET | `/nutricionista/evolucao` | RF21 |
| GET/POST | `/pacientes` (cadastro gera a senha do app) | RF04, RF07, RN08 |
| GET/PUT | `/pacientes/:id` | RF05, RF08 |
| PATCH | `/pacientes/:id/desativar` · `/reativar` | RF06, RN04 |
| POST | `/pacientes/:id/nova-senha` | — |
| GET/POST | `/pacientes/:id/planos` (POST cria nova versão) | RF10, RF11, RF12, RN07 |
| POST/DELETE | `/pacientes/:id/evolucao` | RF21 |
| GET | `/planos` (painel global) · `/planos/:id` | RF14 |
| GET/POST/PUT/DELETE | `/consultas` · GET `/consultas/horarios-ocupados?data=` | RF22, RN16, RN17 |
| GET | `/notificacoes` · `/notificacoes/contagem` | — |
| POST | `/notificacoes/pedidos-senha/:id/aprovar` · `/negar` | RN09 |

### Mobile — somente paciente (`/api/app`)

| Método | Rota | Requisito |
|--------|------|-----------|
| GET/PUT | `/perfil` · POST `/senha/solicitar` (pede nova senha ao nutricionista) | RF17, RF24, RN09, RN18 |
| GET | `/plano?data=` (plano ativo + refeições consumidas no dia) · `/planos` | RF18 |
| PUT | `/refeicoes/:id/consumo` | RF20, RF25 |
| PUT | `/itens/:id/substituto` | RF19, RN13 |
| GET/POST | `/evolucao` | RF21 |
| GET | `/consultas` | RF23 |

### TACO — qualquer usuário logado

`GET /api/alimentos?busca=&categoria=&pagina=&limite=` · `/alimentos/categorias` · `/alimentos/estatisticas` · `/alimentos/:id` (RF13).
A busca ignora acentos ("feijao" encontra "Feijão").

## Tempo real (Socket.io)

O cliente conecta enviando o JWT em `auth.token` e entra na sala do próprio usuário. Eventos:
`notificacao` e `paciente:peso` (para o nutricionista), `plano:atualizado`, `consulta:atualizada` e
`conta:desativada` (para o paciente).

## E-mail

Sem `SMTP_HOST` no `.env`, os e-mails (senha do paciente, link de redefinição) são exibidos no console.
Com SMTP configurado, são enviados de verdade via nodemailer. Na web, a senha gerada também é exibida
uma única vez para o nutricionista repassar ao paciente.
