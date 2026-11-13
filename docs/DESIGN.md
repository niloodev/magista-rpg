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

## Animações

- Keyframes em `animations.css`: `sf0..sf7` (estilhaços flutuando 2 a 6px), `title-pulse` (logo, 5s, via `drop-shadow`), `crack-fade` (rachaduras, 5.5s).
- Parallax do login (`LoginBackground.hook.ts`): 4 camadas com velocidades `[5, 11, 20, 34]`px, lerp 0.055, deriva automática até o primeiro movimento do mouse, luz radial seguindo o cursor.
- `prefers-reduced-motion` desliga parallax e reduz animações.
- Futuras (do protótipo): Dice Roll Popup em 3 fases (Rolling 1800ms, Adding 1200ms, Result 3000ms, easing `--magista-ease-pop`), menu de dados (opacity 0 → 1 + translateY 8 → 0 em 300ms), barra de recurso com lâmina de brilho.

## Mapa Figma → código

| Figma (Componentes `29:2`)                                     | Nó       | Código                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button (Primary/Secondary/Mystic/Destructive/Ghost × SM/MD/LG) | `54:68`  | `shared/components/atoms/Button`                                                                                                                                                                                                                                                                                                                                               |
| Input (Default/Password/Micro)                                 | `55:73`  | `atoms/Input`, `molecules/PasswordField`                                                                                                                                                                                                                                                                                                                                       |
| Typography (H1, H2, H3, Body, Label, Micro Header, Lore)       | `39:16`  | `atoms/Text`                                                                                                                                                                                                                                                                                                                                                                   |
| Ícones `icon/*` (lucide)                                       | `53:*`   | `atoms/Icon`                                                                                                                                                                                                                                                                                                                                                                   |
| Panel (Primary/Inner/Interactive/Empty Slot)                   | `44:167` | `molecules/Panel` (glass/primary/inner; faltam interactive e empty)                                                                                                                                                                                                                                                                                                            |
| Login 1920x1080                                                | `11:2`   | `modules/auth` (LoginPage, LoginPanel, LoginBackground)                                                                                                                                                                                                                                                                                                                        |
| Pendentes                                                      |          | Badge `29:58`, Checkbox `55:18`, Radio `55:41`, Switch `30:44`, Slider `30:48`, Select `43:12`, Stepper `44:60`, Stat Circle `44:84`, Resource Bar `44:140`, Attribute Card `30:106`, Tactical Action `44:180`, Inventory Item `44:211`, Chat Bubble `44:275`, Chat Header `44:287`, Chat Input `44:299`, Dice Menu `44:314`, Dice Roll Popup `45:28`, Chat Interface `45:227` |
