# Animações e VFX da Arena

Guia para criar ou ajustar uma animação da Arena (`apps/web/src/modules/arena/services`): primeiro as boas práticas que valem para qualquer animação, depois o kit de energia e fluido (fios arcanos, luz divina, sombra viva, fogo, vidro quebrado, som). A arquitetura geral dos efeitos (catálogo, registro, parte de tela, grupo, `impactMs`) está em `docs/ARCH.md`.

## Boas práticas de animação

Valem para todo efeito, com ou sem o kit de energia.

**Conte uma história em fases.** Toda animação boa tem preparo, golpe e consequência: algo se junta ou se ergue, acerta, e o que sobrou se espalha e some. Declare as fases como frações do tempo total num `X_PHASES` em `.constants` (`DEATH_PHASES`, `VOX_PHASES`) e derive tudo delas com `phase(t, de, até)`. Mudar o ritmo vira mudar uma constante, não caçar números no código.

**O golpe tem hora marcada.** Declare `impactMs` no efeito: as barras de vida e sanidade só mudam nesse instante. O atacante declara `hitMs` (quando a arma chega ou a magia aterrissa) e o alvo começa a contar dali. O instante do impacto é o mais forte da animação: clarão curto, tremor (`shockwave`), o token esmagado e voltando (`frame` com `dx`, `scaleX`, `scaleY`).

**Nada aparece ou some de uma vez.**

- Entrada com curva: `easeOutBack` para coisas que surgem, `phase(...) ** 0.7` para coisas que crescem.
- Fitas de energia entram com `head` crescendo e saem com `tail`, nunca com `alpha` ligando.
- O que sobra no fim se dissipa: fluido com `inject: 0` até apagar (`linger`), partes de tela esmaecendo a partir de `ARENA_FX_FADE_FROM`, e o renderer ainda esmaece o resto em `EFFECT_LINGER_MS`.
- Quando a dissipação começa, esconda o que é nítido (anéis, auréolas, sigilos) e tire os filtros do mundo, para nada ficar parado na tela.

**Formas sem quina.** Fitas afinam até ponta (largura a zero), pontas ganham um brilho pequeno, bordas são macias (`feather`). `Graphics` com contorno duro, ponta quadrada ou polígono chapado destoa do resto. Linha nítida só onde ela é o assunto (o anel da auréola, as rachaduras do vidro), e fina.

**Cor com intenção.** Cada efeito tem paleta própria, de dois a três tons vizinhos alternados entre as fontes, e o branco só no ponto mais quente. Brilho forte, bloom forte e muita coisa somada viram uma mancha branca: prefira contraste (luz sobre escuro) a intensidade.

**Tudo na escala do token e da câmera.**

- Tamanhos, distâncias e forças são múltiplos do raio do token.
- Partes de tela planejam em pixels de tela uma vez e seguem o alvo e o zoom a cada quadro (`root.position` no ponto do alvo, `root.scale` pela razão de raios).
- Filtros no mundo recebem o centro em pixels de tela a cada quadro e chamam `host.screen.fitWorldFilters()`.

**Pense no grupo.** Num dano em área a Ultimate toca a parte de tela uma vez só (`host.screen.claim`) com a peça central sobre o grupo (`groupShape`, crescendo com o espalhamento), e cada alvo toca só a própria parte. Efeitos por alvo precisam ser baratos, porque podem ser muitos ao mesmo tempo.

**O atacante conta a mesma história.** A parte do atacante usa as mesmas peças e a mesma paleta do alvo (a Heylel chama com o mesmo dourado que desce no alvo; o Talis estica a mesma sombra viva) e termina no `hitMs`, quando a do alvo assume.

**Desempenho é parte do visual.**

- No modo performance as animações ricas não tocam (só o flash e o número).
- Um fluido por efeito; resolução menor e `pressureSteps: 10` quando o efeito é por alvo (18 só nos fluidos de tela).
- Peça cara por alvo tem teto: `host.screen.reserve(chave, limite, ms)` só libera até o limite ao mesmo tempo (o fogo do Vodu queima em fluido em no máximo 3 alvos; os outros mostram as mesmas fontes como fitas de fogo).
- Filtros no mundo entram no primeiro quadro do efeito, não na construção (o efeito pode esperar o atacante antes de começar).
- Geometria refeita por quadro só onde a forma muda.
- Tudo o que é criado é destruído no `destroy` e no `end` (fluidos, fitas, filtros, texturas), inclusive quando o efeito é cortado no meio.

**Veja antes de dizer que está pronto.** Efeito visual não se valida por teste unitário: tire prints quadro a quadro (seção "Como conferir"), com um alvo e em grupo, com e sem atacante, com zoom perto e longe, e olhe o console atrás de erro de shader.

## A ideia em uma frase

Energia bonita tem duas camadas: **fios finos e nítidos** que dão forma e rumo, e uma **névoa de fluido** que nasce deles, se enrola e some sozinha. Só fio parece laser. Só fluido parece tinta ou fumaça. As duas juntas parecem energia viva.

## As peças

| Peça                      | Pasta               | Para que serve                                                                                                                                             |
| ------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ArenaEnergyFluid`        | `arenaEnergyFluid`  | O fluido em GPU (Stable Fluids). Recebe tinta, leva, enrola, dissipa e mostra como névoa.                                                                  |
| `ArenaEnergyTendril`      | `arenaEnergyFluid`  | Energia de um ponto a outro: fios trançados nítidos e o rastro que eles despejam no fluido.                                                                |
| `ArenaEnergyChannel`      | `arenaEnergyFlow`   | Uma faixa de energia numa curva entre dois pontos. É a base do tendril; sozinha fica larga.                                                                |
| `ArenaEnergyFlow`         | `arenaEnergyFlow`   | Faixa de energia em qualquer caminho, aberto ou fechado (`circlePath`): anéis, auréolas, contornos.                                                        |
| `ENERGY_PALETTES`         | `arenaEnergyFlow`   | Paletas prontas (`core`, `mid`, `deep`): `gold`, `holy`, `ember`, `hextech`, `blood`, `scarlet`, `crimson`, `nox`, `dusk`, `shade`, `voodoo`, `voodooHot`. |
| `ArenaGlassShatterFilter` | `arenaGlassShatter` | Vidro quebrado sobre o mapa: cacos que deslocam a imagem, rachaduras de luz, frestas.                                                                      |
| `ArenaSoundWaveFilter`    | `arenaSoundWave`    | Som visível: ondas de ar comprimido que distorcem o mapa e os tokens por onde passam.                                                                      |

Regra de escolha: energia que **viaja** usa `ArenaEnergyTendril`; energia que **fica num lugar** (anel, auréola, contorno) usa `ArenaEnergyFlow` e, se deve soltar névoa, entra também em `fluid.sources`.

## Como montar

```ts
const fluid = new ArenaEnergyFluid(host, {
  area: field,
  palette: ENERGY_PALETTES.scarlet,
  turbulence: { scale: r * 2.2, force: r * 7 },
  vorticity: 34,
  gain: 1.25,
});
fluidLayer.addChild(fluid.view);

const tendril = new ArenaEnergyTendril(fluid, {
  palette: ENERGY_PALETTES.blood,
  from,
  to,
  bend: 0.18,
  width: r * 0.4,
  speed: 260,
  grain: 110,
  strands: 4,
  seed: 5,
});
scene.addChild(tendril.view);
```

A cada quadro:

```ts
tendril.update(seconds, { head, tail, alpha });
fluid.update(delta, { inject: 3.2, bias: { center: target, radial: -r * 2.6, swirl: r * 2.8 } });
```

No fim, destrua os tendrils antes do fluido. Exemplos completos: `arenaVoxPopuliEffect/subcomponents/VoxScreen` e `arenaDivineCallEffect/subcomponents/DivineScreen`.

## Boas práticas

**Nunca mostre a tinta crua.** A tinta do fluido só diz onde a energia está e com que força. Pintar a densidade como área cheia dá cara de tinta derramada. A saída do fluido já resolve isso: névoa translúcida rasgada em fiapos por um ruído que a própria tinta entorta, com veios de luz. Não troque por um mapa direto de densidade para cor.

**Fontes finas.** O que deixa "grosso" é a largura da fonte, não o fluido. Um tendril tem em torno de 0,3 a 0,6 raio de token de largura no total, e cada fio é menos da metade disso. Faixa com mais de um raio de largura vira mangueira.

**Cor saturada, branco só no miolo.** O brilho que cega vem de somar tinta até estourar em branco. A névoa usa o matiz da tinta e nunca vai a branco; só os veios mais quentes puxam para a cor `core` da paleta. Se precisa de um clarão, faça um clarão curto separado (`paintGlow`), não aumente o fluido.

**Mais de uma cor.** Alterne duas ou três paletas vizinhas entre as fontes (sangue, escarlate e carmim; branco sagrado, ouro e brasa). Elas se misturam no fluido e tiram o aspecto de "glow de uma cor só".

**Tinta por segundo, não por quadro.** `inject` é quanto se despeja por segundo; o fluido já multiplica pelo tempo do quadro. Assim o efeito fica igual a 30 e a 144 fps. Valores entre 2 e 4 funcionam com `decay` perto de 0,45.

**Dê rumo ao fluido.** Sem viés ele só gira no lugar e parece fumaça. Use `bias` em toda fase: `radial` negativo puxa para um ponto, positivo explode a partir dele, `swirl` gira em volta, `drift` leva numa direção. Troque o viés quando a fase muda (antes do impacto puxa, depois solta).

**Turbulência na escala do token.** `turbulence.scale` é o tamanho dos redemoinhos; perto de dois raios de token dá curvas que se leem como energia. Muito pequeno vira ruído, muito grande vira vento. `vorticity` (28 a 34) é o que mantém os redemoinhos vivos e dá o aspecto líquido.

**Tudo em raios do token.** Larguras, distâncias e forças são múltiplos do raio do token na tela, planejados uma vez; o grupo do efeito segue a posição do alvo e o zoom a cada quadro. Nada em pixels fixos.

**O fim se dissipa.** Ponha `fluid.view` numa camada própria, fora do grupo que esmaece com a parte de tela. Quando a animação acaba, continue chamando `update` com `inject: 0` por `FLUID_LINGER_MS` (o método `linger` das partes de tela) e só então destrua. O efeito devolve `done: false` enquanto isso.

**Entrada e saída do fio.** Revele com `head` crescendo (a energia chega) e esgote com `tail` crescendo (a energia vai embora). Nunca ligue ou desligue por `alpha` de uma vez. Defase os fios alguns centésimos entre si.

**Uma parte de tela por lançamento.** Num dano em área só o primeiro alvo cria o fluido (`host.screen.claim`); os outros alvos recebem os fios. O fluido cobre `host.screen.field()`, a tela inteira com margem.

**Custo.** O fluido roda cerca de 25 passes pequenos por quadro e só existe enquanto a Ultimate toca. Um fluido por efeito. Cada tendril são quatro faixas com geometria refeita por quadro, então pense em até uma dúzia por cena. No modo performance as Ultimates não tocam a parte rica.

**Shaders.** O Pixi compila estes shaders no modo compatível com WebGL 1, então funções como `fwidth` não existem. Texturas da simulação são `rgba16float`. Erros de shader aparecem no console do navegador e no log do dev server (`[web] [browser]`).

## Sombra viva

O fluido tem um segundo modo: `mode: "shadow"`. A tinta vira uma fumaça escura que cobre a cena (mistura normal, não somada), com as bordas rasgadas acesas na cor da tinta e veios de energia brilhando por dentro. É o jeito de fazer escuridão que se mexe, para Nox, morte, maldição, vazio.

```ts
const fluid = new ArenaEnergyFluid(host, {
  area: field,
  palette: ENERGY_PALETTES.nox,
  mode: "shadow",
  haze: 0.9,
  gain: 1.2,
});
```

- Escuro sobre escuro some. A sombra se lê pelas bordas acesas, então a tinta precisa ser de uma cor viva (`nox`, `dusk`), não preta. A cor da tinta vira a luz da borda; o corpo é sempre quase preto.
- Dê à sombra uma forma por cima, com três fitas no mesmo caminho (é o que fazem as sombras da Reencarnação da Morte):
  - o corpo: um `ArenaEnergyFlow` com a paleta `shade`, `blend: "normal"`, `density` perto de 3,5 e `feather` alto (borda macia, preto no miolo e violeta na borda);
  - a energia: um `ArenaEnergyFlow` violeta fino e nítido por cima;
  - a tinta: uma fita mais larga em `fluid.sources`.
- Nunca termine uma fita em ponta quadrada: a largura vai a zero na ponta (como `coilWidth`, que engrossa ao sair do chão e afina até a ponta), e um brilho pequeno (`glow`) marca a ponta. Gráfico com contorno duro (`Graphics` com `stroke`) não combina com o resto do kit.
- Use mais tinta que no modo luz (`inject` perto de 3,5) e `decay` um pouco maior (0,55), porque a sombra precisa de corpo para cobrir.
- Ponha a camada do fluido abaixo das peças que brilham (selo, runas, pilar): a luz por cima da sombra é o contraste que faz o efeito.
- Um bloom suave na parte de tela (limiar perto de 0,42, escala 0,75) faz runas e anéis brilharem sem estourar. Bloom forte deixa tudo branco.

## Fogo

O terceiro modo do fluido é `mode: "fire"`. A tinta vira calor: onde é densa queima quase branca, esfria pela paleta (`core`, depois `mid`, depois `deep`) e se rasga em línguas que sobem. A cor das fontes não importa, só a quantidade. É o fogo do Vodu (no alvo, no machado e na bola de fogo).

```ts
const fluid = new ArenaEnergyFluid(host, {
  area: { x: -r * 4.5, y: -r * 7, width: r * 9, height: r * 10 },
  palette: ENERGY_PALETTES.voodoo,
  mode: "fire",
  decay: 0.4,
  turbulence: { scale: r * 0.9, force: r * 7 },
  vorticity: 40,
  gain: 1.3,
});
fluid.update(delta, { inject: 7, bias: { drift: { x: 0, y: -r * 5.5 } } });
```

- Fogo precisa de muita tinta (`inject` entre 7 e 9) e de `decay` rápido (0,3 a 0,4): ele nasce forte na fonte e some subindo. Pouca tinta dá um fogo escuro e ralo.
- Ele sempre sobe: dê um `drift` para cima forte. Turbulência pequena (perto de um raio) e `vorticity` alta (40) fazem as línguas.
- A fonte desenha onde o fogo nasce, não a chama: um anel aos pés do alvo, línguas curtas subindo por ele, o fio de uma lâmina, uma bola em voo. Se a fonte se move, o fogo deixa um rastro sozinho (o machado, a cauda da bola de fogo).
- No impacto, um empurrão `radial` curto espalha o fogo para os lados antes de ele subir.
- Um efeito de token tem o próprio fluido, em coordenadas locais. Deixe a área com folga (o fogo sobe uns 7 raios); a borda some suave, mas fogo que chega nela fica fraco.
- Dois fogos misturados: passe `secondary` (por exemplo `ENERGY_PALETTES.hellfire`). As fontes com cor puxada para o vermelho queimam nessa paleta e as outras na principal; onde se encontram, o fogo passa de uma para a outra. O Vodu alterna fontes verdes e vermelhas (o anel aos pés, as línguas, os cortes, a cauda da bola de fogo).
- O branco fica só nas pontas mais quentes. Se o fogo vira uma bola branca, há tinta demais num ponto só: espalhe em mais fontes em vez de aumentar `inject`.
- Para outras cores de fogo, monte uma paleta com `core` claro, `mid` saturado e `deep` na cor da ponta (o violeta do Vodu, um vermelho escuro para fogo comum, um azul para fogo frio).

## Vidro quebrado na tela

`ArenaGlassShatterFilter` (`arenaGlassShatter`) quebra a imagem do mapa como uma vidraça atingida num ponto. É um filtro sobre o mundo, não um desenho por cima: cada caco desloca a imagem atrás dele e reflete a luz no próprio ângulo, e as rachaduras são linhas finas de luz.

```ts
const glass = new ArenaGlassShatterFilter({ edge: VOX_COLORS.blush, glow: VOX_COLORS.ruby });
host.screen.addWorldFilter(glass);
glass.update({ center, unit: r, reach, amount, breakup, flash, seconds });
```

- `center` e `unit` são em pixels de tela (o ponto do impacto e o raio do token ali), recalculados a cada quadro para seguir a câmera.
- `reach` é até onde as rachaduras já correram, em raios: anime de 0 até cobrir a tela em poucos centésimos da animação, desacelerando.
- `amount` é o quanto aparece: use para o fim (de 1 a 0), nunca remova o filtro de uma vez.
- `breakup` abre frestas entre os cacos e os afasta; use no momento em que algo estilhaça.
- Ponha o filtro só enquanto ele aparece e tire quando `amount` chega a 0. Se houver separação de cores (`RGBSplitFilter`), adicione o vidro depois dela, para as rachaduras não virarem arco-íris.
- Linhas finas (perto de 1 px) e brilho baixo em volta delas. Linha grossa com brilho vira teia de neon, não vidro.

## Som visível

`ArenaSoundWaveFilter` (`arenaSoundWave`) mostra som como distorção, não como desenho: cada onda é uma faixa de ar comprimido que empurra a imagem para fora e puxa de volta, então o mapa e os tokens ondulam quando ela passa. Use para voz, grito, sino, trovão, qualquer coisa que se ouve.

```ts
const sound = new ArenaSoundWaveFilter({ tint: VOX_COLORS.rose });
host.screen.addWorldFilter(sound);
sound.update({ origin, direction, unit: r * cameraScale, waves });
```

- `origin` e `unit` em pixels de tela (`host.screen.toScreen(container)` e o raio do token vezes a escala da câmera), `direction` para onde as ondas vão. Chame `host.screen.fitWorldFilters()` antes, a cada quadro.
- Cada onda: `radius` (até onde já correu, em raios), `strength`, `thickness` (a faixa engrossa conforme se afasta) e `spread` (meia abertura da frente; `Math.PI` é um anel inteiro). Planeje as ondas numa função pura, como `speechWaves` no `arenaVoxSpeechEffect`.
- Comece com um anel inteiro em volta da fonte e depois mande ondas estreitas em sequência, alternando forte e mais fraca (a voz e o eco). A força sobe e desce com `sin(PI * vida)`, nunca liga de uma vez.
- Tire o filtro do mundo quando não houver onda viva. Até 8 ondas ao mesmo tempo.
- O brilho na crista é fraco de propósito: o que se vê é a imagem ondulando. Se precisar de mais presença, aumente `push`, não o brilho.

## Receitas de visual

Os dois primeiros visuais estão em uso e foram conferidos na tela. O terceiro é um ponto de partida que ainda não foi usado em nenhum efeito: ajuste olhando.

| Parâmetro                | Arcano (estilo Feiticeira Escarlate) | Luz divina                          | Energia, plasma (ponto de partida)  |
| ------------------------ | ------------------------------------ | ----------------------------------- | ----------------------------------- |
| Onde está                | Vox Populi                           | Chamado Divino                      | ainda não usado                     |
| Paletas das fontes       | `blood`, `scarlet`, `crimson`        | `holy`, `gold`, `ember`             | `hextech` e uma variação mais clara |
| Paleta do fluido (veios) | `scarlet`                            | `holy`                              | `hextech`                           |
| Largura do tendril       | 0,4 a 0,6 r                          | 0,28 a 0,34 r                       | 0,3 a 0,5 r                         |
| `speed` dos fios         | 260 a 380                            | 220 a 420                           | 450 a 600                           |
| `strands`                | 4                                    | 3 a 4                               | 5 a 6                               |
| `turbulence`             | escala 2,2 r, força 7 r              | escala 2 r, força 6,5 r             | escala 1,5 r, força 9 r             |
| `vorticity`              | 34                                   | 30                                  | 30                                  |
| `decay`                  | 0,45 (0,55 depois do golpe)          | 0,45 (0,58 depois do golpe)         | 0,35                                |
| `gain`, `inject`         | 1,25 e 3,2                           | 1,1 e 3                             | 1 e 3                               |
| Viés antes do golpe      | puxa para o foco e gira              | gira em volta da auréola, sobe leve | corre ao longo do caminho (`drift`) |
| Viés depois do golpe     | deriva forte até o alvo              | sobe (cura) ou explode (dano)       | explode e gira                      |

O que define cada um:

- **Arcano**: fios bem finos e curvos, vermelho saturado com toque magenta, névoa que se enrola em volta deles. O giro (`swirl`) é tão forte quanto o puxão. Fundo escuro ajuda: a energia aparece por contraste, não por brilho.
- **Luz**: menos giro e mais subida. A névoa sobe como chama calma e some para cima. O branco fica nas peças nítidas (anel da auréola, coluna), não no fluido. Um bloom suave por cima das peças nítidas, nunca forte.
- **Energia, plasma**: fios mais rápidos e com mais veios, névoa que dura menos (`decay` menor) e redemoinhos menores. Sem raios nem arcos elétricos.

## Se ficou estranho

| Parece             | Causa provável                              | O que mexer                                                         |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------------- |
| Tinta derramada    | fontes largas demais ou névoa forte demais  | afinar as fontes; baixar `haze` ou `inject`                         |
| Brilhante demais   | muita tinta acumulada, bloom forte          | baixar `inject` e `gain`; baixar o `decay` para a névoa durar menos |
| Grosso             | largura do tendril                          | `width` abaixo de 0,6 r; menos `wake`                               |
| Fumaça             | sem rumo, só turbulência                    | `bias` mais forte que a turbulência; mais `vorticity`               |
| Laser, linha reta  | pouco `bend`, pouco balanço, um fio só      | `bend` de 0,12 a 0,3 alternando o lado; 3 fios; mais `sway`         |
| Glow de uma cor só | uma paleta só                               | alternar duas ou três paletas vizinhas                              |
| Some do nada       | fluido destruído com a parte de tela        | camada própria e `linger`                                           |
| Parado             | `speed` baixo, sem `head` e `tail` animados | subir `speed`; revelar e esgotar os fios                            |
| Vidro parece teia  | cacos grandes e regulares, linha grossa     | mais raios (`SPOKES`), linha perto de 1 px, menos brilho em volta   |
| Sobra no fim       | último quadro da parte de tela fica parado  | esconder a parte de tela e tirar os filtros ao começar o `linger`   |

## Como conferir

Efeito visual não se valida por teste: olhe. O jeito confiável de ver um quadro exato é abrir a Arena pelo Playwright do `e2e`, congelar o relógio da página (`page.clock.install`, `pauseAt`) antes de aplicar o efeito, avançar de 400 em 400 ms com `page.clock.runFor` e tirar um print a cada passo. Assim dá para comparar o antes e o depois de cada ajuste no mesmo instante da animação. Isso é ferramenta de trabalho, não vira spec.

Antes de dar por pronto, veja com um alvo e em grupo, com dano e com cura (quando o efeito tem os dois), movendo a câmera e com zoom perto e longe, e confira no console que não há erro de shader.
