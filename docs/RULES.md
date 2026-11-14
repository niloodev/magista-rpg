# Regras de código

- Sem comentários no código. Exceção: JSDoc/TSDoc em funções, hooks, classes e APIs públicas. Prefira nomes autoexplicativos.
- Nunca use travessão (—) em textos gerados (UI, docs, mensagens de commit). Use ponto, vírgula, parênteses ou listas.
- Idioma: identificadores e nomes de arquivo em inglês; textos de UI, mensagens de erro/sucesso e docs em português.
- TypeScript estrito, sem `any`. `import type` para tipos (lint obriga).
- Ordem de imports: pacotes externos, linha em branco, `@/` e `@magista/shared`, linha em branco, relativos.
- Formatação: Prettier (aspas duplas, ponto e vírgula, 2 espaços, largura 100). Rode `npm run format`.
- Segredos só em `.env` (gitignored); todo env novo entra no `.env.example` e no schema de `core/services/env` (api).
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`), em branch, nunca direto na `main`.
- Testes: Vitest ao lado da unidade (`X.test.ts`). Controllers, regras do jogo e slices do store sempre com teste. Fluxo de usuário novo ou alterado ganha (ou atualiza) um spec em `e2e/tests`.
- Carregamento: toda feature que espera dado da API **deve** ter um skeleton visualmente **fiel** ao componente final (mesma moldura, bordas, alturas, tipografia e rótulos fixos; só variam as partes que dependem do dado). Nada de "Carregando..." solto, spinner ou tela vazia. Monte com `Skeleton` (`text` dentro da tipografia real, `glyphs` com texto de exemplo invisível), `ButtonSkeleton`, `StepperSkeleton` e `SkeletonRegion`, e cubra com um caso em `e2e/tests/loading.spec.ts` (segurando a API com `holdApi`). Detalhes em `docs/DESIGN.md`, seção "Carregamento (skeletons)".
- Segurança: toda rota nova declara quem pode usar (tabela em `docs/ARCH.md`) e checa no controller; nada de confiar no front para permissão.
