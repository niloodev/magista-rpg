import type { PresenceMemberProps } from "./PresenceMember.types";

export function PresenceMember({ member }: PresenceMemberProps) {
  const isGm = member.role === "GM";
  return (
    <li className="flex items-center justify-between border border-border/30 bg-black/40 px-4 py-2 font-sans text-sm">
      <span className="text-foreground">{member.characterName ?? member.login}</span>
      <span
        className={`font-sans text-[9px] font-bold tracking-[0.2em] uppercase ${isGm ? "text-teal-400" : "text-primary"}`}
      >
        {isGm ? "Mestre" : "Jogador"}
      </span>
    </li>
  );
}
