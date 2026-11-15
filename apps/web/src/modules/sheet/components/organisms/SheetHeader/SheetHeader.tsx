"use client";

import { ALIGNMENTS, CLASSES } from "@magista/shared";

import { toMediaUrl } from "@/core/services/http";
import { FeatureBadges } from "@/modules/features/components";
import { CharacterImagesDialog } from "@/modules/library/components";
import { IdentityForm } from "@/modules/sheet/components/molecules";
import { portraitOf } from "@/modules/sheet/sheet.utils";
import { Avatar, Button, Icon, Text } from "@/shared/components/atoms";
import { EditorModal, Panel } from "@/shared/components/molecules";

import { IDENTITY_FORM_ID } from "./SheetHeader.constants";
import { useSheetHeader } from "./SheetHeader.hook";
import type { SheetHeaderProps } from "./SheetHeader.types";
import { ArtDialog } from "./subcomponents";

export function SheetHeader(props: SheetHeaderProps) {
  const { character, isGm, onLevelUp, headingAs = "h1" } = props;
  const { identity } = character.sheet;
  const { draft, open, close, change, save, imagesOpen, openImages, closeImages } =
    useSheetHeader(props);
  const facts = [
    { label: "Classe", value: CLASSES[identity.class].name },
    { label: "Nível", value: String(identity.level) },
    {
      label: "Alinhamento",
      value: identity.alignment ? ALIGNMENTS[identity.alignment].name : "Sem alinhamento",
    },
    { label: "Variação", value: identity.alignmentNote || "-" },
  ];
  return (
    <Panel
      variant="primary"
      className="flex flex-col gap-6 p-6 @min-[45rem]:flex-row @min-[45rem]:items-center"
    >
      <div className="flex flex-col items-center gap-2 self-center">
        <Avatar
          src={toMediaUrl(portraitOf(character))}
          name={character.name}
          size="xl"
          decorative
        />
        {character.artUrl && (
          <ArtDialog src={toMediaUrl(character.artUrl) ?? ""} name={character.name} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex min-h-6 flex-wrap items-center gap-x-4 gap-y-2">
              <Text variant="micro">Ficha do jogador</Text>
              <FeatureBadges features={character.features} />
            </div>
            <Text variant="h1" as={headingAs} className="truncate text-4xl @min-[45rem]:text-5xl">
              {character.name}
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={open}
              icon={<Icon name="pen-line" size={14} />}
            >
              Editar identidade
            </Button>
            {isGm && (
              <Button
                variant="secondary"
                size="sm"
                onClick={openImages}
                icon={<Icon name="image" size={14} />}
              >
                Imagens
              </Button>
            )}
            {isGm ? (
              <Button
                variant="mystic"
                size="sm"
                onClick={onLevelUp}
                icon={<Icon name="chevrons-up" size={14} />}
              >
                Subir de nível
              </Button>
            ) : (
              <Button
                variant="mystic"
                size="sm"
                disabled
                aria-describedby="level-up-locked"
                icon={<Icon name="lock" size={14} />}
              >
                Subir de nível
              </Button>
            )}
            {!isGm && (
              <span id="level-up-locked" className="sr-only">
                Somente o Mestre pode subir o nível.
              </span>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 @min-[61rem]:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="border border-white/10 bg-black/30 px-4 py-3">
              <dt className="font-sans text-xs font-semibold tracking-[0.12em] text-label uppercase">
                {fact.label}
              </dt>
              <dd className="mt-1 truncate font-sans text-base text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <EditorModal
        open={draft !== null}
        mode="edit"
        entityLabel="identidade"
        formId={IDENTITY_FORM_ID}
        onClose={close}
      >
        {draft && (
          <IdentityForm
            formId={IDENTITY_FORM_ID}
            value={draft}
            gmFieldsLocked={!isGm}
            onChange={change}
            onSubmit={save}
          />
        )}
      </EditorModal>
      {imagesOpen && (
        <CharacterImagesDialog
          characterId={character.id}
          characterName={character.name}
          avatarUrl={character.avatarUrl}
          artUrl={character.artUrl}
          onClose={closeImages}
        />
      )}
    </Panel>
  );
}
