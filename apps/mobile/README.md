# RoteiroNutri — Mobile (paciente)

App **exclusivo do paciente** (Expo SDK 58 + Expo Router). O nutricionista usa o painel web (`apps/web`).

```bash
pnpm dev:mobile        # a partir da raiz (ou: cd apps/mobile && npx expo start)
```

Abra no **Expo Go** lendo o QR code. O app descobre sozinho o IP da máquina que roda o Expo e chama a
API em `http://<IP>:3001/api` — o celular e o computador precisam estar na mesma rede. Para apontar
para outro servidor, crie `apps/mobile/.env` com `EXPO_PUBLIC_API_URL=...` (veja `.env.example`).

Também roda no navegador (`w` no terminal do Expo), útil para testes.

## Telas

| Tela | Requisitos |
|------|------------|
| Login / esqueci a senha (pedido vai para o nutricionista aprovar) | RF16, RN08, RN09 |
| Início: kcal e macros do dia, próxima refeição, sequência, adesão semanal | RNF01, RF23 |
| Plano do dia e detalhe da refeição: marcar como consumida, trocar por substituto | RF18, RF19, RF20, RF25 |
| Evolução: registrar peso, gráficos de peso e adesão, composição corporal | RF21 |
| Perfil com foto (escolhida da galeria), editar dados pessoais (nutricionista é notificado), histórico de planos, pedido de nova senha (o nutricionista aprova) | RF17, RF24, RN09, RN18 |

O token de acesso fica no armazenamento seguro do aparelho (`expo-secure-store`). Quando o
nutricionista publica um novo plano, o app atualiza em tempo real (Socket.io).
