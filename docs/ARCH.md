# Arquitetura

Adaptada de [niloodev/vee](https://github.com/niloodev/vee) (`docs/ARCH.md`): MVC + Atomic Design, independente de stack. O vee não tem backend de rede; aqui o mesmo MVC vive em `apps/api`, e a web consome a API.

## Camadas e regra de dependência

Dependências apontam sempre para baixo. Nunca importe de uma camada acima.

**Web (`apps/web/src`)**

```
app/                 ENTRY: rotas Next finas (page.tsx só renderiza a page do módulo)
modules/<feature>/   FEATURE: fatia vertical (components, hooks, services, store, providers)
core/                INFRA da UI: services (http, socket), providers globais, estilos/tokens
shared/              FOLHA: componentes atômicos reutilizáveis e tipos genéricos (não importa modules)
```

- `core/providers/providers.tsx` é o único arquivo de `core` que pode importar `modules`.
- Um módulo pode importar outro módulo apenas pelos barrels públicos (ex.: `@/modules/shell/store`).

**API (`apps/api/src`)**

```
routes/<recurso>/    ENTRY HTTP: chama o controller e traduz o envelope em status (mapa ERROR_STATUS em *.constants)
realtime/            ENTRY Socket.IO: auth do handshake, handlers por domínio em handlers/<dominio>/
core/controllers/    borda do domínio: valida (Zod do shared), chama models por interface, devolve envelope
core/models/         acesso a dados (Prisma) + mapeamento linha ↔ DTO (*.utils.ts)
core/services/       infra: database (Prisma), auth (argon2/JWT), env (Zod)
middlewares/         requireAuth, errorHandler
```

Fluxo: `route → controller → model → services/database`. Routes e handlers nunca tocam Prisma.

**Shared (`packages/shared/src`)**: `schemas/<entidade>/` (Zod é a fonte da verdade; tipos via `z.infer`) e `contracts/` (envelope `ControllerResult`, eventos de socket tipados). Regras puras do jogo entram aqui (ex.: modificador, proficiência) para rodar igual no front e no back.

## Envelope e erros

```ts
type ControllerResult<T, E extends string> = { message: string; payload: T } | { error: E };
```

- Cada controller tem `<x>.errors.ts` com o catálogo (mensagens em PT, exibíveis ao usuário) e `type XError`.
- Teste de falha: `isErrorResult(result)` (de `@magista/shared`).
- A API responde sempre nesse formato; a web (`apiRequest`) devolve o mesmo envelope.
- Services de feature na web retornam `{ ok: true } | { ok: false; error }` e atualizam o store.

## Anatomia de unidade (componente, hook, service, slice, model, controller)

Toda unidade é uma pasta e só é acessada pelo seu `index.ts`.

| Arquivo          | Papel                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `X.tsx`          | View: só marcação; desestrutura o retorno do hook. `export function X`, nunca default (exceto arquivos de rota do Next) |
| `X.hook.ts`      | Lógica: um `useX()` que retorna dados, flags e handlers                                                                 |
| `X.types.ts`     | `XProps`, `XHookProps`, tipos locais                                                                                    |
| `X.constants.ts` | Valores fixos: mapas de classes por variante, textos, tempos, polígonos                                                 |
| `X.utils.ts`     | Funções puras auxiliares                                                                                                |
| `X.context.tsx`  | Context + provider + accessor com guarda (stores)                                                                       |
| `X.test.ts`      | Testes (Vitest) ao lado da unidade                                                                                      |
| `subcomponents/` | Filhos usados só por este pai, mesma anatomia, com barrel próprio                                                       |
| `index.ts`       | API pública: `export * from "./X"; export type ...`                                                                     |

Nomes: componentes/pages/providers em `PascalCase/`; hooks, services e slices em `camelCase/`; arquivos de domínio em minúsculo (`account.ts`, `account.types.ts`). Interfaces de domínio com prefixo `I` (`IAccount`, `IAccountModels`, `IAuthController`), constantes em `UPPER_SNAKE`, catálogos `xErrors`, slices `createXSlice` e `defaultXState`.

## Atomic Design (web)

- `atoms`: burros, guiados por props (Button, Input, Icon, Text, Divider).
- `molecules`: composições pequenas, podem ter hook (FormField, PasswordField, Panel).
- `organisms`: regiões inteiras de tela (LoginPanel, LoginBackground, PresencePanel, SessionGate).
- `pages`: compõem organisms, providers e estado; chamadas pelo `app/`.
- UI genérica vai em `shared/components/<nível>`; UI de uma feature em `modules/<f>/components/<nível>`. Cada nível tem barrel, mesmo vazio.
- O Figma (página 🧩 Componentes) já está organizado nesses níveis; ver `docs/DESIGN.md` para o mapa nó → componente.

## Estado (web)

Zustand 5 com slices: cada feature tem `store/<x>Slice/` (`XState`, `XActions`, `defaultXState`, `createXSlice`). `modules/shell/store/appSlice` combina todos em `createAppStore()` e expõe `useApp(selector)` via context (store criado uma vez por montagem, nada de singleton global). Dados assíncronos ficam como `{ status: LoadStatus, data }`.

## Tempo real

- Socket.IO autenticado pelo mesmo cookie de sessão (`realtime/realtime.auth.ts`).
- Eventos tipados em `packages/shared/src/contracts/socket.events.ts` (`ServerToClientEvents`, `ClientToServerEvents`, `SocketData`). Todo evento novo nasce ali.
- Salas: `table:main` (mesa) e `account:<id>` (para derrubar sockets no logout).
- Handlers em `realtime/handlers/<dominio>/` chamam controllers, nunca models.

## Definition of Done

- Pasta por unidade, acesso só pelo `index`.
- View sem estado, efeito ou handler inline com lógica.
- Tipos em `.types`, valores fixos em `.constants`.
- Imports com alias `@/` e por barrel; relativo só dentro da própria pasta.
- Controller valida com schema do shared, chama model pela interface, devolve envelope com erro do catálogo.
- Entry (rota, handler) fino.
- Regra de dependência respeitada.
- `npm run lint`, `npm run typecheck`, `npm test` verdes.

## Anti-padrões

Pastas técnicas globais (`utils/` solto, `helpers/`), store singleton global, view ou route acessando persistência, tipos escritos separados da validação, lógica de regra do jogo duplicada entre web e api.
