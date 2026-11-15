import type { IPresenceMember } from "@magista/shared";

/**
 * True when two presence lists have the same people in the same order (a repeated update changes nothing).
 */
export function sameMembers(a: IPresenceMember[], b: IPresenceMember[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (member, index) =>
        member.accountId === b[index]?.accountId &&
        member.login === b[index]?.login &&
        member.role === b[index]?.role,
    )
  );
}
