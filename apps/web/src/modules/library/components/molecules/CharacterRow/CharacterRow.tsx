import Link from "next/link";

import { Avatar, Icon } from "@/shared/components/atoms";

import { DropIndicator } from "../DropIndicator";
import { NO_ACCESS_LABEL } from "./CharacterRow.constants";
import type { CharacterRowProps } from "./CharacterRow.types";

export function CharacterRow({
  name,
  subtitle,
  href,
  portraitUrl,
  path,
  accountLabels,
  actions,
  handle,
  dropPosition = null,
  dimmed = false,
}: CharacterRowProps) {
  return (
    <div
      className={`group relative flex min-h-16 items-center gap-3 border border-white/10 bg-gradient-to-r from-void-700/70 to-black/50 py-2 pr-2 pl-2 transition-[border-color,background-color,opacity] duration-200 focus-within:z-20 focus-within:border-primary/60 hover:border-primary/50 hover:from-void-700 ${dimmed ? "opacity-40" : ""}`}
    >
      {dropPosition && dropPosition !== "inside" && <DropIndicator position={dropPosition} />}
      {handle}
      <Avatar src={portraitUrl} name={name} size="sm" decorative />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-serif text-base tracking-wide text-foreground">
          <Link
            href={href}
            draggable={false}
            className="after:absolute after:inset-0 after:z-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ruby-400 focus-visible:after:outline-solid"
          >
            {name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-3 font-sans text-xs text-muted-strong">
          <span className="font-semibold tracking-wider uppercase">{subtitle}</span>
          {path && (
            <span className="flex items-center gap-1">
              <Icon name="folder" size={12} aria-hidden="true" />
              {path}
            </span>
          )}
        </p>
      </div>
      {accountLabels && (
        <div className="hidden max-w-[45%] flex-wrap justify-end gap-1.5 sm:flex">
          <span className="sr-only">Jogadores com acesso:</span>
          {accountLabels.length === 0 ? (
            <span className="font-sans text-xs text-muted-strong italic">{NO_ACCESS_LABEL}</span>
          ) : (
            accountLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 border border-teal-500/40 bg-teal-900/40 px-2 py-0.5 font-sans text-xs text-foreground"
              >
                <Icon name="key-round" size={12} aria-hidden="true" className="text-teal-400" />
                {label}
              </span>
            ))
          )}
        </div>
      )}
      {actions && <div className="relative z-10">{actions}</div>}
    </div>
  );
}
