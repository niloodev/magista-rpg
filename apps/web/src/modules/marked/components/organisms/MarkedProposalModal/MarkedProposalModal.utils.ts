/**
 * DOM id of the "Aceitar" button of one sheet, used to move the focus once the viewer's sheets are known.
 */
export function acceptButtonId(characterId: string): string {
  return `marked-accept-${characterId}`;
}
