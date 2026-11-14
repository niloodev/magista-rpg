# Magista RPG

Fichas, chat e rolagens em tempo real da mesa Magista.

## Rodando localmente

Requisitos: Node 24 (`nvm use`), Docker.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env      # preencha JWT_SECRET e as senhas do seed
cp apps/web/.env.example apps/web/.env.local
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev                                  # web http://localhost:3000 · api http://localhost:3333
```

## Importar personagens do Roll20

Cada jogador numa subpasta com `character.json` (export do Roll20) e, opcionalmente, `avatar.*` e `token.*`:

```bash
npm run import:roll20 -- "/caminho/para/002 - Players"          # cria contas novas e mostra as senhas geradas
npm run import:roll20 -- "/caminho/para/002 - Players" --force  # sobrescreve fichas já importadas
npm run account:password -- "Kael Magnus"                         # gera uma nova senha
npm run account:password -- "Kael Magnus" minhaSenhaForte        # define a senha (mínimo 10 caracteres; prefira a gerada, que não fica no histórico do shell)
```

O login do jogador é o nome do personagem. Imagens ficam em `apps/api/storage/media` (fora do git).

## Variáveis de ambiente

API (`apps/api/.env`, validadas em `core/services/env`):

| Variável          | Padrão                  | Para quê                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`        | `development`           | `production` liga as travas de produção                                                                                                                                                                                                                                                                                                     |
| `PORT`            | `3333`                  | Porta da API                                                                                                                                                                                                                                                                                                                                |
| `WEB_ORIGIN`      | `http://localhost:3000` | Único site aceito no CORS e no WebSocket                                                                                                                                                                                                                                                                                                    |
| `DATABASE_URL`    |                         | Postgres                                                                                                                                                                                                                                                                                                                                    |
| `JWT_SECRET`      |                         | Mínimo 32 caracteres, aleatório                                                                                                                                                                                                                                                                                                             |
| `COOKIE_SECURE`   | `false`                 | Cookie só por HTTPS. **Obrigatório `true` em produção** (a API não sobe sem)                                                                                                                                                                                                                                                                |
| `MEDIA_DIR`       | `storage/media`         | Avatares e tokens                                                                                                                                                                                                                                                                                                                           |
| `TRUST_PROXY`     | `0`                     | Número exato de proxies na frente da API (para o limite de tentativas ver o IP real). Valor maior que o real permite forjar o IP e furar o limite                                                                                                                                                                                           |
| `DEV_FORCED_D20`  | vazio                   | Só fora de produção: força todo d20 neste valor (ex.: `20` para ver o crítico, `1` para a falha)                                                                                                                                                                                                                                            |
| `DEV_QUICK_LOGIN` | `false`                 | Só fora de produção: libera `POST /auth/quick-login`, que entra sem senha como `SEED_GM_LOGIN` ou `SEED_PLAYER_LOGIN` (use só nomes de contas de teste, nunca de contas reais), aceito apenas de chamadas da própria máquina. Na web, `NEXT_PUBLIC_DEV_QUICK_LOGIN=true` (`apps/web/.env.local`) mostra os botões de acesso rápido no login |
| `SEED_*`          |                         | Contas do seed (Mestre e personagem de teste); também usadas pelo e2e                                                                                                                                                                                                                                                                       |

Web (`apps/web/.env.local`): `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3333`).

## Testes

```bash
npm test                 # unitários (Vitest): shared, api e web
npm run test:e2e         # ponta a ponta (Playwright + axe), com npm run dev e o seed rodados
```

O e2e reseta a ficha do personagem de teste do seed (`SEED_PLAYER_LOGIN`) e nunca altera as fichas reais. Precisa de um Chromium: rode `npx playwright install chromium` uma vez, ou aponte para um já instalado com `E2E_CHROMIUM_PATH=/caminho/do/chrome`. Relatório em `e2e/playwright-report`.

Arquitetura, regras de código, domínio e segurança: [`CLAUDE.md`](CLAUDE.md) e [`docs/`](docs).
