"use client";

import { ARENA_MAP_MAX_BYTES } from "@magista/shared";
import { useId, useState, type FormEvent } from "react";

import { SCENE_TEXTS } from "@/modules/arena/arena.constants";
import { imageFileError } from "@/shared/components/molecules";

import type { SceneFormDialogProps } from "./SceneFormDialog.types";

/**
 * Draft, validation and submit state of the scene, folder and map forms. The map is checked here only for
 * type and size; the server checks the real bytes and the pixel size.
 */
export function useSceneFormDialog({
  nameLabel,
  initialName = "",
  mapRequired = false,
  onSubmit,
}: Pick<SceneFormDialogProps, "nameLabel" | "initialName" | "mapRequired" | "onSubmit">) {
  const formId = useId();
  const [name, setName] = useState(initialName);
  const [file, setFile] = useState<File | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onNameChange = (value: string) => {
    setName(value);
    setNameError(null);
  };

  const onFileChange = (next: File | null) => {
    setFile(next);
    setMapError(next ? imageFileError(next, ARENA_MAP_MAX_BYTES, SCENE_TEXTS.mapTooLarge) : null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const trimmed = name.trim();
    if (nameLabel !== null && !trimmed) {
      setNameError(SCENE_TEXTS.nameRequired);
      return;
    }
    if (mapRequired && !file) {
      setMapError(SCENE_TEXTS.mapRequired);
      return;
    }
    if (mapError) return;
    setPending(true);
    const failure = await onSubmit({ name: trimmed, file });
    setPending(false);
    if (!failure) return;
    if (nameLabel !== null) setNameError(failure);
    else setMapError(failure);
  };

  return { formId, name, file, nameError, mapError, pending, onNameChange, onFileChange, submit };
}
