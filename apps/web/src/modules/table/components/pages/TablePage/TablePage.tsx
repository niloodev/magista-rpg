"use client";

import { CharacterLibrary } from "@/modules/library/components";
import { PresencePanel, RollFeed } from "@/modules/table/components/organisms";
import { TABLE_TITLES } from "@/modules/table/table.constants";
import { Button, Icon, Text } from "@/shared/components/atoms";

import { useTablePage } from "./TablePage.hook";

export function TablePage() {
  const {
    displayName,
    isGm,
    status,
    members,
    presenceLoadingRows,
    rolls,
    rollsLoading,
    leaving,
    onLogout,
  } = useTablePage();
  return (
    <main className="min-h-screen bg-void-900 px-4 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <Text variant="micro">{isGm ? TABLE_TITLES.gm : TABLE_TITLES.player}</Text>
            <Text variant="h2" as="h1">
              {displayName}
            </Text>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onLogout}
            loading={leaving}
            icon={<Icon name="log-out" size={12} />}
          >
            Sair
          </Button>
        </header>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-6">
            <CharacterLibrary />
            <PresencePanel status={status} members={members} loadingRows={presenceLoadingRows} />
          </div>
          <RollFeed rolls={rolls} loading={rollsLoading} className="max-h-[75vh]" />
        </div>
      </div>
    </main>
  );
}
