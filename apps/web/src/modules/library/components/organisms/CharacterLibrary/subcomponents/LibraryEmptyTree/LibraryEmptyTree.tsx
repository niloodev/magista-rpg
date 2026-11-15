import { Button, Icon } from "@/shared/components/atoms";

import { EMPTY_LIBRARY_TEXT } from "../../CharacterLibrary.constants";
import type { LibraryEmptyTreeProps } from "./LibraryEmptyTree.types";

export function LibraryEmptyTree({ onNewFolder, onNewCharacter }: LibraryEmptyTreeProps) {
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-white/15 px-6 py-12 text-center">
      <Icon name="folder-open" size={40} aria-hidden="true" className="text-teal-400" />
      <p className="font-sans text-base text-muted-strong">{EMPTY_LIBRARY_TEXT}</p>
      <div className="flex flex-wrap justify-center gap-2">
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
      </div>
    </div>
  );
}
