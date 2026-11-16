# Domínio: regras do Magista

Extraído da ficha Roll20 atual (`/home/ezeq/froggie-projects/magista/index.html`) e das notas de classes. Base adaptada de D&D 5e.

Implementação (fonte da verdade no código): `packages/shared/src/game/` com `catalog` (classes, perícias, tabelas), `rules` (`deriveSheet` calcula todos os valores derivados), `dice` (parser e rolagem) e `rolls` (`buildRollSpec`, um tipo de rolagem por botão da ficha). O schema da ficha é `characterSheetSchema` (versão 1) em `packages/shared/src/schemas/character`. Valores derivados nunca são salvos. A importação dos 7 personagens reais conferiu CA, proficiência, Dano Base, deslocamento, dado de vida, peso, mods, CDs e as 21 perícias com o Roll20, sem diferenças.

## Acesso

- **Jogador** (`PLAYER`): entra com o login da conta + senha (contas importadas usam o nome do personagem como login). Pode ter **várias fichas**: abre, edita e rola com as que o Mestre liberou para a conta. Vê suas fichas em lista, com busca. Não cria nem exclui fichas.
- **Mestre** (`GM`): conta própria; vê todas as fichas e o chat. Na biblioteca de fichas (`/mesa`) organiza tudo em **pastas aninhadas** (árvore com drag and drop: reordenar, mover para dentro de pastas, tirar para a raiz), cria e exclui fichas, cria contas de jogador e libera o **acesso** de cada ficha para uma ou mais contas (acesso N:N, tabela `character_access`).
- Ordem manual: pastas e fichas guardam `position` dentro da pasta-pai; as listas da ficha (habilidades, Reino Interior, inventário, traços) também podem ser reordenadas por drag and drop pelo jogador e pelo Mestre.

## Atributos

FOR, CON, DES, INT, SAB, CAR (chaves `for`, `con`, `des`, `int`, `sab`, `car`).

- Valor vazio conta como 10.
- **Modificador** = `trunc((valor - 10) / 2)` (9 → 0, 7 → -1). Difere do D&D (`floor`) de propósito: decisão do mestre, manter igual ao Roll20.
- **CD do atributo** = `10 + mod (+ proficiência se marcado proficiente)`.
- Teste de atributo: `1d20 + mod` (não soma proficiência).

## Progressão

- Nível 1 a 99. **Proficiência** = `clamp(ceil(nível / 2), 1, 10)`.
- Tabelas de classe cobrem níveis 1 a 12; acima disso o Dano Base mantém o último dado e soma +1 fixo por nível.

## Classes

Sem Classe, Arcanista, Vanguardista, Caçador, Médium, Rúnico, Liturgista, Fadador, Executor, Trilhador.

| Classe       | CA base | Desloc. (normal / bônus) | Dado de Vida | Atributos proficientes típicos |
| ------------ | ------- | ------------------------ | ------------ | ------------------------------ |
| Sem Classe   | 7       | 8m / 8m                  | 4 + 1d2      | nenhum                         |
| Arcanista    | 9       | 8m / 8m                  | 4 + 1d2      | INT, SAB                       |
| Vanguardista | 12      | 7m / 8m                  | 8 + 1d4      | FOR, CON                       |
| Caçador      | 10      | 9m / 12m                 | 6 + 1d3      | DES, SAB                       |
| Médium       | 9       | 8m / 8m                  | 5 + 1d3      | SAB, CAR                       |
| Rúnico       | 10      | 8m / 8m                  | 6 + 1d3      | INT, CON                       |
| Liturgista   | 9       | 8m / 10m                 | 5 + 1d3      | CAR, SAB                       |
| Fadador      | 10      | 9m / 12m                 | 5 + 1d3      | SAB, INT                       |
| Executor     | 11      | 10m / 12m                | 6 + 1d3      | DES, FOR                       |
| Trilhador    | 10      | 12m / 14m                | 6 + 1d3      | DES, SAB                       |

- **CA** = CA base da classe + soma da CA dos itens do inventário.
- **Dado de Vida** = valor da tabela ± mod de CON. Vida e Sanidade **atuais** são editadas por jogador e Mestre (nunca acima do máximo para o jogador); os **máximos** só pelo Mestre, normalmente pela subida de nível.
- **Dado de Sanidade** = `13 + 1d7 + mod SAB`.
- **Iniciativa** = `1d20 + mod DES` (vai para a ordem de turno).

### Dano Base por nível (1 a 12)

| Classe                     | 1                    | 2     | 3     | 4             | 5      | 6      | 7              | 8      | 9      | 10               | 11     | 12      |
| -------------------------- | -------------------- | ----- | ----- | ------------- | ------ | ------ | -------------- | ------ | ------ | ---------------- | ------ | ------- |
| Sem Classe                 | 1d4                  | 1d4   | 1d4   | 1d6           | 1d6    | 1d6    | 1d8            | 1d8    | 1d8    | 1d10             | 1d10   | 1d10    |
| Arcanista                  | 1d6                  | 1d6   | 1d6+1 | 1d8+1         | 1d8+2  | 1d8+3  | 1d10+3         | 1d10+4 | 1d10+6 | 1d12+6           | 1d20+8 | 1d20+10 |
| Vanguardista               | 1d4+3                | 1d4+4 | 1d4+5 | 1d4+6         | 1d4+7  | 1d6+8  | 1d8+9          | 1d8+10 | 1d8+11 | 1d8+12           | 1d8+13 | 1d8+14  |
| Caçador                    | 2d8                  | 2d8   | 2d8+1 | 2d8+2         | 1d12+2 | 1d12+3 | 1d12+4         | 1d12+5 | 1d12+6 | 1d12+7           | 1d12+8 | 1d12+9  |
| Médium, Rúnico, Liturgista | 1d4                  | 1d4   | 1d4+1 | 1d4+1         | 1d6    | 1d6    | 1d6+1          | 1d6+1  | 1d6+1  | 1d6+2            | 1d6+2  | 1d6+3   |
| Fadador                    | 1d4+2 (níveis 1 a 3) |       |       | 1d6+2 (4 a 6) |        |        | 1d8+2 (7 a 9)  |        |        | 1d10+2 (10 a 12) |        |         |
| Executor                   | 2d8                  | 2d10  | 2d12  | 3d8           | 3d10   | 3d12   | 4d8            | 4d10   | 4d12   | 5d8              | 5d10   | 5d12    |
| Trilhador                  | 1d8+4 (níveis 1 a 6) |       |       |               |        |        | 1d8+5 (7 a 12) |        |        |                  |        |         |

## Subida de nível (só o Mestre)

- Feita pelo modal "Subir de nível" da ficha (botão bloqueado para jogadores). O servidor rola **Dado de Vida** (tabela da classe ± mod CON) e **Dado de Sanidade** (`13 + 1d7 + mod SAB`), soma os resultados na Vida máxima e na Sanidade máxima (e opcionalmente nas atuais) e sobe o nível em 1 (máximo 99). Regras em `buildLevelUpSpec` / `applyLevelUp` (shared), endpoint `POST /characters/:id/level-up`.
- **Campos só do Mestre**: classe, nível, Vida máxima e Sanidade máxima. O servidor recusa (403) qualquer salvamento de jogador que altere esses campos (`touchesGmOnlyFields`).

## Perícias (21)

Valor = mod do atributo + (proficiência se marcada). Teste: `1d20 + valor`.

- **FOR**: Atletismo
- **DES**: Acrobacia, Furtividade, Prestidigitação
- **INT**: Arcanismo, Simbologia, Engenharia, História, Investigação, Religião, Medicina
- **SAB**: Natureza, Adestramento, Intuição, Reconhecer (chave `identificar`), Percepção, Sobrevivência
- **CAR**: Atuação, Enganação, Intimidação, Persuasão

## Habilidades e Reino Interior

Listas com a mesma estrutura: nome, atributo de ataque, dado de dano, dano fixo, atributo de dano, flag "soma Dano Base", flag "soma proficiência no ataque", descrição.

- Ataque = `1d20 [+ mod do atributo de ataque] [+ proficiência]`.
- **Crítico** (20 natural no dado do Ataque): o Dano sai com o valor **máximo possível** (cada dado somado no maior lado, dado subtraído em 1), marcado como "Máximo" no feed e na animação. Regra em `rollSpecRows` (shared).
- Dano = `dado [+ Dano Base] [+ dano fixo] [+ mod do atributo de dano]`.
- Devem ser recalculados quando atributos, nível ou classe mudarem (o Roll20 não fazia isso).
- Formato de texto das habilidades (guia de estilo): `[Alcance: X, efeito/dano, ATRIBUTO, CD opcional]` seguido de descrição curta.

## Combate: bloqueios e Aberturas

- **Bloqueio Firme (CON)**: `1d20 + mod CON`. Sucesso: reduz dano em `floor((nível + CON) / 2)`. Extremo (+20): reduz em `CON + nível` (CON é o valor bruto). Falha: dano normal.
- **Bloqueio Desviante (DES)**: `1d20 + mod DES`. Sucesso: esquiva total. Extremo (+17): esquiva + 1 Abertura. Falha: dano normal, desvantagem em DES e ataques contra você com vantagem no próximo turno.
- **Bloqueio Agressivo (CON)**: `1d20 + mod CON`. Sucesso: anula o dano. Extremo (+17): anula + 2 Aberturas. Falha: 150% do dano e desvantagem em todos os dados no próximo turno.
- **Aberturas** (contador ≥ 0) são gastas em: +1 no dado de ataque (1), ignorar CA do inimigo (1), Contra-ataque (1; teste `1d20 + mod FOR`, resultado natural < 5 perde todas), Gasto avançado (4: dano dobrado e ignora CA no turno).

## Imagens do personagem

Duas imagens distintas, enviadas pelo Mestre (na criação da ficha ou pelo modal "Imagens"):

- **Avatar**: rosto em círculo (o token do Roll20). Usado nos retratos pequenos (biblioteca, feed, cabeçalho) e, no futuro, como token na Arena.
- **Arte**: arte completa do personagem, aberta em "Ver arte completa".

Sem avatar, os retratos usam a arte. Guardadas no storage como assets compartilhados: cada imagem existe uma vez só (pelo conteúdo), regravada em WebP e com uma miniatura de 256 px usada nos retratos pequenos (`avatarKey`/`artKey` no banco; o DTO traz `avatarUrl`/`artUrl` e as miniaturas `avatarThumbUrl`/`artThumbUrl`).

## Inventário e Traços

- Item: nome, quantidade, CA (bônus), peso em gramas, descrição. Peso atual = soma dos pesos dos itens, sem multiplicar pela quantidade (decisão do mestre, igual ao Roll20). Peso máximo é manual.
- Traços: nome + descrição; passivos e narrativos, podem ter limites ("1x por descanso longo").
- **Mostrar na mesa** (ping): jogador com acesso ou Mestre manda um traço ou item da ficha salva para o histórico de rolagens; a mesa toda vê um cartão com nome, descrição e, no item, Qtd., peso e CA.

## Alinhamentos e Caminhos

- Alinhamentos: Arcana (matéria/elementos), Anima (alma/emoção), Lux (criação), Nox (destruição).
- Caminhos do Meio: Onírico (Arcana+Anima), Entropia (Lux+Nox), Vodu (Arcana+Nox), Bênção (Anima+Lux), Anátema (Anima+Nox, valor legado `Morte`), Talismã (Arcana+Lux, valor legado `Vida`).
- **Alma de Marcado**: uma vez por rodada os Marcados escolhem um traço para compartilhar até o fim da cena (1x por descanso longo); +2 permanente em todos os testes de d20. Implementada como a tag especial `marked` (ver abaixo).

## Arena

Tabuleiro da mesa (estudo completo em `docs/ARENA.md`). O Mestre cria **cenas**, cada uma com um mapa (imagem até 60 MB, no máximo 16384 px de lado e 64 megapixels, otimizada em WebP ao enviar), organizadas numa biblioteca com pastas aninhadas (mesma ordem manual da biblioteca de fichas), e escolhe a **cena ativa**, a única que os jogadores veem; ele pode abrir outra cena em prévia sem os jogadores verem. Sem grid por enquanto: tokens têm posição livre em pixels do tabuleiro.

- **Tamanho do tabuleiro** (como no Roll20): o Mestre define largura e altura em **unidades de 70 px** (o quadrado do Roll20) e o mapa se estica para o tabuleiro, sempre na **proporção da imagem** (mudar a largura recalcula a altura e vice-versa). Limites: 5 a 285 unidades de lado. Sem escolha, o tabuleiro tem o tamanho natural da imagem; cena sem mapa tem 25 × 25 unidades e lados livres. Ao mudar o tamanho (ou trocar o mapa), os tokens **continuam no mesmo ponto do mapa** e mantêm o tamanho em px, então ficam maiores ou menores em relação ao mapa. Trocar o mapa mantém a largura do tabuleiro.

- **Tokens**: de ficha (nome e retrato da ficha: avatar, ou a arte) ou de NPC (nome e imagem próprios). Cada token tem tamanho (diâmetro de 40 a 600 px do mapa) e pode ficar **oculto** (só o Mestre vê).
- **Criar tokens**: o Mestre arrasta uma ficha da barra lateral para o mapa (o token nasce onde foi solto), usa "Colocar no mapa" no menu da ficha (centro da vista) ou cria um "Token avulso" de NPC com nome e imagem. Uma ficha pode ter vários tokens na mesma cena.
- **Quem move**: o jogador move os tokens das fichas liberadas para a conta, só na cena ativa e se o token não estiver oculto; o Mestre move qualquer um e é o único que cria, edita, oculta e remove.
- **Vida e sanidade do token**: o token de ficha mostra a vida e a sanidade da ficha (acompanha a ficha, e só se edita nela); o token avulso tem valores próprios, editados pelo Mestre em "Configurar" na barra de seleção. Sem máximo, a barra não aparece.
- **Quem vê o status**: o Mestre; as contas com acesso à ficha do token; e, por token, as contas marcadas em "Quem vê vida e sanidade" ou todos os jogadores ("Todos os jogadores"). A permissão é individual de cada token.
- **Aplicar mudança** (dano e cura): qualquer conta, em qualquer token que ela vê (o jogador só na cena ativa e em tokens visíveis), pelo botão direito no token ou pela tecla M (na seleção). Escolhe a ação (causar dano ou aplicar cura), o atributo (vida ou sanidade) e o valor, de 1 a 999, e opcionalmente o efeito visual (automático pela ação e atributo, ou um da lista, igual para toda a mesa). O dano para em 0 e a cura no máximo (sem máximo, não tem teto); token sem aquele recurso recusa. Com vários tokens selecionados, vale para todos, e tokens da mesma ficha mudam a ficha uma vez só. Quem não vê o status recebe só a animação. Opcionalmente escolhe um **atacante** (o jogador, entre os tokens das fichas que controla; o Mestre, qualquer token da cena, menos os alvos): o atacante voa até o alvo e o impacto toca quando ele chega. Atacante oculto não aparece para os jogadores.
- Excluir a ficha remove os tokens dela; excluir a cena remove os tokens e o mapa.

## Tags especiais (special features)

Mecânicas exclusivas que o Mestre liga em uma ficha pelo item "Tags especiais" do menu da ficha na biblioteca (`PUT /characters/:id/features`, coluna `features` do personagem, gravada sem mexer no `updatedAt`). O catálogo é `SPECIAL_FEATURES` (`packages/shared/src/game/features`): cada tag declara rótulo, descrição e bônus de d20; a UI de cada uma é registrada em `FEATURE_SHEET_SLOTS` (`apps/web/src/modules/features`), com slots opcionais `backdrop` (fundo da ficha), `traitsAddon` (acima dos traços) e `traitsSection` (seção na aba Traços). Nova tag = entrada no catálogo + componentes no registro.

### Marcado (`marked`)

- A seção **Alma de Marcado** só aparece em fichas com a tag; a ficha ganha o selo "Marcado". O símbolo da Marca é a runa Othala (ᛟ); o fundo com o sigilo só aparece enquanto um traço está compartilhado.
- **+2 permanente em todo teste de d20**: atributo, perícia, iniciativa, bloqueios, contra-ataque e o Ataque das habilidades (não entra em Dano, Dano Base, Dado de Vida, Dado de Sanidade nem na subida de nível). `deriveSheet(sheet, { features })` expõe `d20Bonus`; `buildRollSpec(sheet, roll, { features })` soma o termo à expressão (o feed mostra "1d20 + mod + 2"). As perícias exibidas já somam o bônus.
- **Compartilhar traço**: um Marcado (jogador com acesso ou Mestre) escolhe um traço da ficha salva e chama a Marca. Todos os **outros** Marcados recebem o "Chamado da Marca"; qualquer conta com acesso à ficha responde por ela, e o Mestre pode responder por qualquer uma (NPCs). Uma recusa, 60 s sem resposta (`MARKED_ANSWER_TIMEOUT_MS`) ou um Marcado sem ninguém na mesa (nem jogador nem Mestre) fazem falhar. Todos aceitando, o traço (cópia de nome e descrição) aparece na aba Traços de todos os Marcados com o visual da Marca, até quem compartilhou (ou o Mestre) encerrar.
- Só **um** traço da Marca ativo para o grupo (tabela `marked_shares`, uma linha) e só um chamado pendente por vez (em memória no servidor). Tirar a tag ou excluir a ficha cancela o chamado que a envolve e encerra o traço que ela compartilhou.
