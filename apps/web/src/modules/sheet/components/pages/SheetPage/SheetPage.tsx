"use client";

import Link from "next/link";
import { createPortal } from "react-dom";

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
import { SHEET_MAIN_CLASSES } from "@/modules/sheet/sheet.constants";
import { DiceRollOverlay, RollFeed } from "@/modules/table/components/organisms";
import { Button, Text } from "@/shared/components/atoms";
import { TabPanel, Tabs } from "@/shared/components/molecules";

import { SHEET_RETRY_LABEL } from "./SheetPage.constants";
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
    panel,
    tabItems,
    tabsIdPrefix,
    onReload,
    skeletonArt,
  } = useSheetPage(props);

  if (status === "error" && panel) {
    return (
      <div className={`${SHEET_MAIN_CLASSES.panel} flex flex-col items-start gap-3 pt-6`}>
        <Text variant="h3" as="p" role="alert">
          {loadError}
        </Text>
        <Button variant="secondary" size="sm" onClick={onReload}>
          {SHEET_RETRY_LABEL}
        </Button>
      </div>
    );
  }

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

  if (!character || !derived)
    return <SheetSkeleton gm={isGm} variant={variant} art={skeletonArt} />;

  const section = { sheet: character.sheet, derived, onEdit, onRoll, onPing, pingedId, isGm };
  const isActive = (key: string) => activeTab === key;
  const featureSlot = {
    features: character.features,
    characterId: character.id,
    traits: character.sheet.traits,
    onBeforeShare: flush,
  };

  const Root = panel ? "div" : "main";
  const roll = activeRoll && (
    <DiceRollOverlay key={activeRoll.id} roll={activeRoll} onClose={onCloseRoll} />
  );

  return (
    <>
      {!panel && (
        <a
          href="#sheet-content"
          className="sr-only-focusable fixed top-2 left-2 z-[60] bg-primary px-4 py-2 font-sans text-sm text-white"
        >
          Pular para o conteúdo da ficha
        </a>
      )}
      <Root className={SHEET_MAIN_CLASSES[variant]}>
        {!panel && <FeatureSlots {...featureSlot} slot="backdrop" />}
        <div className="@container">
          <div className="mx-auto max-w-[1440px] pt-4">
            <SheetStatusBar
              variant={variant}
              characterId={characterId}
              characterName={character.name}
              saveStatus={saveStatus}
              saveError={saveError}
              connection={connection}
              rollError={rollError}
              onRetrySave={onRetrySave}
            />
            <SheetHeader
              character={character}
              onEdit={onEdit}
              isGm={isGm}
              onLevelUp={onOpenLevelUp}
              headingAs={panel ? "h2" : "h1"}
            />
          </div>
          <div className="mx-auto max-w-[1440px]">
            <SheetSummaryBar character={character} derived={derived} onEdit={onEdit} />
            <div className="mt-4 grid gap-6 @min-[77rem]:grid-cols-[minmax(0,1fr)_380px]">
              <div id={panel ? undefined : "sheet-content"} className="min-w-0">
                <Tabs
                  items={tabItems}
                  active={activeTab}
                  onChange={onTabChange}
                  label="Seções da ficha"
                  container={panel}
                  idPrefix={tabsIdPrefix}
                />
                <TabPanel
                  idPrefix={tabsIdPrefix}
                  tabKey="geral"
                  active={isActive("geral")}
                  className="flex flex-col gap-6 pt-6"
                >
                  <AttributesPanel {...section} />
                  <div className="grid gap-6 @min-[93rem]:grid-cols-2 [&>*]:min-w-0">
                    <div className="flex min-w-0 flex-col gap-6">
                      <VitalsPanel {...section} />
                      <CombatPanel {...section} />
                    </div>
                    <SkillsPanel {...section} />
                  </div>
                </TabPanel>
                <TabPanel
                  idPrefix={tabsIdPrefix}
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
                  idPrefix={tabsIdPrefix}
                  tabKey="inventario"
                  active={isActive("inventario")}
                  className="pt-6"
                >
                  <InventoryPanel {...section} />
                </TabPanel>
                <TabPanel
                  idPrefix={tabsIdPrefix}
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
                {!panel && (
                  <TabPanel
                    idPrefix={tabsIdPrefix}
                    tabKey="rolagens"
                    active={isActive("rolagens")}
                    className="pt-6 @min-[77rem]:hidden"
                  >
                    <RollFeed rolls={rolls} loading={rollsLoading} />
                  </TabPanel>
                )}
              </div>
              {!panel && (
                <aside
                  aria-label="Rolagens da mesa"
                  className="hidden @min-[77rem]:sticky @min-[77rem]:top-28 @min-[77rem]:block @min-[77rem]:h-[calc(100vh-8rem)]"
                >
                  <RollFeed rolls={rolls} loading={rollsLoading} className="h-full" />
                </aside>
              )}
            </div>
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
        {roll && createPortal(roll, document.body)}
      </Root>
    </>
  );
}
