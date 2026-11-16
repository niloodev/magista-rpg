/** What is being dragged over the map from outside the board. */
export type ArenaMapDrag = "files" | "character";

export interface UseArenaFileDropProps {
  /** Image files dropped from the computer at a page point (GM with a scene open). */
  onDropFiles?: (files: File[], point: { x: number; y: number }) => void;
  /** A sheet row dropped at a page point (a player placing a token of their sheet). */
  onDropCharacterId?: (characterId: string, point: { x: number; y: number }) => void;
}
