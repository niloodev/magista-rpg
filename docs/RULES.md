# Regras de código

- Sem comentários no código. Exceção: JSDoc/TSDoc em funções, hooks, classes e APIs públicas. Prefira nomes autoexplicativos.
- Nunca use travessão (—) em textos gerados (UI, docs, mensagens de commit). Use ponto, vírgula, parênteses ou listas.
- Idioma: identificadores e nomes de arquivo em inglês; textos de UI, mensagens de erro/sucesso e docs em português.
- TypeScript estrito, sem `any`. `import type` para tipos (lint obriga).
- Ordem de imports: pacotes externos, linha em branco, `@/` e `@magista/shared`, linha em branco, relativos.
- Formatação: Prettier (aspas duplas, ponto e vírgula, 2 espaços, largura 100). Rode `npm run format`.
- Segredos só em `.env` (gitignored); todo env novo entra no `.env.example` e no schema de `core/services/env` (api).
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`), em branch, nunca direto na `main`.
- Testes: Vitest ao lado da unidade (`X.test.ts`). Controllers e regras do jogo sempre com teste.
