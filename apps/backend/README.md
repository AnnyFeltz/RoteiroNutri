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

3. Crie o banco (se ainda não existir) e rode as migrations:
   ```bash
   cd apps/backend
   npx sequelize-cli db:migrate
   ```

4. Suba o servidor:
   ```bash
   pnpm dev:backend   # a partir da raiz do monorepo
   # ou
   npm run dev        # dentro de apps/backend
   ```

A API sobe em `http://localhost:3001` (ou a porta definida em `PORT`), com todas
as rotas prefixadas por `/api`.

## Endpoints implementados (módulo de Autenticação)

| Método | Rota                                   | Requisito | Descrição                                   |
|--------|-----------------------------------------|-----------|----------------------------------------------|
| POST   | `/api/auth/nutricionistas/registrar`    | RF01      | Cadastra um nutricionista                     |
| POST   | `/api/auth/nutricionistas/login`        | RF02      | Login do nutricionista → retorna JWT          |
| POST   | `/api/auth/pacientes/login`             | RF16      | Login do paciente → retorna JWT               |
| POST   | `/api/auth/recuperar-senha`             | RF03      | Solicita token de recuperação (por e-mail)    |
| POST   | `/api/auth/redefinir-senha`             | RF03      | Redefine a senha usando o token recebido      |

Todas as rotas validam o corpo da requisição com **Zod** (`packages/shared`) e
retornam erros no formato:
```json
{ "erro": "mensagem", "detalhes": [{ "campo": "email", "mensagem": "..." }] }
```

## Autenticação nas próximas rotas

Use o middleware `autenticar` (valida o JWT) e opcionalmente `autorizar('nutricionista')`
ou `autorizar('paciente')` para restringir por tipo de usuário:

```js
const { autenticar, autorizar } = require('../middlewares/authMiddleware');

router.get('/pacientes', autenticar, autorizar('nutricionista'), controller.listar);
```

`req.usuario` fica disponível com `{ id, tipo }` após o middleware `autenticar`.

## O que falta (próximos módulos)

- CRUD de Pacientes (RF04-RF07) — cadastro pelo nutricionista, com geração de senha provisória (RN08)
- Registro clínico / anamnese (RF08)
- Planos alimentares + refeições + substitutos + tabela TACO (RF10-RF15, RF19)
- Agenda / consultas (RF09, RF22-RF23)
- Evolução de peso / adesão (RF20-RF21, RF25)
- Envio real de e-mail para recuperação de senha (hoje só loga no console)
