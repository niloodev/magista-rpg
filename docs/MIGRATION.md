# Migração Roll20 → Magista

Os personagens serão importados como JSON exportado do Roll20 (nenhum export existe ainda). Regras:

- `Character.legacy` guarda o JSON bruto, intocado. `Character.sheet` guarda a ficha no schema atual, com `sheetVersion`.
- Toda mudança de schema da ficha sobe `CHARACTER_SHEET_VERSION` (`packages/shared`) e ganha uma função de migração `vN → vN+1`.
- Nenhum dado do Roll20 pode ser descartado; o que não tiver campo ainda fica só em `legacy`.
- Campos derivados no Roll20 (`*Mod`, `*CD`, `ca`, `danoBase`, `desloc`, perícias...) não são importados: são recalculados pelas regras de `docs/DOMAIN.md`.

## Mapa de campos (fonte: `index.html` da ficha)

| Roll20                                                                                                                                    | Tipo                                                                                                    | Destino proposto em `sheet`                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `name`                                                                                                                                    | texto (máx 20)                                                                                          | `Character.name`                                                                                                   |
| `class`                                                                                                                                   | select (10 classes, padrão "Sem Classe")                                                                | `identity.class`                                                                                                   |
| `level`                                                                                                                                   | número 1 a 99 (vazio = 1)                                                                               | `identity.level`                                                                                                   |
| `alignment`                                                                                                                               | select (`-`, Arcana, Anima, Lux, Nox, Onírico, Entropia, Vodu, Bênção, `Morte`=Anátema, `Vida`=Talismã) | `identity.alignment` (normalizar `Morte`/`Vida`)                                                                   |
| `variant`                                                                                                                                 | texto                                                                                                   | `identity.alignmentNote`                                                                                           |
| `for`,`con`,`des`,`int`,`sab`,`car`                                                                                                       | número (vazio = 10)                                                                                     | `attributes.<k>.value`                                                                                             |
| `<k>PR`                                                                                                                                   | checkbox `"proficiente"`                                                                                | `attributes.<k>.proficient`                                                                                        |
| `aberturas`                                                                                                                               | número ≥ 0                                                                                              | `combat.openings`                                                                                                  |
| `deslocBonus`                                                                                                                             | checkbox `"1"`                                                                                          | `combat.movementBonus`                                                                                             |
| `hp` / `maxHp`                                                                                                                            | número                                                                                                  | `resources.health.{current,max}`                                                                                   |
| `sn` / `maxSn`                                                                                                                            | número                                                                                                  | `resources.sanity.{current,max}`                                                                                   |
| `<pericia>Prof` (21)                                                                                                                      | checkbox `"proficiente"`                                                                                | `skills.<pericia>.proficient`                                                                                      |
| `pesoMaximo`                                                                                                                              | número (g)                                                                                              | `inventory.maxWeight`                                                                                              |
| `repeating_habs` (`habname`, `habmodS`, `habdado`, `habdamage`, `habhitmodS`, `habbasedamage`="base", `habproficiency`="prof", `habdesc`) | lista                                                                                                   | `abilities[]` `{name, attackAttr, damageDice, damageFlat, damageAttr, addBaseDamage, addProficiency, description}` |
| `repeating_reino` (mesmos campos com prefixo `reino`)                                                                                     | lista                                                                                                   | `innerRealm[]` (mesmo formato)                                                                                     |
| `repeating_inventory` (`invname`, `invquant`, `invca`, `invpeso`, `invdesc`)                                                              | lista                                                                                                   | `inventory.items[]` `{name, quantity, armorBonus, weightGrams, description}`                                       |
| `repeating_tracos` (`traconame`, `tracodesc`)                                                                                             | lista                                                                                                   | `traits[]` `{name, description}`                                                                                   |

Valores `habmodS`/`habhitmodS` vêm como `"-"`, `"forMod"`, `"conMod"`... → mapear para `null` ou a chave do atributo.

## Quirks da ficha Roll20

Mantidos de propósito: 2 (`trunc`) e 8 (peso ignora quantidade). Os demais são bugs a corrigir na nova ficha.


1. Botões de gastar Aberturas nunca funcionaram (`roll_*` não dispara `clicked:`).
2. Modificador usa `trunc` em vez de `floor`.
3. Proficiência e Dano Base só eram calculados ao mudar nível/classe (ficha recém-aberta tinha prof 0).
4. CA podia ficar um passo atrasada (soma assíncrona do inventário).
5. Ataque/dano de Habilidades e Reino não recalculavam quando atributos, nível ou classe mudavam.
6. Ataque/dano eram guardados como texto com números embutidos (ex.: `"1d20 + 3 + 2"`).
7. Perícias dependiam de eventos encadeados e não recalculavam ao abrir a ficha.
8. Peso atual ignora a quantidade do item.
