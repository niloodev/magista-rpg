@AGENTS.md

- Rotas em `src/app` são entry finos: só importam a page do módulo (`@/modules/<f>/components/pages`).
- Chamadas HTTP só via `@/core/services/http` (`apiRequest`), socket só via `@/core/services/socket`.
- Componentes com `"use client"` apenas quando têm hook, estado ou efeito.
