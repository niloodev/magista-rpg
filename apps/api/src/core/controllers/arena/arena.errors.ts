import { ARENA_SCENE_NOT_FOUND_MESSAGE } from "@magista/shared";

export const arenaErrors = {
  gmOnly: "Somente o Mestre pode fazer isso.",
  sceneNotFound: ARENA_SCENE_NOT_FOUND_MESSAGE,
  tokenNotFound: "Token não encontrado.",
  characterNotFound: "Personagem não encontrado.",
  forbidden: "Você não controla este token.",
  invalidName: "Informe um nome de até 60 caracteres.",
  invalidToken: "Dados do token inválidos.",
  invalidMove: "Posição inválida.",
  invalidScene: "Cena inválida.",
  invalidBoard: "Informe um tamanho de tabuleiro entre 5 e 285 unidades de lado.",
  npcOnly: "Só tokens sem ficha têm imagem própria.",
  folderNotFound: "Pasta não encontrada.",
  invalidFolderMove: "Uma pasta não pode ir para dentro dela mesma.",
  tokenImageTooBig: "A imagem do token passa de 4096 px de lado. Reduza e envie de novo.",
  mapTooBig:
    "O mapa passa de 16384 px de lado ou de 64 megapixels. Reduza a imagem e envie de novo.",
  characterName: "O nome de um token de ficha vem da própria ficha.",
  characterStatus: "A vida e a sanidade de um token de ficha vêm da própria ficha.",
  invalidViewers: "Escolha apenas contas de jogador.",
  invalidChange: "Informe um valor entre 1 e 999.",
  noHealth: "Este token não tem vida definida.",
  noSanity: "Este token não tem sanidade definida.",
  invalidAttacker: "Escolha como atacante um token seu que esteja nesta cena.",
  imageMissing: "Escolha uma imagem para enviar.",
  imageInvalid: "Envie uma imagem PNG, JPG, WEBP ou GIF.",
  mapTooLarge: "O mapa passa do limite de 60 MB.",
  imageTooLarge: "A imagem passa do limite de 8 MB.",
  unexpected: "Não foi possível acessar a Arena agora. Tente novamente.",
} as const;

type ArenaErrorKey = keyof typeof arenaErrors;

export type ArenaError = (typeof arenaErrors)[ArenaErrorKey];
