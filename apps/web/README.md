# RoteiroNutri — Web (nutricionista)

Painel web **exclusivo do nutricionista** (React + Vite, estilizado com CSS puro). O paciente usa o app mobile (`apps/mobile`).

```bash
cp .env.example .env      # VITE_API_URL=http://localhost:3001/api
pnpm dev:web              # a partir da raiz do monorepo
```

## Telas

| Tela | O que tem |
|------|-----------|
| Login, cadastro e recuperação de senha | Senhas com o botão de "olhinho" para mostrar/esconder; recuperação por link no e-mail |
| Dashboard | Pacientes ativos, consultas de hoje, planos ativos e taxa de adesão dos últimos 30 dias |
| Pacientes | Cadastro, anamnese, avaliação, evolução, consultas e planos de cada paciente |
| Editor de plano | Calculadora (Mifflin-St Jeor / Harris-Benedict), refeições, alimentos da TACO e substitutos; cada save gera uma nova versão |
| Planos alimentares | Painel com o plano ativo de cada paciente |
| Agenda | Calendário do mês e **próximas consultas agrupadas por data** (próximos 5 dias com consulta); clicar no dia abre as consultas dele |
| Alimentos (TACO) | Busca na tabela TACO (597 alimentos) |
| Evolução e relatórios | Gráficos de evolução e ficha do paciente em PDF |
| Notificações | Avisos em tempo real (Socket.io): paciente alterou o perfil, pediu nova senha, registrou peso |
| Configurações | Dados do nutricionista, **foto de perfil**, troca de senha e preferências |

## Estilo (CSS)

Os estilos ficam em `src/estilos/`, todos em CSS puro:

| Arquivo | Conteúdo |
|---------|----------|
| `base.css` | Variáveis de cor/fonte (paleta verde folha, terracota e areia), reset, tipografia e organização de página |
| `componentes.css` | Botões, campos, cards, selos, modal, abas, tabelas, calendário... |
| `layout.css` | Menu lateral, topo, telas de login e página inicial |
| `paginas.css` | Ajustes específicos de cada página (prontuário, ficha, editor de plano, TACO...) |

## Validação (Zod)

Os formulários validam os dados com os mesmos schemas Zod que a API usa (`packages/shared/schemas.js`),
pela função `validar()` em `src/lib/validacao.js`. Assim a mensagem de erro aparece no campo antes de
enviar, e a regra fica escrita num lugar só.
