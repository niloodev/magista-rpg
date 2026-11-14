# Design system

Estilo "Dark Fantasy Glassmorphism". Fontes da verdade:

- Figma `Magista - Design System`, fileKey `dMwecciEK6QoiZN3KpssrT` (páginas: Design System `0:1`, Login `1:73` frame `11:2`, Componentes `29:2`).
- Comportamento e animações: protótipo em `/home/ezeq/froggie-projects/magista/project/src/app/components` (`LoginScreen.tsx`, `DesignSystemScreen.tsx`).

## Tokens (`apps/web/src/core/assets/styles`)

- `tokens/colors.css` e `tokens/effects.css` definem `--magista-*`; `theme.css` mapeia para Tailwind via `@theme inline` (`bg-primary`, `text-label`, `bg-void-900`, `font-serif`...).
- Paleta: Ruby 900 `#5c0b25`, 600 `#c41652`, base `#e42a63`, 400 `#f07a9b` · Teal 900 `#134e4a`, 600 `#0d9488`, base `#14b8a6`, 400 `#2dd4bf` · Void 1000 `#000`, base `#060203`, 800 `#12040a`, 700 `#1a0610`.
- Semânticos: primary `#da2054`, destructive `#d4183d`, muted-foreground `#b08898`, border `rgba(222,34,90,0.22)`.
- Fontes: Cinzel (`font-serif`) para títulos, labels, valores e botões; Raleway (`font-sans`) para corpo e UI. Carregadas por `next/font` em `app/layout.tsx`.
- Raio quase sempre 0; cantos são cortes diagonais via `clip-path`.

## Receitas

- **Glass**: `bg-black/40 border border-white/5 backdrop-blur-sm`, hover `border-primary/30` (500ms). Painel do login: `--magista-clip-panel` + colchetes de canto 2px (`Panel brackets`).
- **Primary container**: `bg-black/60 border-primary/30` + barra esquerda 4px.
- **Inner**: `bg-black/40 + blur, border-border/30`, hover `primary/30` (300ms).
- **Input (`.magista-input`)**: hover borda 0.3; focus borda 0.6 + glow `--magista-glow-input-focus`.
- **Botões (`.magista-btn`)**: cortes `--cut` 8/12/16px para SM/MD/LG (32/44/56px), brilho de vidro (`::before`) varre em 700ms no hover. Variante `shape="slant"` é o paralelogramo do login (hover: espaçamento 0.30em → 0.36em e glow 36px; active: `scale(.97) translateY(2px)`). Outros: hover lift -2px + glow, active `scale(.95)`.
- **Card interativo**: glow interno 5%, hover borda 60% + glow interno 10% + externo 15%, lift -4px, dado gira 12°.

## Acessibilidade e legibilidade (obrigatório)

Validado com axe-core (WCAG 2.1 AA + best practices): 0 violações no login e em todas as abas da ficha. Toda tela nova segue:

- **Texto**: mínimo 12px (rótulos), 15px para corpo, 16px em campos (evita zoom no iOS). Nada de 6 a 10px.
- **Cor de texto pequeno**: `text-accent-text` (#f58aa8) em vez de `text-primary` (#da2054 dá 4,3:1, reprova AA em texto pequeno). `text-muted-strong` para texto secundário. `primary` fica para bordas, preenchimentos e títulos grandes.
- **Alvos de toque**: mínimo 32px (botões de +/-, checkbox com área clicável do rótulo), 44px para linhas clicáveis e ações principais.
- **Barras de rolagem**: finas, trilho escuro e polegar rubi (`scrollbar-color` global em `base.css`).
- **Foco**: `:focus-visible` global com contorno de 2px `--magista-ruby-400`. Não remover outline.
- **Semântica**: um `h1` por página; `SectionHeader` renderiza `h2`, itens de lista `h3`. Abas com `Tabs`/`TabPanel` (ARIA tablist, setas, Home/End). Barras de recurso com `role="meter"`. Resultados de rolagem em `aria-live`. Botões só com ícone sempre com `aria-label` ou texto `sr-only`.
- **Criar, editar e excluir sempre via modal**: `Modal` (dialog nativo com `showModal()`: prende o foco, Esc fecha, devolve o foco a quem abriu; foca o primeiro campo ou `[data-autofocus]`). Formulários usam `EditorModal` + `useEntryEditor` (`modules/sheet/hooks`): editam um rascunho, só aplicam ao salvar, validam (erro no campo com `role="alert"` e foco no primeiro inválido) e Enter salva. Exclusão sempre confirmada por `ConfirmDialog` (foco inicial em Cancelar). Nunca usar `alert`/`confirm` do navegador. Valores rápidos (atributos, Vida, Sanidade, Aberturas, carga máxima) continuam editáveis direto na ficha.
- **Movimento**: tudo respeita `prefers-reduced-motion`.
- **Descrições longas**: `ExpandableText` (RichText com `**negrito**`, parágrafos e "Mostrar mais").

## Crítico (20 natural)

Tema dourado sólido (`--magista-gold-*`, `text-gold-*`), **sem efeitos de iluminação** (nada de raios, faíscas, brilho pulsante, shimmer ou varredura de luz; foram removidos por ficarem com aspecto bugado). Na animação: hexágono com borda dourada, total em `text-gold-300` com entrada `crit-slam`, texto "Crítico! · 20 natural". No feed: cartão com borda e fundo dourados, selo "Crítico" e hexágono dourado. Subida de nível usa variante teal no feed.

## Retratos

As artes dos personagens são de corpo inteiro com fundo branco, ruins em tamanhos pequenos. Retratos (feed, mesa, barra de resumo, cabeçalho) usam o **token** do Roll20 (rosto em círculo, fundo transparente) via `portraitOf()` e `Avatar shape="circle"`; a arte completa abre num `<dialog>` nativo pelo botão "Ver arte completa" no cabeçalho da ficha.

## Layout da ficha

Cabeçalho (identidade) → barra de resumo fixa a partir de `md` (Vida e Sanidade com +/-, CA, BP, deslocamento, Aberturas) → abas Ficha · Habilidades · Inventário · Traços (· Rolagens abaixo de `xl`) → feed de rolagens fixo à direita em `xl`. Cada rolagem própria toca a animação de dados antes de aparecer no feed.

## Animações

- Keyframes em `animations.css`: `sf0..sf7` (estilhaços flutuando 2 a 6px), `title-pulse` (logo, 5s, via `drop-shadow`), `crack-fade` (rachaduras, 5.5s).
- Parallax do login (`LoginBackground.hook.ts`): 4 camadas com velocidades `[5, 11, 20, 34]`px, lerp 0.055, deriva automática até o primeiro movimento do mouse, luz radial seguindo o cursor.
- `prefers-reduced-motion` desliga parallax e reduz animações.
- Dice Roll Popup do protótipo implementado em `modules/table/components/organisms/DiceRollOverlay`: hexágono, fase Rolling (números girando a cada 50ms + runa flutuando, 1800ms), Adding (dados + modificador, 1200ms) e Result (total com brilho, 2600ms, outras linhas como Dano abaixo, 20/1 natural destacado). Esc ou clique fecham. Keyframes `pulse-breath`, `float-rune`, `flash-out`, `pop-in`, `slide-down-in`. Com movimento reduzido abre direto no resultado.
- Futuras: menu de dados (opacity 0 → 1 + translateY 8 → 0 em 300ms).

## Biblioteca de fichas e listas reordenáveis

- **Árvore do Mestre** (`modules/library/.../LibraryTree`): linhas compactas. Pasta (`FolderRow`) tem uma **aba** em cima (corte diagonal teal); aberta, o conteúdo fica num corpo com borda teal logo abaixo, indentado, como uma pasta aberta. Ficha (`CharacterRow`): token, nome (Cinzel, cor fixa, sem mudar no hover), classe · nível, selos teal das contas com acesso e menu de ações (`ActionMenu`, padrão WAI-ARIA menu).
- **Arrastar**: alça (`grip-vertical`) para teclado; com o mouse a linha inteira arrasta. No meio de uma pasta o item entra (realce teal), nas bordas aparece a linha de inserção (`DropIndicator`) antes/depois; segurar sobre pasta fechada a abre. A linha "Todas as fichas" no topo vira zona "solte aqui para tirar da pasta". Pelo teclado as setas pulam entre essas posições. A prévia (`DragPreview`) vai num portal no `body` (o `backdrop-blur` dos painéis desalinharia elementos `fixed`). Movimento travado no eixo vertical.
- **Listas da ficha** (habilidades, Reino Interior, inventário, traços): `SortableList` com alça "Reordenar X" à esquerda de cada item, teclado (espaço, setas, espaço; Esc cancela) e anúncios em português.
- Jogador e resultados de busca: lista plana de `CharacterRow` (a busca mostra o caminho da pasta).

## Carregamento (skeletons)

Regra obrigatória (`docs/RULES.md`, cobrada pelo `quality-reviewer` e pelo `design-reviewer`): todo carregamento de dados da API (e da conexão em tempo real) mostra um **skeleton fiel ao layout final**, nunca texto "Carregando..." solto, spinner, tela vazia, estado vazio falso ("Nenhuma rolagem ainda" antes de o histórico chegar) ou salto de layout ao trocar pelo conteúdo.

- **Fidelidade**: o skeleton mantém a moldura real (painéis, bordas, aba das pastas, alças, menus, cabeçalhos, barras de rolagem) e os textos e controles fixos de verdade (títulos, rótulos, botões com ícone e rótulo, campo de busca com o placeholder, nomes das perícias, regras dos bloqueios e das Aberturas); só o que vem do dado vira placeholder. Seções de tamanho fixo batem ao pixel com o componente pronto.
- **Dicas do aparelho**: cookie `magista-hints` (`SkeletonHintsProvider` em `modules/shell/providers`; o layout `(table)` lê no servidor com `cookies()`, então o **primeiro HTML** já sai no formato certo; os componentes leem com `useSkeletonHint(chave)` e gravam com `useSkeletonHintActions().setHint`). Partes, cada uma validada pelo módulo dono: `s` sessão (papel e tamanho do login), `l` biblioteca (árvore do Mestre ou lista do jogador: tamanho de nomes e logins dos selos, classe e nível, contagem das pastas, pastas abertas), `p` quantas pessoas online, `f` feed (para os últimos cartões: cada linha de resultado com tamanho do rótulo, quantidade de dados, modificador e natural; tamanho das notas; tamanho de nome, título e subtítulo; se foi rolado pelo Mestre ou é crítico), `a` se a última ficha tinha arte. Nunca ids, nomes, logins ou segredos; apagado no logout e quando a sessão fica anônima. Se o registro não couber no cookie, as maiores partes são descartadas primeiro, preservando a que está sendo gravada (`fitHints`). Sem dica, o skeleton não afirma o papel (títulos viram placeholder).
- **Átomo `Skeleton`** (pulsa só em opacidade, `skeleton-pulse`, sem brilho; parado com movimento reduzido): `text` é uma barra dimensionada pela tipografia ao redor (dentro das mesmas classes de texto do valor real; em contêiner flex, envolva num `span`); `glyphs` desenha texto invisível (`skeletonSample(tamanho)` ou o texto fixo real), reproduzindo largura e quebra; `inline`, `block`, `bar` e `circle` para caixas.
- **Moléculas e reuso**: `AvatarSkeleton` (tamanho e anel do `Avatar`), `ButtonSkeleton` (o próprio botão em versão inerte: variante, ícone e rótulo reais), `StepperSkeleton`, `SkeletonRegion` (`aria-busy` e só o rótulo num `role="status"` escondido; aninhado usa `announce={false}`). Componentes reais com estado de espera: `PresencePanel` (`loadingRows`) e `RollFeed` (`loading`, cartões no formato do `RollCard`, com a moldura da variante, dourada no crítico e teal na subida de nível, e os rótulos fixos reais "Crítico", "rolado pelo Mestre" e "Mostrar mais"; lista não focável); o skeleton da página reutiliza os dois com `nested`. Controles reais que precisam aparecer (campo de busca) vão dentro de um contêiner `inert`; nada dentro do skeleton recebe foco pelo Tab. Texto de exemplo cortado usa `text-clip` (sem reticências visíveis). Títulos dentro do skeleton não são `h2`/`h3`.
- **Estabilidade do componente real**: se algo do componente muda de tamanho durante o carregamento, o componente reserva o espaço (status da conexão com a largura do maior rótulo; lista do feed com `scrollbar-gutter: stable`).
- **Garantia**: `e2e/tests/loading.spec.ts` compara as medidas do skeleton com a tela pronta (ficha e mesa, esta para Mestre e jogador, no carregamento da sessão e da biblioteca, em 390, 1024 e 1440px; árvore com pastas abertas, fechadas e vazias), confere o HTML do servidor sem JavaScript, o feed durante a conexão e que sair apaga as dicas. Ao mudar a moldura de um componente, atualize o skeleton dele junto.

## Mapa Figma → código

| Figma (Componentes `29:2`)                                     | Nó                | Código                                                                                                                                                                                        |
| -------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button (Primary/Secondary/Mystic/Destructive/Ghost × SM/MD/LG) | `54:68`           | `shared/components/atoms/Button`                                                                                                                                                              |
| Input (Default/Password/Micro), Textarea                       | `55:73`, `30:13`  | `atoms/Input`, `atoms/Textarea`, `molecules/PasswordField`, `molecules/NumberField`                                                                                                           |
| Select                                                         | `43:12`           | `atoms/Select` (select nativo estilizado)                                                                                                                                                     |
| Checkbox                                                       | `55:18`           | `atoms/Checkbox` (tons ruby/teal)                                                                                                                                                             |
| Typography                                                     | `39:16`           | `atoms/Text`                                                                                                                                                                                  |
| Ícones `icon/*` (lucide)                                       | `53:*`            | `atoms/Icon`                                                                                                                                                                                  |
| Stepper / Stepper Button                                       | `44:60`, `39:95`  | `molecules/Stepper`                                                                                                                                                                           |
| Panel                                                          | `44:167`          | `molecules/Panel` (glass/primary/inner; faltam interactive e empty) + `molecules/SectionHeader`                                                                                               |
| Attribute Card                                                 | `30:106`          | `modules/sheet/components/molecules/AttributeCard`                                                                                                                                            |
| Stat Circle (CA/BP)                                            | `44:84`           | `modules/sheet/.../StatCircle`                                                                                                                                                                |
| Info Bar                                                       | `44:107`          | `modules/sheet/.../RollBar`                                                                                                                                                                   |
| Resource Bar (Health/Sanity)                                   | `44:140`          | `modules/sheet/.../ResourceBar`                                                                                                                                                               |
| Tactical Action                                                | `44:180`          | `modules/sheet/.../BlockCard` (bloqueios) e `OpeningAction` (gastos de Aberturas)                                                                                                             |
| Connection Counter                                             | `44:71`           | Contador de Aberturas em `CombatPanel`                                                                                                                                                        |
| Inventory Item / List                                          | `44:211`, `45:70` | `InventoryPanel` + `InventoryEntry`                                                                                                                                                           |
| Chat Bubble (Roll)                                             | `44:275`          | `modules/table/components/organisms/RollFeed` (`RollCard`), versão inicial do feed                                                                                                            |
| Login 1920x1080                                                | `11:2`            | `modules/auth`                                                                                                                                                                                |
| Dice Roll Popup                                                | `45:28`           | `modules/table/components/organisms/DiceRollOverlay` (com tema dourado de crítico)                                                                                                            |
| Record Form                                                    | `45:110`          | `shared/components/molecules/EditorModal` + `modules/sheet/components/molecules/*Form`                                                                                                        |
| Pendentes                                                      |                   | Badge `29:58`, Radio `55:41`, Switch `30:44`, Slider `30:48`, Icon Badge `43:54`, System Pill `43:57`, Chat Header `44:287`, Chat Input `44:299`, Dice Menu `44:314`, Chat Interface `45:227` |
