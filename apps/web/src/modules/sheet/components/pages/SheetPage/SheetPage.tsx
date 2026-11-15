"use client";

import Link from "next/link";

import { FeatureSlots } from "@/modules/features/components";
import {
  AbilitiesPanel,
  AttributesPanel,
  CombatPanel,
  InventoryPanel,
  LevelUpModal,
  SheetHeader,
  SheetSkeleton,
  SheetSummaryBar,
  SkillsPanel,
  TraitsPanel,
  VitalsPanel,
} from "@/modules/sheet/components/organisms";
import { SHEET_MAIN_CLASSES, SHEET_TABS } from "@/modules/sheet/sheet.constants";
import { DiceRollOverlay, RollFeed } from "@/modules/table/components/organisms";
import { Text } from "@/shared/components/atoms";
import { TabPanel, Tabs } from "@/shared/components/molecules";

import { SHEET_TABS_ID } from "./SheetPage.constants";
import { useSheetPage } from "./SheetPage.hook";
import type { SheetPageProps } from "./SheetPage.types";
import { SheetStatusBar } from "./subcomponents";

export function SheetPage(props: SheetPageProps) {
  const { characterId, variant = "page" } = props;
  const {
    status,
    loadError,
    character,
    derived,
    saveStatus,
    saveError,
    rolls,
    rollsLoading,
    connection,
    latencyMs,
    rollError,
    activeTab,
    activeRoll,
    onCloseRoll,
    isGm,
    levelUpOpen,
    levelUpLoading,
    levelUpError,
    onOpenLevelUp,
    onCloseLevelUp,
    onLevelUp,
    onTabChange,
    onEdit,
    onRoll,
    onPing,
    pingedId,
    onRetrySave,
    flush,
  } = useSheetPage(props);

  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-void-900 p-6">
        <Text variant="h2">{loadError}</Text>
        <Link href="/mesa" className="font-sans text-base text-accent-text underline">
          Voltar para a mesa
        </Link>
      </main>
    );
  }

  if (!character || !derived) return <SheetSkeleton gm={isGm} variant={variant} />;

  const section = { sheet: character.sheet, derived, onEdit, onRoll, onPing, pingedId, isGm };
  const isActive = (key: string) => activeTab === key;
  const featureSlot = {
    features: character.features,
    characterId: character.id,
    traits: character.sheet.traits,
    onBeforeShare: flush,
  };

  return (
    <>
      <a
        href="#sheet-content"
        className="sr-only-focusable fixed top-2 left-2 z-[60] bg-primary px-4 py-2 font-sans text-sm text-white"
      >
        Pular para o conteúdo da ficha
      </a>
      <main className={SHEET_MAIN_CLASSES[variant]}>
        <FeatureSlots {...featureSlot} slot="backdrop" />
        <div className="mx-auto max-w-[1440px] pt-4">
          <SheetStatusBar
            variant={variant}
            characterId={characterId}
            characterName={character.name}
            saveStatus={saveStatus}
            saveError={saveError}
            connection={connection}
            latencyMs={latencyMs}
            rollError={rollError}
            onRetrySave={onRetrySave}
          />
          <SheetHeader
            character={character}
            onEdit={onEdit}
            isGm={isGm}
            onLevelUp={onOpenLevelUp}
          />
        </div>
        <div className="mx-auto max-w-[1440px]">
          <SheetSummaryBar character={character} derived={derived} onEdit={onEdit} />
          <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div id="sheet-content" className="min-w-0">
              <Tabs
                items={SHEET_TABS}
                active={activeTab}
                onChange={onTabChange}
                label="Seções da ficha"
                idPrefix={SHEET_TABS_ID}
              />
              <TabPanel
                idPrefix={SHEET_TABS_ID}
                tabKey="geral"
                active={isActive("geral")}
                className="flex flex-col gap-6 pt-6"
              >
                <AttributesPanel {...section} />
                <div className="grid gap-6 2xl:grid-cols-2">
                  <div className="flex flex-col gap-6">
                    <VitalsPanel {...section} />
                    <CombatPanel {...section} />
                  </div>
                  <SkillsPanel {...section} />
                </div>
              </TabPanel>
              <TabPanel
                idPrefix={SHEET_TABS_ID}
                tabKey="habilidades"
                active={isActive("habilidades")}
                className="flex flex-col gap-6 pt-6"
              >
                <AbilitiesPanel
                  {...section}
                  list="abilities"
                  title="Habilidades"
                  entityLabel="habilidade"
                  icon="sword"
                  emptyLabel="Nenhuma habilidade ainda."
                />
                <AbilitiesPanel
                  {...section}
                  list="innerRealm"
                  title="Reino Interior"
                  entityLabel="manifestação"
                  icon="sparkles"
                  emptyLabel="Nenhuma manifestação ainda."
                />
              </TabPanel>
              <TabPanel
                idPrefix={SHEET_TABS_ID}
                tabKey="inventario"
                active={isActive("inventario")}
                className="pt-6"
              >
                <InventoryPanel {...section} />
              </TabPanel>
              <TabPanel
                idPrefix={SHEET_TABS_ID}
                tabKey="tracos"
                active={isActive("tracos")}
                className="flex flex-col gap-6 pt-6"
              >
                <TraitsPanel
                  {...section}
                  addon={<FeatureSlots {...featureSlot} slot="traitsAddon" />}
                />
                <FeatureSlots {...featureSlot} slot="traitsSection" />
              </TabPanel>
              <TabPanel
                idPrefix={SHEET_TABS_ID}
                tabKey="rolagens"
                active={isActive("rolagens")}
                className="pt-6 xl:hidden"
              >
                <RollFeed rolls={rolls} loading={rollsLoading} />
              </TabPanel>
            </div>
            <aside
              aria-label="Rolagens da mesa"
              className="hidden xl:sticky xl:top-28 xl:block xl:h-[calc(100vh-8rem)]"
            >
              <RollFeed rolls={rolls} loading={rollsLoading} className="h-full" />
            </aside>
          </div>
        </div>
        <LevelUpModal
          open={levelUpOpen}
          sheet={character.sheet}
          loading={levelUpLoading}
          error={levelUpError}
          onClose={onCloseLevelUp}
          onConfirm={onLevelUp}
        />
        {activeRoll && (
          <DiceRollOverlay key={activeRoll.id} roll={activeRoll} onClose={onCloseRoll} />
        )}
      </main>
    </>
  );
}
