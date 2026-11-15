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
cli/<comando>/       ENTRY de linha de comando (importRoll20, setPassword, storage): lê argumentos e chama controllers (storage fala direto com o service de mídia: dump, restore, migrate-local)
realtime/            ENTRY Socket.IO: auth do handshake, handlers por domínio em handlers/<dominio>/
core/controllers/    borda do domínio: valida (Zod do shared), chama models por interface, devolve envelope
core/models/         acesso a dados (Prisma) + mapeamento linha ↔ DTO (*.utils.ts)
core/services/       infra: database (Prisma), auth (argon2/JWT), env (Zod), media (storage S3 local, SeaweedFS: mediaStorage + characterImages + arenaImages, servido em /media), roll20 (conversão pura do export)
middlewares/         requireAuth (sessão + papel lidos do banco), rateLimit (login e API), errorHandler
```

Fluxo: `route → controller → model → services/database`. Routes e handlers nunca tocam Prisma.

Rotas HTTP atuais:

| Rota                                                                                                | Quem                                                                                                                                                                | Controller                                                                             |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `POST /auth/login`                                                                                  | todos (com limite de tentativas)                                                                                                                                    | `auth.login`                                                                           |
| `POST /auth/quick-login`                                                                            | só com `DEV_QUICK_LOGIN=true` fora de produção e da própria máquina (entra como a conta de seed do papel pedido, sem senha)                                         | `auth.quickLogin`                                                                      |
| `GET /auth/me` · `POST /auth/logout`                                                                | logado                                                                                                                                                              | sessão do `requireAuth` · `auth.logout` (revoga todas as sessões)                      |
| `PUT /auth/password`                                                                                | logado; corpo `{ currentPassword, newPassword }` (mínimo 10, diferente da atual), 5 falhas por conta a cada 15 min                                                  | `auth.changePassword` (revoga as outras sessões e sockets e renova o cookie desta aba) |
| `GET /characters` · `GET /characters/:id`                                                           | Mestre: todas · Jogador: as liberadas para a conta (`character_access`)                                                                                             | `character.listCharacters` · `getCharacter`                                            |
| `PUT /characters/:id/sheet`                                                                         | com acesso ou Mestre; corpo `{ sheet, baseUpdatedAt }` (409 se outro salvou antes); jogador não muda classe, nível nem máximos nem passa do máximo                  | `character.updateSheet`                                                                |
| `POST /characters` · `PATCH /characters/:id` · `DELETE /characters/:id`                             | só Mestre (criar em branco numa pasta, renomear, excluir)                                                                                                           | `character.createCharacter` · `renameCharacter` · `deleteCharacter`                    |
| `PUT /characters/:id/access`                                                                        | só Mestre; corpo `{ accountIds }` (só contas `PLAYER`)                                                                                                              | `character.setAccess`                                                                  |
| `PUT /characters/:id/features`                                                                      | só Mestre; corpo `{ features }` (chaves de `SPECIAL_FEATURES`, sem repetir)                                                                                         | `character.setFeatures`                                                                |
| `PUT /characters/:id/images/:kind` · `DELETE /characters/:id/images/:kind`                          | só Mestre; `kind` = `avatar` ou `art`; multipart com um campo `file` (até 8 MB, PNG/JPEG/WEBP/GIF pela assinatura)                                                  | `character.setImage` · `removeImage`                                                   |
| `GET /folders` · `POST /folders` · `PATCH /folders/:id` · `DELETE /folders/:id`                     | só Mestre (excluir sobe o conteúdo para a pasta-pai)                                                                                                                | `library.listFolders` · `createFolder` · `renameFolder` · `deleteFolder`               |
| `POST /library/move`                                                                                | só Mestre; corpo `{ kind, id, parentId, index }` (recusa pasta dentro de si mesma)                                                                                  | `library.moveItem`                                                                     |
| `GET /accounts` · `POST /accounts`                                                                  | só Mestre; criar devolve a senha uma única vez                                                                                                                      | `account.listAccounts` · `createAccount`                                               |
| `POST /characters/:id/level-up`                                                                     | só Mestre                                                                                                                                                           | `roll.levelUp`                                                                         |
| `GET /arena` (`?sceneId=` só Mestre)                                                                | logado; jogador: cena ativa sem tokens ocultos, mais `controllableCharacterIds`                                                                                     | `arena.getView`                                                                        |
| `GET /arena/scenes` · `POST /arena/scenes` · `PATCH /arena/scenes/:id` · `DELETE /arena/scenes/:id` | só Mestre                                                                                                                                                           | `arena.listScenes` · `createScene` · `renameScene` · `deleteScene`                     |
| `PUT /arena/scenes/:id/map`                                                                         | só Mestre; multipart `file` (até 25 MB, PNG/JPEG/WEBP/GIF pela assinatura)                                                                                          | `arena.setSceneMap`                                                                    |
| `PUT /arena/active`                                                                                 | só Mestre; corpo `{ sceneId }` (`null` tira a cena do ar)                                                                                                           | `arena.setActiveScene`                                                                 |
| `POST /arena/scenes/:id/tokens` · `PATCH /arena/tokens/:id` · `DELETE /arena/tokens/:id`            | só Mestre; criar com `characterId` (ficha) ou `name` (NPC); editar `size`, `hidden` e `name` (só NPC)                                                               | `arena.createToken` · `updateToken` · `deleteToken`                                    |
| `PATCH /arena/tokens` · `DELETE /arena/tokens`                                                      | só Mestre; lote de até 100: `{ updates: [{ id, size?, hidden?, name? }] }` (nome só em NPC) e `{ ids }`; cada token alterado ou removido vai para a audiência certa | `arena.updateTokens` · `deleteTokens`                                                  |
| `PUT /arena/tokens/:id/image`                                                                       | só Mestre; só NPC; multipart `file` (até 8 MB)                                                                                                                      | `arena.setTokenImage`                                                                  |
| `GET /media/*`                                                                                      | público (URLs com UUID; só chaves no formato da API)                                                                                                                | stream do storage (`routes/media`)                                                     |
| `GET /health`                                                                                       | público                                                                                                                                                             |                                                                                        |

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

Tags especiais: módulo `modules/features` é o registro (`FEATURE_SHEET_SLOTS`) da UI de cada tag na ficha (`FeatureSlots` por slot e `FeatureBadges`); a `SheetPage` só monta os slots. A tag Marcado vive em `modules/marked` (`markedSlice`, services de socket `markedRequests`, `MarkedProvider` no layout `(table)` que escuta os eventos `marked:*` e monta o `MarkedProposalModal` global, `MarkedSoulPanel`, `MarkedSharedTrait`, `MarkedBackdrop`). No servidor, `core/controllers/marked` guarda o chamado pendente em memória e o traço ativo em `marked_shares`; é montado em `realtime.ts` com a presença (`isCharacterAttended`) e os handlers ficam em `realtime/handlers/marked`.

Imagens: o Mestre envia **avatar** (rosto, retratos e futuro token da Arena) e **arte** (corpo inteiro) pelo `NameDialog` de criar ficha e pelo organism `CharacterImagesDialog` (`modules/library`, aberto pelo menu da ficha na biblioteca e pelo botão "Imagens" do cabeçalho da ficha). Cada envio gera uma chave nova (`characters/<id>/<kind>-<uuid>.<ext>`); a antiga é apagada e a ficha excluída leva junto o prefixo dela. A gravação da chave não mexe no `updatedAt` da ficha (sem conflito no autosave); a mudança chega aos outros pelo evento `character:images`, aplicado por `applyLibraryImages` e `applySheetImages`.

Janelas (popout): `core/services/windows` (`openPopout({ kind, id })`, registro `POPOUT_ROUTES`) abre uma tela numa janela própria do navegador, nomeada por item (abrir de novo foca a mesma janela; com popup bloqueado cai para nova aba). Hoje só a ficha: rota `(table)/janela/ficha/[characterId]` com `SheetPage variant="window"` (sem "Voltar para a mesa" nem o botão de janela; `SheetSkeleton` e `RouteSkeleton` seguem a variante). Botão `PopoutButton` (`modules/shell/components`) na barra de status da ficha e em cada linha da biblioteca. Cada janela tem socket e `CLIENT_ID` próprios, então edições aparecem nas outras pelo `character:updated`. Preparação da Arena: novos tipos de janela entram em `POPOUT_ROUTES`; painéis flutuantes **dentro** da página da Arena vão exigir o `sheetSlice` indexado por id (hoje guarda uma ficha por contexto JS).

Perfil: módulo `modules/profile` (organism `ProfileDialog`, aberto pelo botão "Perfil" do cabeçalho da `/mesa`: conta, troca de senha com o service `changePassword` e modo performance). Modo performance: preferência por aparelho no cookie `magista-perf` (`core/services/performance`, `writePerfMode`), lida no `app/layout.tsx` para pôr `data-perf` no `<html>` já no HTML do servidor; o CSS do modo leve está em `core/assets/styles/performance.css` (variante Tailwind `lite:`) e a lógica JS usa `usePrefersReducedMotion`/`prefersReducedMotion` (`shared/hooks`), que somam o modo escolhido ao `prefers-reduced-motion` do sistema.

Biblioteca de fichas: módulo `modules/library` (organism `CharacterLibrary` na `/mesa`, `LibraryTree` com dnd-kit para o Mestre, lista plana para o jogador e para a busca; `librarySlice` com dados, busca e pastas expandidas, salvas por visitante no `localStorage`). Movimentos são otimistas (`applyMove`, mesma regra do servidor) e desfeitos se a API recusar. Ficha: o `sheetSlice` guarda qual ficha foi pedida (`requestedId`) e ignora respostas de outra; a `SheetPage` só mostra a ficha (ou o erro) do id da URL, então trocar de ficha vai direto ao skeleton, sem mostrar a anterior. Posição e pasta das fichas são gravadas por SQL direto, sem mexer no `updatedAt` usado na concorrência do autosave. Listas da ficha usam o organism genérico `shared/components/organisms/SortableList`.

Arena: estudo e plano em `docs/ARENA.md`. No servidor, `core/controllers/arena` (cenas, cena ativa no singleton `arena_state`, tokens de ficha e de NPC, movimento) com models `arenaScene` e `arenaToken`; o controller devolve a audiência (`table` ou `gm`) e as rotas e `realtime/handlers/arena` chamam os broadcasters de `realtime.ts`. Regras puras em `packages/shared/src/game/arena` (`canControlToken`, `clampToMap`) e contratos em `schemas/arena`. Renomear, trocar imagens, mudar acesso ou excluir uma ficha manda `arena:scene` com `sceneId: null` (`broadcastArenaRefresh`). Na web, rota `(table)/arena` com a `ArenaPage` de `modules/arena`: `arenaSlice` (visão carregada, seleção e prévias de arraste de outras abas), services `arenaRequests` (`fetchArena`, `moveArenaToken` com ack, `emitArenaDrag` volátil) e o renderer PixiJS em `services/arenaRenderer` (classe imperativa: mapa, câmera, tokens, arraste; desenha só quando algo muda), carregado por `import()` dinâmico no organism `ArenaStage`, então o `pixi.js` só entra no bundle da Arena (fora dele, só `import type`). O hook da página ouve `arena:*` no socket da aba, refaz o fetch em `arena:scene` e ao reconectar, move com otimismo e recarrega a cena se o servidor recusar.

Na web existe um único socket por aba, criado por `modules/table/providers/TableSocketProvider` (layout `(table)`) e lido com `useTableSocket()`.

Zustand 5 com slices: cada feature tem `store/<x>Slice/` (`XState`, `XActions`, `defaultXState`, `createXSlice`). `modules/shell/store/appSlice` combina todos em `createAppStore()` e expõe `useApp(selector)` via context (store criado uma vez por montagem, nada de singleton global). Dados assíncronos ficam como `{ status: LoadStatus, data }`.

## Tempo real

- Socket.IO autenticado pelo mesmo cookie de sessão (`realtime/realtime.auth.ts`).
- Eventos tipados em `packages/shared/src/contracts/socket.events.ts` (`ServerToClientEvents`, `ClientToServerEvents`, `SocketData`). Todo evento novo nasce ali.
- Salas: `table:main` (mesa), `table:gm` (Mestre), `character:<id>` (sockets de todas as contas com acesso à ficha; entram ao conectar e são sincronizados por `syncCharacterAccess` quando o acesso muda ou a ficha é excluída) e `account:<id>` (para derrubar sockets no logout e avisar a conta).
- Handshake só aceito da origem `WEB_ORIGIN`; cada socket tem limite de rolagens (6 a cada 5s).
- Eventos atuais: `presence:update`, `roll:history` (últimas 50 rolagens, em memória, enviadas ao conectar), `character:updated` (ficha salva, com `origin` = id da aba que salvou, enviado no header `x-magista-client`), `roll:request` (cliente pede com ack), `sheet:ping` (cliente mostra um traço ou item da ficha à mesa, com ack; mesmo limite das rolagens, entra no histórico e sai na hora, sem animação), `roll:result` (para a mesa toda) e `library:changed` (sem payload; a biblioteca mudou, o cliente refaz o fetch: vai para `table:gm` e para as contas afetadas) e `character:images` (`{ id, avatarUrl, artUrl }` para `table:gm` e `character:<id>` quando o Mestre troca uma imagem), `character:features` (`{ id, features }`, mesmo destino, quando o Mestre muda as tags) os da Arena: `arena:drag` (cliente, sem ack, prévia de arraste repassada sem gravar) e `arena:move` (cliente, com ack, grava), ambos em lote `{ moves }` (até 50 tokens; a autorização é feita de uma vez por mensagem e o ack traz os tokens gravados e os recusados), `arena:dragging`, `arena:token`, `arena:token-removed` e `arena:scene` (servidor; `{ sceneId }`, o cliente refaz o `GET /arena`, `null` = qualquer cena); token visível da cena ativa vai para `table:main` e o resto só para `table:gm` (ocultar um token manda `arena:token-removed` aos jogadores com `except(table:gm)`); e os da Marca: `marked:propose`, `marked:answer`, `marked:cancel`, `marked:stop` (cliente, com ack e o mesmo limite das rolagens), `marked:proposal`, `marked:resolved` e `marked:share` (servidor, para `character:<id>` de cada Marcado e `table:gm`; `marked:share` também vai a cada socket ao conectar, se ele vê algum Marcado).
- Rolagens acontecem no servidor a partir da ficha salva (`buildRollSpec` + `rollSpecRows` do shared, que maximiza o dano no crítico); o cliente só diz o que rolar. Pings usam `buildPingSpec` e viram um cartão do feed sem linhas de dados (`kind` `trait` ou `item`). A web salva pendências (`flush`) antes de rolar.
- Quem rola recebe o resultado na hora pelo ack (para tocar a animação `DiceRollOverlay`); a mesa toda (inclusive quem rolou) só recebe `roll:result` depois de `ROLL_REVEAL_DELAY_MS` (fases rolling + adding de `ROLL_PHASES_MS`, no shared), para ninguém ver o resultado antes da animação.
- Handlers em `realtime/handlers/<dominio>/` chamam controllers, nunca models.

## Testes

- **Unitários (Vitest)**: arquivo `X.test.ts` ao lado da unidade em `packages/shared`, `apps/api` e `apps/web` (funções puras, controllers com dependências falsas, slices do store).
- **E2E (Playwright + axe)**: workspace `e2e/`, um spec por fluxo de funcionalidade (`auth`, `sheet`, `sheet-reorder`, `library`, `images`, `window`, `modals`, `rolls`, `ping`, `profile`, `levelup`, `marked`, `arena`, `a11y`; o Chromium do e2e roda com WebGL por SwiftShader para a Arena); nada de medir layout ou skeleton no e2e (isso é do `design-reviewer`). O `global-setup` reseta a ficha do personagem de teste do seed via API. Rolagens determinísticas no e2e: interceptar o WebSocket (`routeWebSocket`) em vez de depender da sorte. `holdApi` (`e2e/support/hold.ts`) segura requisições quando um teste precisa de um estado intermediário (e é usado pelo `design-reviewer` para ver skeletons).

## Definition of Done

- Pasta por unidade, acesso só pelo `index`.
- View sem estado, efeito ou handler inline com lógica.
- Tipos em `.types`, valores fixos em `.constants`.
- Imports com alias `@/` e por barrel; relativo só dentro da própria pasta.
- Controller valida com schema do shared, chama model pela interface, devolve envelope com erro do catálogo.
- Entry (rota, handler) fino.
- Regra de dependência respeitada.
- Todo carregamento da API com skeleton fiel ao componente (`docs/RULES.md`), validado pelo `design-reviewer`.
- `npm run lint`, `npm run typecheck`, `npm test` verdes (e `npm run test:e2e` quando o fluxo de usuário mudou).

## Anti-padrões

Pastas técnicas globais (`utils/` solto, `helpers/`), store singleton global, view ou route acessando persistência, tipos escritos separados da validação, lógica de regra do jogo duplicada entre web e api.
