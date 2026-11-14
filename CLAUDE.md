# Magista RPG

Aplicação fullstack da mesa de RPG Magista: fichas dos jogadores, chat e rolagens em tempo real. Substitui a ficha customizada do Roll20 (dados serão importados depois, ver `docs/MIGRATION.md`).

Monorepo npm workspaces, Node 24 (`nvm use`):

- `apps/web`: Next 16 (App Router), React 19, Tailwind v4, Zustand 5, socket.io-client
- `apps/api`: Express 5, Socket.IO 4, Prisma 7 (Postgres), JWT em cookie httpOnly
- `packages/shared`: schemas Zod, regras do jogo, tipos e contratos (envelope, eventos de socket) usados pelos dois lados
- `e2e`: testes ponta a ponta com Playwright + axe (usa as contas do seed, nunca as fichas reais)

## Comandos (na raiz)

- `npm run db:up` sobe o Postgres (docker, porta 5434) · `npm run db:migrate` · `npm run db:seed`
- `npm run dev` sobe api (:3333) e web (:3000)
- `npm run lint` · `npm run typecheck` · `npm test` (unitários: shared, api, web) · `npm run test:e2e` (precisa de `npm run dev` e do seed) · `npm run format`
- `npm run import:roll20 -- "<pasta>" [--force]` importa exports do Roll20 · `npm run account:password -- "<login>" [senha]` define/gera senha
- Antes de concluir qualquer tarefa: lint + typecheck + test verdes; mudou fluxo de usuário, rode também `npm run test:e2e`.

## Revisão automática ao concluir uma demanda

Um hook `Stop` (`.claude/hooks/review-gate.sh`, registrado em `.claude/settings.json`) bloqueia o encerramento sempre que há mudanças de código ainda não marcadas como revisadas (só libera a continuação imediata após o bloqueio, para não entrar em loop; ao terminar de novo sem `--mark`, bloqueia outra vez). Nesse caso, lance **em paralelo** os agentes `security-reviewer` (auditoria de segurança, só leitura), `quality-reviewer` (lint, typecheck, unitários, e2e e revisão de código) e `design-reviewer` (abre as telas e valida acessibilidade visual, skeletons fiéis e a qualidade do design: atende à necessidade, segue o design system, está bonito), definidos em `.claude/agents/`, passando a eles o contexto da demanda, o pedido do usuário e os arquivos alterados. Corrija os achados confirmados, rode as verificações de novo e marque o estado como revisado com `.claude/hooks/review-gate.sh --mark`. O resumo final ao usuário traz o veredito de cada revisor. O estado revisado fica em `.claude/.review-state` (fora do git).

## Regras e contexto

@docs/ARCH.md
@docs/RULES.md
@docs/DOMAIN.md
@docs/DESIGN.md

Ler sob demanda: `docs/MIGRATION.md` (mapa Roll20 → schema) ao mexer na ficha ou em importação; `docs/SECURITY.md` ao mexer em auth, sessão, permissões, API pública ou socket.
