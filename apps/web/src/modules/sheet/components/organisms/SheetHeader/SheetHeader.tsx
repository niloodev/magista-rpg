"use client";

import { ALIGNMENTS, CLASSES } from "@magista/shared";

import { toMediaUrl } from "@/core/services/http";
import { IdentityForm } from "@/modules/sheet/components/molecules";
import { portraitOf } from "@/modules/sheet/sheet.utils";
import { Avatar, Button, Icon, Text } from "@/shared/components/atoms";
import { EditorModal, Panel } from "@/shared/components/molecules";

import { IDENTITY_FORM_ID } from "./SheetHeader.constants";
import { useSheetHeader } from "./SheetHeader.hook";
import type { SheetHeaderProps } from "./SheetHeader.types";
import { ArtDialog } from "./subcomponents";

export function SheetHeader(props: SheetHeaderProps) {
  const { character, isGm, onLevelUp } = props;
  const { identity } = character.sheet;
  const { draft, open, close, change, save } = useSheetHeader(props);
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
    <Panel variant="primary" className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
      <div className="flex flex-col items-center gap-2 self-center">
        <Avatar
          src={toMediaUrl(portraitOf(character))}
          name={character.name}
          size="xl"
          decorative
        />
        {character.avatarUrl && (
          <ArtDialog src={toMediaUrl(character.avatarUrl) ?? ""} name={character.name} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Text variant="micro">Ficha do jogador</Text>
            <Text variant="h1" className="truncate text-4xl md:text-5xl">
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
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
    </Panel>
  );
}
