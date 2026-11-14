import type { PresenceMemberProps } from "./PresenceMember.types";

export function PresenceMember({ member }: PresenceMemberProps) {
  const isGm = member.role === "GM";
  return (
    <li className="flex items-center justify-between border border-border/30 bg-black/40 px-4 py-2 font-sans text-sm">
      <span className="text-foreground">{member.login}</span>
      <span
        className={`font-sans text-xs font-bold tracking-[0.15em] uppercase ${isGm ? "text-teal-400" : "text-accent-text"}`}
      >
        {isGm ? "Mestre" : "Jogador"}
      </span>
    </li>
  );
}
