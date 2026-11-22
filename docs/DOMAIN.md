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

- **Token isométrico** (opcional): variante do avatar só para a Arena, uma imagem com fundo transparente em qualquer proporção (mobs e monstros). No modal "Imagens" o Mestre escolhe o **formato do token** da ficha: avatar redondo ou isométrico (só com a imagem enviada). Criar a ficha já com o token isométrico escolhe esse formato. No mesmo modal, "Mostrar nome do token no mapa" decide se os tokens da ficha mostram o nome aos jogadores: vem **desmarcado em fichas novas** (mobs entram sem nome) e marcado nas que já existiam; mudar aplica também aos tokens da ficha que já estão no mapa, e cada token ainda pode mudar em "Configurar".

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
- **Formato do token**: redondo (o retrato recortado em círculo com anel) ou **isométrico** (a imagem inteira, na proporção dela, sobre uma base no chão; o tamanho vale para o maior lado). O token de ficha segue o formato escolhido na ficha; o token avulso escolhe o próprio na criação ou em "Configurar" (o isométrico precisa de imagem). Em "Configurar" o Mestre também renomeia o token avulso, troca ou remove a imagem dele e, em qualquer token, decide se o nome aparece no mapa para os jogadores.
- **Criar tokens**: o Mestre arrasta uma ficha da barra lateral para o mapa (o token nasce onde foi solto), usa "Colocar no mapa" no menu da ficha (centro da vista) ou cria um "Token avulso" de NPC com nome, imagem e formato. Soltar imagens do computador no mapa cria um token avulso por imagem, no ponto do drop, depois de perguntar o formato (a sugestão é isométrico quando a borda da imagem é transparente).
- **Copiar e colar** (Mestre): Ctrl+C copia os tokens selecionados e Ctrl+V cola as cópias (sob o ponteiro, mantendo a disposição do grupo, ou ao lado dos originais), inclusive em outra cena. A cópia leva imagem, tamanho, visibilidade, formato, a vida e a sanidade do NPC e quem vê o status; a cópia de um token de ficha continua seguindo a ficha.
- **Seleção**: clique seleciona; Shift ou Ctrl somam ou tiram da seleção (clique e caixa).
- **Menu do token** (botão direito, ou Shift+F10): Aplicar mudança (todos), Abrir ficha (quem pode abrir) e, para o Mestre, Configurar, Ocultar ou Mostrar, Copiar, Colar aqui e Remover. Age sobre a seleção; o token clicado fora dela passa a ser a seleção. Uma ficha pode ter vários tokens na mesma cena.
- **Quem move**: o jogador move os tokens das fichas liberadas para a conta, só na cena ativa e se o token não estiver oculto; o Mestre move qualquer um e é o único que edita e oculta; remover vale para o Mestre (qualquer token) e para o jogador (os tokens que ele controla, pelo menu do token ou Delete, com confirmação). O jogador controla todas as fichas liberadas para a conta, então um token que o Mestre põe no mapa já se move na hora.
- **Jogador põe os próprios tokens**: na cena ativa, o jogador coloca quantos tokens quiser das fichas liberadas para ele, arrastando a ficha da barra lateral para o mapa ou por "Colocar no mapa" no menu dela; o token nasce visível. NPCs continuam só com o Mestre.
- **Vida e sanidade do token**: o token de ficha mostra a vida e a sanidade da ficha (acompanha a ficha, e só se edita nela); o token avulso tem valores próprios, editados pelo Mestre em "Configurar" no menu do token (botão direito ou Shift+F10). Sem máximo, a barra não aparece.
- **Quem vê o status**: o Mestre; as contas com acesso à ficha do token; e, por token, as contas marcadas em "Quem vê vida e sanidade" ou todos os jogadores ("Todos os jogadores"). A permissão é individual de cada token.
- **Aplicar mudança** (dano e cura): qualquer conta, em qualquer token que ela vê (o jogador só na cena ativa e em tokens visíveis), pelo botão direito no token ou pela tecla M (na seleção). Escolhe a ação (causar dano ou aplicar cura), o atributo (vida ou sanidade) e o valor, de 1 a 999, e opcionalmente o efeito visual (automático pela ação e atributo, ou um da lista, igual para toda a mesa). O dano para em 0 e a cura no máximo (sem máximo, não tem teto); token sem aquele recurso recusa. Com vários tokens selecionados, vale para todos, e tokens da mesma ficha mudam a ficha uma vez só. Quem não vê o status recebe só a animação. Opcionalmente escolhe um **atacante** (o jogador, entre os tokens das fichas que controla; o Mestre, qualquer token da cena, menos os alvos; para o jogador o menu já abre com o primeiro token dele marcado, e "Ninguém" desmarca): o atacante voa até o alvo e o impacto toca quando ele chega. Atacante oculto não aparece para os jogadores. As barras de vida e sanidade mudam no momento do impacto da animação (a chegada do atacante, ou o golpe das Ultimates), não antes.
- **Animações da ficha**: cada ficha escolhe, no botão "Animações" do cabeçalho (jogador com acesso e Mestre), o efeito de dano e de cura na vida e na sanidade. Com o efeito em "Automático" no Aplicar mudança, vale a escolha da ficha do **atacante**; sem atacante, com atacante avulso ou sem escolha, vale o padrão da ação (Golpe, Fissura, Brasa viva, Clareza).
- **Efeitos livres**: Magia completamente normal mágica (um tiro de arma), Golpe Floral e Conjuração Floral, Ataque Vodu e Conjuração Vodu, Colapso da Geometria Não Euclidiana, Vox Populi (o feitiço da Marion), Vitae Unius (o do Tony), Entropia e Poema (o da Selvarin), Reencarnação da Morte (o do Talis), Pazada e Sugada Espiritual (o Lorcan do Talis), Entre os mundos e Fluxo do passar (o Antropozohl, vilão) não têm ação padrão; quem aplica (ou a ficha, nas Animações) decide para que usar.
- **Ultimates**: a classificação dos feitiços de assinatura de um personagem, as maiores animações (tomam a tela inteira). Hoje: Vox Populi (Marion), Vitae Unius (Tony), Entropia e Poema (Selvarin) e Reencarnação da Morte (Talis), Chamado Divino (Heylel, Lux, de cura e de dano) e Entre os mundos (Antropozohl, o Deus das Passagens, vilão de Arcana).
- **Ordem de turnos** (como o "Turn Order" do Roll20): uma por cena, cada token é um turno (cada goblin entra separado). Rolar **Iniciativa na ficha** põe na ordem, quando o resultado aparece para a mesa, todos os tokens daquela ficha na cena ativa (ou atualiza o valor deles); sem token na cena, a rolagem fica só no feed. No menu do token, **Rolar iniciativa** rola cada token selecionado: o de ficha é uma rolagem normal da Iniciativa da ficha (aparece no feed da mesa, como rolada da ficha) que vale só para aquele token; o avulso rola `1d20 + bônus de iniciativa` (campo do "Configurar", de -20 a 20) em segredo (sem cartão no feed, só o valor na ordem, que todos veem). O token de ficha que a mesa não vê (oculto, sem nome no mapa ou numa cena que não está no ar) também rola em segredo, com a Iniciativa da ficha, para o feed não revelar o token. O bônus de iniciativa do avulso é público (vai no token para todos). Rolar Iniciativa na ficha sempre vale, mesmo para quem já tem valor: é a forma de rolar de novo, e aparece no feed para todos. Em todos os casos o valor só entra na ordem quando os dados revelam; até lá a linha do token aparece na janela de turnos com o número girando. O jogador rola pelo menu só os tokens dele que ainda não têm valor (para rolar de novo, a ficha); um token que está rolando não rola de novo até revelar. O Mestre também usa **Adicionar à iniciativa** (entra sem valor) e **Remover da iniciativa**. Quem tem valor entra na posição pela iniciativa, do maior para o menor (empate: quem entrou antes fica na frente); o Mestre ainda arrasta para reordenar, edita o valor, ordena de novo, passa a vez para alguém e limpa a ordem (com confirmação; a rodada volta para 1).
- **Turno e rodada**: a ordem começa quando o Mestre aperta "Começar" (a vez vai para o primeiro). "Próximo turno" passa do último para o primeiro e soma 1 na rodada; "Turno anterior" volta. O jogador encerra o turno quando a vez é de um token que ele controla. Remover o token da vez (da ordem ou do mapa) passa a vez para o próximo. O token da vez flutua um pouco no mapa sobre um anel suave de energia rubi, de onde a energia sai devagar para fora.
- **Quem vê a ordem**: o Mestre vê a da cena que está vendo, com todos; os jogadores veem a da cena ativa, sem os tokens ocultos (se a vez é de um oculto, ninguém aparece com a vez para eles).
- Excluir a ficha remove os tokens dela; excluir a cena remove os tokens e o mapa.
- **Mapa Mundi**: o mapa de Namor, fixo no app (não é uma cena da biblioteca). O Mestre o abre em prévia pela linha "Mapa Mundi" no topo da aba Mapas e o coloca no ar no lugar da cena ativa, que fica guardada ("Voltar à cena" no menu da linha a devolve; colocar qualquer cena no ar também tira o mundo do ar). Em volta do mapa, no lugar do preto, há nuvens vivas.
- **Token do grupo**: o Mapa Mundi tem um token só, fixo, que representa a party (não aceita outros tokens, nem de ficha nem avulsos): a runa Othala estilizada, trocando de cor entre as cores dos jogadores (azul escuro, azul claro, verde, rosa, roxo, cinza, verde escuro). Qualquer jogador o move enquanto o mundo está no ar; o Mestre sempre.
- **Névoa do Mapa Mundi**: o Mestre esconde com nuvens as regiões que os jogadores ainda não conhecem, pintando com um pincel ("Esconder" e "Revelar", com raio de 10 a 400 px do mapa; a borda do pincel é irregular, em lóbulos como as nuvens das bordas do mapa, e não um círculo) ou cobrindo e limpando o mapa inteiro (com confirmação). Esconder e revelar são animados (as nuvens crescem sobre a região ou se abrem dela). O Mestre vê a névoa translúcida, ou como os jogadores com "Ver como os jogadores".
- **Troca de mapa** (só para os jogadores; o Mestre troca na hora): a câmera voa pelas nuvens em toda troca (entre duas cenas, sobe de uma e desce na outra). Trocas rápidas não cortam o voo: ele continua e pousa no mapa mais novo. Ao entrar no mundo, só se afasta (sobe da cena, atravessa as nuvens e vê o mundo inteiro, saindo de perto do token do grupo); ao sair, só se aproxima (mergulha no token do grupo, atravessa as nuvens e desce sobre a cena).

## Tags especiais (special features)

Mecânicas exclusivas que o Mestre liga em uma ficha pelo item "Tags especiais" do menu da ficha na biblioteca (`PUT /characters/:id/features`, coluna `features` do personagem, gravada sem mexer no `updatedAt`). O catálogo é `SPECIAL_FEATURES` (`packages/shared/src/game/features`): cada tag declara rótulo, descrição e bônus de d20; a UI de cada uma é registrada em `FEATURE_SHEET_SLOTS` (`apps/web/src/modules/features`), com slots opcionais `backdrop` (fundo da ficha), `traitsAddon` (acima dos traços) e `traitsSection` (seção na aba Traços). Nova tag = entrada no catálogo + componentes no registro.

### Marcado (`marked`)

- A seção **Alma de Marcado** só aparece em fichas com a tag; a ficha ganha o selo "Marcado". O símbolo da Marca é a runa Othala (ᛟ); o fundo com o sigilo só aparece enquanto um traço está compartilhado.
- **+2 permanente em todo teste de d20**: atributo, perícia, iniciativa, bloqueios, contra-ataque e o Ataque das habilidades (não entra em Dano, Dano Base, Dado de Vida, Dado de Sanidade nem na subida de nível). `deriveSheet(sheet, { features })` expõe `d20Bonus`; `buildRollSpec(sheet, roll, { features })` soma o termo à expressão (o feed mostra "1d20 + mod + 2"). As perícias exibidas já somam o bônus.
- **Compartilhar traço**: um Marcado (jogador com acesso ou Mestre) escolhe um traço da ficha salva e chama a Marca. Todos os **outros** Marcados recebem o "Chamado da Marca"; qualquer conta com acesso à ficha responde por ela, e o Mestre pode responder por qualquer uma (NPCs). Uma recusa, 60 s sem resposta (`MARKED_ANSWER_TIMEOUT_MS`) ou um Marcado sem ninguém na mesa (nem jogador nem Mestre) fazem falhar. Todos aceitando, o traço (cópia de nome e descrição) aparece na aba Traços de todos os Marcados com o visual da Marca, até quem compartilhou (ou o Mestre) encerrar.
- Só **um** traço da Marca ativo para o grupo (tabela `marked_shares`, uma linha) e só um chamado pendente por vez (em memória no servidor). Tirar a tag ou excluir a ficha cancela o chamado que a envolve e encerra o traço que ela compartilhou.
