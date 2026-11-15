"use client";

import { CharacterLibrary } from "@/modules/library/components";
import { ProfileDialog } from "@/modules/profile/components";
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
    profileOpen,
    onOpenProfile,
    onCloseProfile,
  } = useTablePage();
  return (
    <main className="min-h-screen bg-void-900 px-4 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0 break-words">
            <Text variant="micro">{isGm ? TABLE_TITLES.gm : TABLE_TITLES.player}</Text>
            <Text variant="h2" as="h1">
              {displayName}
            </Text>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenProfile}
              icon={<Icon name="user" size={12} />}
            >
              <span className="max-sm:sr-only">Perfil</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onLogout}
              loading={leaving}
              icon={<Icon name="log-out" size={12} />}
            >
              <span className="max-sm:sr-only">Sair</span>
            </Button>
          </div>
        </header>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-6">
            <CharacterLibrary className="relative z-10" />
            <PresencePanel status={status} members={members} loadingRows={presenceLoadingRows} />
          </div>
          <RollFeed rolls={rolls} loading={rollsLoading} className="max-h-[75vh]" />
        </div>
      </div>
      <ProfileDialog open={profileOpen} onClose={onCloseProfile} />
    </main>
  );
}
