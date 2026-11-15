# Migração Roll20 → Magista

Os personagens serão importados como JSON exportado do Roll20 (nenhum export existe ainda). Regras:

- `Character.legacy` guarda o JSON bruto, intocado. `Character.sheet` guarda a ficha no schema atual, com `sheetVersion`.
- Toda mudança de schema da ficha sobe `CHARACTER_SHEET_VERSION` (`packages/shared`) e ganha uma função de migração `vN → vN+1`.
- Nenhum dado do Roll20 pode ser descartado; o que não tiver campo ainda fica só em `legacy`.
- Campos derivados no Roll20 (`*Mod`, `*CD`, `ca`, `danoBase`, `desloc`, perícias...) não são importados: são recalculados pelas regras de `docs/DOMAIN.md`.

## Páginas (mapas da Arena)

`npm run import:roll20-pages -- "<pasta pages do export>" [--folder "Roll20"] [--only 2,12,57] [--folders nomes.json] [--folders-template] [--force]` (entry `apps/api/src/cli/importRoll20Pages`, chama o controller da Arena como Mestre; utilitários puros com testes).

- Cada subpasta (`NNN - Nome`) tem `page.json`; o mapa é a maior imagem da camada `map`, lida de `graphics/<id>.*`. O tabuleiro fica com a largura em que a imagem estava na página (a altura segue a proporção); página sem mapa vira cena vazia com o tamanho da página (unidades × 70).
- Pastas: o `path` de cada página traz os ids das pastas do Roll20 (o export não traz os nomes). A árvore é recriada igual dentro da pasta `--folder` (padrão "Roll20"); o nome sai das palavras que todas as páginas da pasta compartilham, ou "Pasta N (primeira página)". `--folders-template` imprime um JSON `{ "<id>": "nome" }` (e, no stderr, as páginas de cada pasta) para corrigir os nomes e passar em `--folders`.
- Nomes repetidos na mesma pasta ganham " (2)". Cena já existente na pasta é pulada (ou tem mapa e tamanho regravados com `--force`). Mapa recusado (mais de 60 MB ou 16384 px) não deixa cena vazia.
- Tokens não são importados.

## Importador

`npm run import:roll20 -- "<pasta>" [--force]` (entry `apps/api/src/cli/importRoll20`, regra em `core/controllers/importer` e conversão pura em `core/services/roll20`, com testes).

- Cada subpasta precisa de `character.json`; `token.*` vira o **avatar** e `avatar.*` vira a **arte** do personagem, enviados ao storage de imagens (chaves `characters/<id>/<avatar|art>-<uuid>.<ext>`, tipo conferido pelos bytes). Imagens da antiga `MEDIA_DIR` sobem uma vez com `npm run media:migrate-local` (chaves `legacy/...`).
- Conta nova: login = nome do personagem, senha gerada e mostrada uma única vez. Conta existente: senha nunca é alterada.
- A ficha importada recebe acesso da conta (`character_access`). Se a conta já tem uma ficha liberada com o mesmo nome, ela é pulada (ou sobrescrita com `--force`); senão uma nova ficha é criada na raiz da biblioteca.
- Personagem já existente é ignorado, a menos que `--force` (sobrescreve a ficha, mantém a conta).
- Nome igual ao de uma conta de Mestre é recusado.

## Mapa de campos (export do Roll20 → `characterSheetSchema` v1)

| Roll20                          | Tipo                  | Destino em `sheet`                                                                                                               |
| ------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `name`                          | texto                 | `Character.name` (e login da conta)                                                                                              |
| `class`                         | select                | `identity.class` (slug: "Caçador" → `cacador`; ausente → `sem-classe`)                                                           |
| `level`                         | número                | `identity.level` (1 a 99, vazio → 1)                                                                                             |
| `alignment`                     | select                | `identity.alignment` (`Morte` → `anatema`, `Vida` → `talisma`, `-` → null)                                                       |
| `variant`                       | texto                 | `identity.alignmentNote`                                                                                                         |
| `for` ... `car`                 | número (vazio = null) | `attributes.<k>.value`                                                                                                           |
| `<k>PR`                         | `"proficiente"`       | `attributes.<k>.proficient`                                                                                                      |
| `<pericia>Prof` (21)            | `"proficiente"`       | `skills.<pericia>.proficient`                                                                                                    |
| `hp` / `maxHp`, `sn` / `maxSn`  | número                | `resources.health`, `resources.sanity` `{current, max}`                                                                          |
| `aberturas`                     | número                | `combat.openings` (mínimo 0)                                                                                                     |
| `deslocBonus`                   | `"1"`                 | `combat.movementBonus`                                                                                                           |
| `pesoMaximo`                    | número (g)            | `inventory.maxWeightGrams`                                                                                                       |
| `repeating_habs_<id>_hab*`      | lista                 | `abilities[]` `{id, name, attackAttribute, damageDice, damageFlat, damageAttribute, addBaseDamage, addProficiency, description}` |
| `repeating_reino_<id>_reino*`   | lista                 | `innerRealm[]` (mesmo formato)                                                                                                   |
| `repeating_inventory_<id>_inv*` | lista                 | `inventory.items[]` `{id, name, quantity, armorBonus, weightGrams, description}`                                                 |
| `repeating_tracos_<id>_traco*`  | lista                 | `traits[]` `{id, name, description}`                                                                                             |

- `id` das linhas preserva o id da linha no Roll20; a ordem respeita `_reporder_repeating_<secao>` quando existe.
- `habmodS`/`habhitmodS` (`"forMod"`, `"-"`...) viram a chave do atributo ou null.
- Ignorados por serem derivados: `*Mod`, `*ModS`, `*CD`, `ca`, `caBonus`, `prof`, `profText`, `danoBase`, `desloc`, `dadoDeVida`, `pesoAtual`, valores das perícias, `habattackvalue`, `habdamagevalue` (o Roll20 guardava alguns desatualizados).
- O JSON inteiro fica em `Character.legacy`.

## Quirks da ficha Roll20

Mantidos de propósito: 2 (`trunc`) e 8 (peso ignora quantidade). Os demais foram corrigidos na ficha v1: Aberturas funcionam, tudo é recalculado a cada mudança por `deriveSheet`, ataque/dano são montados na hora da rolagem.

1. Botões de gastar Aberturas nunca funcionaram (`roll_*` não dispara `clicked:`).
2. Modificador usa `trunc` em vez de `floor`.
3. Proficiência e Dano Base só eram calculados ao mudar nível/classe (ficha recém-aberta tinha prof 0).
4. CA podia ficar um passo atrasada (soma assíncrona do inventário).
5. Ataque/dano de Habilidades e Reino não recalculavam quando atributos, nível ou classe mudavam.
6. Ataque/dano eram guardados como texto com números embutidos (ex.: `"1d20 + 3 + 2"`).
7. Perícias dependiam de eventos encadeados e não recalculavam ao abrir a ficha.
8. Peso atual ignora a quantidade do item.
