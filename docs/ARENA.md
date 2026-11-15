# Arena: estudo de caso

A Arena é a parte do app que faz o papel do tabuleiro do Roll20: um mapa por cena, tokens dos personagens e de NPCs, troca de cena pelo Mestre e acesso às fichas e rolagens sem sair da tela. O objetivo é uma opção moderna, com VFX e SFX de qualidade, que continue leve em computadores antigos. Este documento registra a visão, as decisões, o desenho técnico da primeira versão e o backlog. Ele é atualizado conforme as fases entram, e o que for implementado passa a ser descrito também em `ARCH.md`, `DOMAIN.md`, `DESIGN.md` e `SECURITY.md`.

## Decisões

| Tema       | Decisão                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Movimento  | Jogador move os tokens das fichas liberadas para a conta. Mestre move qualquer token, cria, edita e remove.                    |
| Cenas      | Mestre escolhe a cena ativa; todos os jogadores veem a mesma. O Mestre pode abrir outra cena em prévia sem os jogadores verem. |
| Render     | PixiJS v8 (WebGL), importado dinamicamente só na rota da Arena.                                                                |
| Grid       | Fora da v1. Coordenadas livres em pixels do mapa original.                                                                     |
| Escopo v1  | Mapa, tokens, troca de cena, ficha em painel, feed e rolagens dentro da Arena, tokens de NPC sem ficha.                        |
| PCs fracos | Modo performance existente (`data-perf`, `prefers-reduced-motion`) ganha um perfil próprio no renderer.                        |

### Por que PixiJS

- Renderização 2D em WebGL (WebGPU opcional) com sprites em lote: centenas de tokens e partículas sem pesar o DOM.
- Filtros, máscaras e `ParticleContainer` dão os VFX sem escrever shader na mão, e cada efeito pode ser desligado no modo leve.
- Uso imperativo (sem `@pixi/react`): o React só entrega o estado e o renderer controla o próprio loop, o que permite renderizar sob demanda.
- Alternativa descartada: DOM/CSS com `transform`. Não tem dependência, mas VFX ficam limitados e o custo cresce com cada elemento animado.

## Modelo de dados

- `ArenaScene` (`arena_scenes`): `id`, `name`, `mapKey?`, `position`, timestamps.
- `ArenaToken` (`arena_tokens`): `id`, `sceneId` (cascade), `characterId?` (cascade; vazio é NPC), `name?` e `imageKey?` (só NPC), `x`, `y` (float, pixels do mapa original), `size` (diâmetro em pixels do mapa, padrão 140), `hidden` (só o Mestre vê), `position` (ordem de desenho), timestamps.
- `ArenaState` (`arena_state`): singleton (`singleton Boolean @unique`, mesmo padrão de `marked_shares`) com `activeSceneId?` (SetNull).
- Dimensões do mapa não são gravadas: o cliente lê do arquivo. Movimento grava por SQL direto (como a ordem da biblioteca).
- Imagem do token de ficha: avatar, com a arte como reserva (`portraitOf`). NPC tem imagem própria.
- Chaves no storage: `arena/maps/<sceneId>/map-<uuid>.<ext>` e `arena/tokens/<tokenId>/token-<uuid>.<ext>`, adicionadas à whitelist de `/media`. Mapas aceitam até 60 MB (PNG, JPEG, WEBP, GIF pela assinatura) e são regravados em WebP qualidade 90.

## Contratos (shared)

- `schemas/arena`: cena, token (DTO com `imageUrl` resolvido), visão da Arena `{ activeSceneId, scene, tokens }` e os inputs (criar e renomear cena, criar token por ficha ou nome, atualizar token, mover token). Constantes `ARENA_MAP_MAX_BYTES` e `ARENA_TOKEN_SIZES`.
- `game/arena`: regras puras `canControlToken` e `clampToMap`, iguais no front (habilitar arraste) e no back (decidir).
- Eventos de socket:
  - Cliente: `arena:drag` (volátil, sem ack e sem gravar; só repassa a prévia, com limite próprio de cerca de 30 por segundo) e `arena:move` (ack, grava a posição final).
  - Servidor: `arena:dragging` `{ tokenId, x, y, by }`, `arena:token` (criado ou alterado), `arena:token-removed` e `arena:scene` (cena ativa trocou ou a cena atual mudou; o cliente refaz o `GET /arena`).
  - Destino: token visível da cena ativa vai para `table:main`; token oculto ou de outra cena vai só para `table:gm`.

## API

Controller `core/controllers/arena`, models `arenaScene` e `arenaToken`, store de imagens da Arena no service de mídia.

| Rota                                                                                                | Quem                                                   |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `GET /arena` (`?sceneId=` só Mestre)                                                                | logado; jogador recebe a cena ativa sem tokens ocultos |
| `GET /arena/scenes` · `POST /arena/scenes` · `PATCH /arena/scenes/:id` · `DELETE /arena/scenes/:id` | só Mestre                                              |
| `PUT /arena/scenes/:id/map` (multipart `file`)                                                      | só Mestre                                              |
| `PUT /arena/active` `{ sceneId }`                                                                   | só Mestre                                              |
| `POST /arena/scenes/:id/tokens` · `PATCH /arena/tokens/:id` · `DELETE /arena/tokens/:id`            | só Mestre                                              |
| `PUT /arena/tokens/:id/image` (multipart `file`, NPC)                                               | só Mestre                                              |

- Movimento só pelo socket (`realtime/handlers/arena` chama `arenaController.move`): checa o acesso à ficha a cada movimento, exige que o jogador esteja na cena ativa e que o token não esteja oculto, e limita a posição ao mapa.
- Revogar o acesso tira o direito de mover na hora. Excluir a ficha remove os tokens dela e avisa a cena.

## Web

Rota `(table)/arena` com a `ArenaPage` de `modules/arena` (`arenaSlice`, `ArenaProvider` ouvindo `arena:*` no socket da aba, services de dados e de ação). Botão "Arena" no cabeçalho da `/mesa`.

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│ ← Mesa   Cena: Ruínas de Velkar  [Ao vivo]   ● conectado  ○○○  Perfil │  barra superior (glass, 56px)
├──┬───────────────────────────────────────────────────┬─────────────────┤
│✚ │                                                   │ Ficha│Rolagens│ │
│☠ │                 mapa (canvas Pixi)                │      Tokens     │  dock (400px, recolhível;
│▦ │                                                   │                 │  bottom sheet abaixo de lg)
│  │          (●) Aria     (●) Bram                    │  ficha do token │
│  │                  [card do token selecionado]      │  selecionado    │
├──┘ (●)(●)  − + Ajustar                               │                 │
└───────────────────────────────────────────────────────┴─────────────────┘
 ferramentas do Mestre à esquerda; meus tokens e zoom embaixo
```

- Ferramentas do Mestre: adicionar token de ficha (busca na biblioteca), adicionar NPC (nome e imagem com `ImageField`), gerenciar cenas (criar, renomear, trocar mapa, excluir com `ConfirmDialog`, tornar ativa). Seletor "Cenas" na barra com selo "Ao vivo" ou "Prévia".
- Dock com `Tabs`: Ficha (token selecionado), Rolagens (`RollFeed` com `state.table.rolls`) e Tokens (lista DOM acessível: selecionar, centralizar, mover pelas setas os tokens que a pessoa controla).
- Card do token selecionado: nome, Vida e Sanidade quando há ficha e acesso, "Abrir ficha", "Abrir em janela" (`openPopout`) e, para o Mestre, tamanho, ocultar e remover.

### Ficha no dock

A Arena não monta `SheetPage`, então o `sheetSlice` (uma ficha por contexto) fica livre para o dock. O corpo da `SheetPage` vira um organism `SheetView` com `variant="panel"` (coluna estreita, sem feed lateral nem barra de resumo fixa) reaproveitando o hook de carga, autosave e reconciliação. Rolar pelo dock usa a `DiceRollOverlay` em tela cheia. Várias fichas ao mesmo tempo continuam pela janela popout; indexar o `sheetSlice` por id fica para os painéis flutuantes.

### Renderer

- `modules/arena/services/arenaRenderer`: classe imperativa com `sync(scene, tokens, selection, previews)`; camadas `map`, `tokens`, `fx` e `ui`.
- Câmera: arrastar no vazio, botão do meio ou espaço para mover; roda e pinça para zoom limitado; "Ajustar mapa"; câmera lembrada por cena no `localStorage`.
- Token: avatar em círculo, anel rubi (meus), teal (outros), dourado (selecionado), tracejado e translúcido quando oculto, nome em Cinzel. Arraste emite a prévia e solta com `arena:move`; movimentos alheios chegam interpolados.
- Mapas maiores que `MAX_TEXTURE_SIZE` (4096 em placas antigas) são reduzidos com `createImageBitmap` e o sprite é escalado; coordenadas seguem no espaço original.
- Render sob demanda: o ticker para quando nada anima.
- Sem WebGL: estado amigável explicando o problema, nunca tela preta.

### VFX (v1)

Dark fantasy, sem os efeitos de luz vetados em `DESIGN.md` (raios, faíscas, shimmer, varredura):

- Troca de cena: fade pela névoa rubi.
- Token entrando: surge com um anel de runas que se expande.
- Soltar token: onda curta no chão.
- Seleção: anel respirando devagar.
- Partículas ambientes (brasas e poeira) opcionais.

### SFX

`core/services/audio` com WebAudio puro: carrega sob demanda, canais `ui` e `fx`, volume e mudo no Perfil (por aparelho), só toca depois da primeira interação. v1 deixa plugados: soltar token, trocar cena, token entrando. Os arquivos (licença CC0) são escolhidos junto com o Mestre.

### Modo performance

| Recurso              | Completo                   | Leve          |
| -------------------- | -------------------------- | ------------- |
| Resolução            | `min(devicePixelRatio, 2)` | 1             |
| Antialias            | ligado                     | desligado     |
| FPS máximo           | monitor                    | 30            |
| Partículas e filtros | ligados                    | desligados    |
| Transições           | animadas                   | instantâneas  |
| Blur dos painéis     | `backdrop-blur`            | sem (`lite:`) |

### Skeleton e acessibilidade

- `ArenaSkeleton` fiel: barra superior real, ferramentas do Mestre como `ButtonSkeleton`, dock com as abas reais e `RollFeed loading`, área do mapa escura com névoa. Cobre o fetch, o carregamento do Pixi e da textura. Papel pela dica de sessão `s`.
- Canvas com `role="img"` e `aria-label` dinâmico (cena e quantidade de tokens); toda ação existe também em DOM. Esc limpa a seleção; movimentos anunciados em `aria-live`.

## Fases

1. Estudo de caso (este documento). Concluída.
2. Backend: schema e migration, shared, models, controller com testes, rotas, handler de socket, chaves de mídia. Concluída (o e2e cria as próprias cenas pela API na fase 3, sem seed, para não sujar a lista de cenas do Mestre).
3. Arena base: rota, slice, renderer com câmera e tokens, movimento em tempo real com permissão, skeleton, botão na `/mesa`. Concluída (eventos ouvidos no hook da página, sem provider no layout; bandeja de tokens e teclado já entram aqui para o mapa ser usável sem mouse).
4. Mecânicas do Roll20, em entregas: 4A controles (seleção em grupo, câmera, aviso no celular) e 4B redimensionar e barra de seleção, concluídas; 4C painéis (Rolagens à esquerda com rolagem em suspense, barra direita com Fichas e Mapas com pastas, larguras ajustáveis, prévia do Mestre), concluída; 4D criar tokens pela barra (arrastar a ficha para o mapa, "Colocar no mapa" no menu da ficha e "Token avulso" para NPC), concluída; 4E fichas em janelas flutuantes (várias abertas, arrastar, redimensionar e encaixar como aba nos painéis laterais), concluída.
   4F. Tamanho do tabuleiro como no Roll20 (unidades de 70 px, sempre na proporção do mapa, tokens acompanham), mapas otimizados em WebP e importador das páginas do Roll20 com as pastas. Concluída.
5. Dock: `SheetView` em painel, Rolagens, Tokens e card do token.
6. Polimento: VFX, SFX, perfil de performance, revisão de design e acessibilidade.

Nota para a fase 3: cada prévia de arraste (`arena:drag`) refaz a autorização no banco (até 3 consultas, limitadas a 30 por segundo por conta). Se pesar, cachear a autorização por conta e token durante o arraste (renovada no `arena:move` e nas mudanças de acesso) ou juntar tudo numa consulta.

Cada fase fecha com lint, typecheck, unitários, e2e (`e2e/tests/arena.spec.ts`) e os três revisores.

## Backlog depois da v1

- Grid e régua de medição.
- Névoa de guerra e visão.
- Ping no mapa.
- Marcadores de status e barras de Vida no token.
- Ordem de iniciativa.
- Camadas (desenho, Mestre).
- Trilha sonora e ambiente por cena.
- VFX ligados às habilidades e ao crítico.
- Painéis flutuantes com o `sheetSlice` indexado por id.
- Pastas de cenas.
