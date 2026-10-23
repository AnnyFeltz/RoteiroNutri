# RoteiroNutri — Web (nutricionista)

Painel web **exclusivo do nutricionista** (React + Vite, estilizado com CSS puro). O paciente usa o app mobile (`apps/mobile`).

```bash
cp .env.example .env      # VITE_API_URL=http://localhost:3001/api
pnpm dev:web              # a partir da raiz do monorepo
```

Telas: dashboard, pacientes (cadastro, anamnese, avaliação, evolução, consultas), editor de planos com
calculadora (Mifflin-St Jeor / Harris-Benedict) e substitutos, painel de planos, agenda, tabela TACO,
evolução, relatórios/ficha em PDF, notificações e configurações.

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
