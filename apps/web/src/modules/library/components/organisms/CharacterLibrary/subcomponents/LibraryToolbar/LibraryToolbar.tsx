import { SEARCH_PLACEHOLDER } from "@/modules/library/library.constants";
import { Button, Icon, Input } from "@/shared/components/atoms";

import type { LibraryToolbarProps } from "./LibraryToolbar.types";

export function LibraryToolbar({
  isGm,
  query,
  onQueryChange,
  searchRef,
  resultLabel,
  onNewFolder,
  onNewCharacter,
  onAccounts,
}: LibraryToolbarProps) {
  return (
    <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
      <div className="relative flex-1">
        <Icon
          name="search"
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-strong"
        />
        <Input
          ref={searchRef}
          type="search"
          role="searchbox"
          aria-label="Buscar ficha pelo nome"
          aria-keyshortcuts="/"
          placeholder={SEARCH_PLACEHOLDER}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="pl-10"
        />
      </div>
      <p aria-live="polite" className="sr-only">
        {resultLabel}
      </p>
      {isGm && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewFolder}
            icon={<Icon name="folder-plus" size={14} />}
          >
            Nova pasta
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewCharacter}
            icon={<Icon name="file-plus" size={14} />}
          >
            Nova ficha
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAccounts}
            icon={<Icon name="users" size={14} />}
          >
            Contas
          </Button>
        </div>
      )}
    </div>
  );
}
