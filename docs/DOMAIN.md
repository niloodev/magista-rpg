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
- Dano = `dado [+ Dano Base] [+ dano fixo] [+ mod do atributo de dano]`.
- Devem ser recalculados quando atributos, nível ou classe mudarem (o Roll20 não fazia isso).
- Formato de texto das habilidades (guia de estilo): `[Alcance: X, efeito/dano, ATRIBUTO, CD opcional]` seguido de descrição curta.

## Combate: bloqueios e Aberturas

- **Bloqueio Firme (CON)**: `1d20 + mod CON`. Sucesso: reduz dano em `floor((nível + CON) / 2)`. Extremo (+20): reduz em `CON + nível` (CON é o valor bruto). Falha: dano normal.
- **Bloqueio Desviante (DES)**: `1d20 + mod DES`. Sucesso: esquiva total. Extremo (+17): esquiva + 1 Abertura. Falha: dano normal, desvantagem em DES e ataques contra você com vantagem no próximo turno.
- **Bloqueio Agressivo (CON)**: `1d20 + mod CON`. Sucesso: anula o dano. Extremo (+17): anula + 2 Aberturas. Falha: 150% do dano e desvantagem em todos os dados no próximo turno.
- **Aberturas** (contador ≥ 0) são gastas em: +1 no dado de ataque (1), ignorar CA do inimigo (1), Contra-ataque (1; teste `1d20 + mod FOR`, resultado natural < 5 perde todas), Gasto avançado (4: dano dobrado e ignora CA no turno).

## Inventário e Traços

- Item: nome, quantidade, CA (bônus), peso em gramas, descrição. Peso atual = soma dos pesos dos itens, sem multiplicar pela quantidade (decisão do mestre, igual ao Roll20). Peso máximo é manual.
- Traços: nome + descrição; passivos e narrativos, podem ter limites ("1x por descanso longo").

## Alinhamentos e Caminhos

- Alinhamentos: Arcana (matéria/elementos), Anima (alma/emoção), Lux (criação), Nox (destruição).
- Caminhos do Meio: Onírico (Arcana+Anima), Entropia (Lux+Nox), Vodu (Arcana+Nox), Bênção (Anima+Lux), Anátema (Anima+Nox, valor legado `Morte`), Talismã (Arcana+Lux, valor legado `Vida`).
- **Alma de Marcado**: uma vez por rodada os Marcados escolhem um traço para compartilhar até o fim da cena (1x por descanso longo); +2 em todas as ações enquanto a Marca está ativa.
