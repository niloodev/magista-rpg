/**
 * Room that holds every socket of one account, used to force logout.
 */
export function accountRoom(accountId: string): string {
  return `account:${accountId}`;
}
