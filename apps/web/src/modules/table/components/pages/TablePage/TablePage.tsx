"use client";

import { Button, Icon, Text } from "@/shared/components/atoms";
import { PresencePanel } from "@/modules/table/components/organisms";

import { useTablePage } from "./TablePage.hook";

export function TablePage() {
  const { displayName, isGm, status, members, leaving, onLogout } = useTablePage();
  return (
    <main className="min-h-screen bg-void-900 px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <Text variant="micro">{isGm ? "Mestre da mesa" : "Ficha do jogador"}</Text>
            <Text variant="h2">{displayName}</Text>
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
        <PresencePanel status={status} members={members} />
        <Text variant="lore">A ficha, o chat e as rolagens chegam nas próximas etapas.</Text>
      </div>
    </main>
  );
}
