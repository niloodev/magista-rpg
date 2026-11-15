"use client";

import { SharedTraitEntry } from "@/modules/marked/components/molecules";
import { useMarkedShare } from "@/modules/marked/hooks";
import { MARKED_TEXTS, STOP_LABEL } from "@/modules/marked/marked.constants";
import { Text } from "@/shared/components/atoms";
import { ConfirmDialog } from "@/shared/components/molecules";

import type { MarkedSharedTraitProps } from "./MarkedSharedTrait.types";

export function MarkedSharedTrait({ characterId }: MarkedSharedTraitProps) {
  const { share, canStop, stopError, confirming, requestStop, cancelStop, confirmStop } =
    useMarkedShare(characterId);
  if (!share) return null;
  return (
    <div className="mb-4 flex flex-col gap-2">
      <SharedTraitEntry share={share} canStop={canStop} onStop={requestStop} />
      {stopError && (
        <Text variant="body" role="alert" className="text-error">
          {stopError}
        </Text>
      )}
      <ConfirmDialog
        open={confirming}
        title={MARKED_TEXTS.stopConfirmTitle}
        message={MARKED_TEXTS.stopConfirmMessage}
        confirmLabel={STOP_LABEL}
        onConfirm={confirmStop}
        onCancel={cancelStop}
      />
    </div>
  );
}
