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
cli/<comando>/       ENTRY de linha de comando (importRoll20, setPassword): lê argumentos e chama controllers
realtime/            ENTRY Socket.IO: auth do handshake, handlers por domínio em handlers/<dominio>/
core/controllers/    borda do domínio: valida (Zod do shared), chama models por interface, devolve envelope
core/models/         acesso a dados (Prisma) + mapeamento linha ↔ DTO (*.utils.ts)
core/services/       infra: database (Prisma), auth (argon2/JWT), env (Zod), media (arquivos em MEDIA_DIR, servidos em /media), roll20 (conversão pura do export)
middlewares/         requireAuth (sessão + papel lidos do banco), rateLimit (login e API), errorHandler
```

Fluxo: `route → controller → model → services/database`. Routes e handlers nunca tocam Prisma.

Rotas HTTP atuais:

| Rota                                                                            | Quem                                                                                                                                               | Controller                                                               |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `POST /auth/login`                                                              | todos (com limite de tentativas)                                                                                                                   | `auth.login`                                                             |
| `POST /auth/quick-login`                                                        | só com `DEV_QUICK_LOGIN=true` fora de produção e da própria máquina (entra como a conta de seed do papel pedido, sem senha)                        | `auth.quickLogin`                                                        |
| `GET /auth/me` · `POST /auth/logout`                                            | logado                                                                                                                                             | sessão do `requireAuth` · `auth.logout` (revoga todas as sessões)        |
| `GET /characters` · `GET /characters/:id`                                       | Mestre: todas · Jogador: as liberadas para a conta (`character_access`)                                                                            | `character.listCharacters` · `getCharacter`                              |
| `PUT /characters/:id/sheet`                                                     | com acesso ou Mestre; corpo `{ sheet, baseUpdatedAt }` (409 se outro salvou antes); jogador não muda classe, nível nem máximos nem passa do máximo | `character.updateSheet`                                                  |
| `POST /characters` · `PATCH /characters/:id` · `DELETE /characters/:id`         | só Mestre (criar em branco numa pasta, renomear, excluir)                                                                                          | `character.createCharacter` · `renameCharacter` · `deleteCharacter`      |
| `PUT /characters/:id/access`                                                    | só Mestre; corpo `{ accountIds }` (só contas `PLAYER`)                                                                                             | `character.setAccess`                                                    |
| `GET /folders` · `POST /folders` · `PATCH /folders/:id` · `DELETE /folders/:id` | só Mestre (excluir sobe o conteúdo para a pasta-pai)                                                                                               | `library.listFolders` · `createFolder` · `renameFolder` · `deleteFolder` |
| `POST /library/move`                                                            | só Mestre; corpo `{ kind, id, parentId, index }` (recusa pasta dentro de si mesma)                                                                 | `library.moveItem`                                                       |
| `GET /accounts` · `POST /accounts`                                              | só Mestre; criar devolve a senha uma única vez                                                                                                     | `account.listAccounts` · `createAccount`                                 |
| `POST /characters/:id/level-up`                                                 | só Mestre                                                                                                                                          | `roll.levelUp`                                                           |
| `GET /media/*`                                                                  | público (URLs com UUID)                                                                                                                            | arquivos estáticos                                                       |
| `GET /health`                                                                   | público                                                                                                                                            |                                                                          |

Sessão: JWT HS256 em cookie httpOnly com `{ sub, ver }`; `ver` é o `sessionVersion` da conta, incrementado no logout e na troca de senha, o que invalida todos os tokens emitidos. Detalhes em `docs/SECURITY.md`.

**Shared (`packages/shared/src`)**: `schemas/<entidade>/` (Zod é a fonte da verdade; tipos via `z.infer`) e `contracts/` (envelope `ControllerResult`, eventos de socket tipados). Regras puras do jogo entram aqui (ex.: modificador, proficiência) para rodar igual no front e no back.

## Envelope e erros

```ts
type ControllerResult<T, E extends string> = { message: string; payload: T } | { error: E };
```

- Cada controller tem `<x>.errors.ts` com o catálogo (mensagens em PT, exibíveis ao usuário) e `type XError`.
- Teste de falha: `isErrorResult(result)` (de `@magista/shared`).
- A API responde sempre nesse formato; a web (`apiRequest`) devolve o mesmo envelope.
- Services de feature na web: os de ação (login, rolagem) retornam `{ ok: true } | { ok: false; error }` e atualizam o store; os de dados (`fetchCharacter`, `saveSheet`, `levelUp`...) devolvem o envelope `ControllerResult` e quem atualiza o store é o hook da página.
- Salvamento da ficha: autosave com debounce, um salvamento por vez (`flush`), sempre enviando o `updatedAt` de base. Se o servidor tem versão mais nova (Mestre editou ou subiu o nível), o cliente aplica os campos do Mestre (`mergeGmOnlyFields`) sobre o rascunho local e tenta de novo uma vez. Atualizações remotas com edição pendente fazem o mesmo merge em vez de serem descartadas; na aba do Mestre o rascunho dele é mantido inteiro (só a versão de base é atualizada). Se o conflito se repetir, o salvamento falha com "tentar de novo" em vez de ficar preso. A reconciliação é `saveWithReconcile` (`SheetPage.utils.ts`).

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
- UI genérica vai em `shared/components/<nível>`; UI de uma feature em `modules/<f>/components/<nível>`. Cada nível usado tem barrel (não é preciso criar níveis vazios).
- O Figma (página 🧩 Componentes) já está organizado nesses níveis; ver `docs/DESIGN.md` para o mapa nó → componente.

## Estado (web)

Biblioteca de fichas: módulo `modules/library` (organism `CharacterLibrary` na `/mesa`, `LibraryTree` com dnd-kit para o Mestre, lista plana para o jogador e para a busca; `librarySlice` com dados, busca e pastas expandidas, salvas por visitante no `localStorage`). Movimentos são otimistas (`applyMove`, mesma regra do servidor) e desfeitos se a API recusar. Ficha: o `sheetSlice` guarda qual ficha foi pedida (`requestedId`) e ignora respostas de outra; a `SheetPage` só mostra a ficha (ou o erro) do id da URL, então trocar de ficha vai direto ao skeleton, sem mostrar a anterior. Posição e pasta das fichas são gravadas por SQL direto, sem mexer no `updatedAt` usado na concorrência do autosave. Listas da ficha usam o organism genérico `shared/components/organisms/SortableList`.

Na web existe um único socket por aba, criado por `modules/table/providers/TableSocketProvider` (layout `(table)`) e lido com `useTableSocket()`.

Zustand 5 com slices: cada feature tem `store/<x>Slice/` (`XState`, `XActions`, `defaultXState`, `createXSlice`). `modules/shell/store/appSlice` combina todos em `createAppStore()` e expõe `useApp(selector)` via context (store criado uma vez por montagem, nada de singleton global). Dados assíncronos ficam como `{ status: LoadStatus, data }`.

## Tempo real

- Socket.IO autenticado pelo mesmo cookie de sessão (`realtime/realtime.auth.ts`).
- Eventos tipados em `packages/shared/src/contracts/socket.events.ts` (`ServerToClientEvents`, `ClientToServerEvents`, `SocketData`). Todo evento novo nasce ali.
- Salas: `table:main` (mesa), `table:gm` (Mestre), `character:<id>` (sockets de todas as contas com acesso à ficha; entram ao conectar e são sincronizados por `syncCharacterAccess` quando o acesso muda ou a ficha é excluída) e `account:<id>` (para derrubar sockets no logout e avisar a conta).
- Handshake só aceito da origem `WEB_ORIGIN`; cada socket tem limite de rolagens (6 a cada 5s).
- Eventos atuais: `presence:update`, `roll:history` (últimas 50 rolagens, em memória, enviadas ao conectar), `character:updated` (ficha salva, com `origin` = id da aba que salvou, enviado no header `x-magista-client`), `roll:request` (cliente pede com ack), `roll:result` (para a mesa toda) e `library:changed` (sem payload; a biblioteca mudou, o cliente refaz o fetch: vai para `table:gm` e para as contas afetadas).
- Rolagens acontecem no servidor a partir da ficha salva (`buildRollSpec` + `rollDiceExpression` do shared); o cliente só diz o que rolar. A web salva pendências (`flush`) antes de rolar.
- Quem rola recebe o resultado na hora pelo ack (para tocar a animação `DiceRollOverlay`); a mesa toda (inclusive quem rolou) só recebe `roll:result` depois de `ROLL_REVEAL_DELAY_MS` (fases rolling + adding de `ROLL_PHASES_MS`, no shared), para ninguém ver o resultado antes da animação.
- Handlers em `realtime/handlers/<dominio>/` chamam controllers, nunca models.

## Testes

- **Unitários (Vitest)**: arquivo `X.test.ts` ao lado da unidade em `packages/shared`, `apps/api` e `apps/web` (funções puras, controllers com dependências falsas, slices do store).
- **E2E (Playwright + axe)**: workspace `e2e/`, um spec por fluxo (`auth`, `sheet`, `sheet-reorder`, `library`, `loading`, `modals`, `rolls`, `levelup`, `a11y`). O `global-setup` reseta a ficha do personagem de teste do seed via API. Rolagens determinísticas no e2e: interceptar o WebSocket (`routeWebSocket`) em vez de depender da sorte. Estados de carregamento: segurar as requisições com `holdApi` (`e2e/support/hold.ts`) e liberar depois.

## Definition of Done

- Pasta por unidade, acesso só pelo `index`.
- View sem estado, efeito ou handler inline com lógica.
- Tipos em `.types`, valores fixos em `.constants`.
- Imports com alias `@/` e por barrel; relativo só dentro da própria pasta.
- Controller valida com schema do shared, chama model pela interface, devolve envelope com erro do catálogo.
- Entry (rota, handler) fino.
- Regra de dependência respeitada.
- Todo carregamento da API com skeleton fiel ao componente (`docs/RULES.md`), coberto em `e2e/tests/loading.spec.ts`.
- `npm run lint`, `npm run typecheck`, `npm test` verdes (e `npm run test:e2e` quando o fluxo de usuário mudou).

## Anti-padrões

Pastas técnicas globais (`utils/` solto, `helpers/`), store singleton global, view ou route acessando persistência, tipos escritos separados da validação, lógica de regra do jogo duplicada entre web e api.
