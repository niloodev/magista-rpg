# Magista RPG

Aplicação fullstack da mesa de RPG Magista: fichas dos jogadores, chat e rolagens em tempo real. Substitui a ficha customizada do Roll20 (dados serão importados depois, ver `docs/MIGRATION.md`).

Monorepo npm workspaces, Node 24 (`nvm use`):

- `apps/web`: Next 16 (App Router), React 19, Tailwind v4, Zustand 5, socket.io-client
- `apps/api`: Express 5, Socket.IO 4, Prisma 7 (Postgres), JWT em cookie httpOnly
- `packages/shared`: schemas Zod, tipos e contratos (envelope, eventos de socket) usados pelos dois lados

## Comandos (na raiz)

- `npm run db:up` sobe o Postgres (docker, porta 5434) · `npm run db:migrate` · `npm run db:seed`
- `npm run dev` sobe api (:3333) e web (:3000)
- `npm run lint` · `npm run typecheck` · `npm test` · `npm run format`
- Antes de concluir qualquer tarefa: lint + typecheck + test verdes.

## Regras e contexto

@docs/ARCH.md
@docs/RULES.md
@docs/DOMAIN.md
@docs/DESIGN.md

Ler sob demanda: `docs/MIGRATION.md` (mapa Roll20 → schema) ao mexer na ficha ou em importação.
