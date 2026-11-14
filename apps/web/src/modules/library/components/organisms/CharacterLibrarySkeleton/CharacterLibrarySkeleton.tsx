"use client";

import { LibraryRowsSkeleton } from "@/modules/library/components/molecules";
import { SEARCH_PLACEHOLDER } from "@/modules/library/library.constants";
import { Icon, Input, Skeleton, Text } from "@/shared/components/atoms";
import { ButtonSkeleton, Panel } from "@/shared/components/molecules";

import { useCharacterLibrarySkeleton } from "./CharacterLibrarySkeleton.hook";
import type { CharacterLibrarySkeletonProps } from "./CharacterLibrarySkeleton.types";

/**
 * Placeholder of the whole `CharacterLibrary` panel while the session loads. With a known role (last session
 * on this device) it shows the real title, toolbar and tree or list; the search box is the real `Input`,
 * inert. Rows follow the last library loaded here.
 */
export function CharacterLibrarySkeleton(props: CharacterLibrarySkeletonProps) {
  const { gm = false } = props;
  const { shape, title, titleSample, countSample } = useCharacterLibrarySkeleton(props);
  return (
    <Panel variant="inner" className="@container p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Icon name="scroll-text" size={14} aria-hidden="true" className="text-primary" />
          <Text variant="h3" as="p">
            {title ?? (
              <Skeleton shape="glyphs" tone="ruby">
                {titleSample}
              </Skeleton>
            )}
          </Text>
        </div>
        <span className="font-sans text-xs">
          <Skeleton shape="glyphs">{countSample}</Skeleton>
        </span>
      </div>
      <div className="flex flex-col gap-6">
        <div inert className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-strong"
            />
            <Input
              type="search"
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              placeholder={SEARCH_PLACEHOLDER}
              className="pl-10"
            />
          </div>
          {gm && (
            <div className="flex flex-wrap gap-2">
              <ButtonSkeleton label="Nova pasta" size="sm" icon="folder-plus" />
              <ButtonSkeleton label="Nova ficha" size="sm" variant="primary" icon="file-plus" />
              <ButtonSkeleton label="Contas" size="sm" variant="ghost" icon="users" />
            </div>
          )}
        </div>
        <LibraryRowsSkeleton shape={shape} tree={gm} announce={false} />
      </div>
    </Panel>
  );
}
