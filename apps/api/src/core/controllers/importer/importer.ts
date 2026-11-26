import { LOGIN_MAX_LENGTH } from "@magista/shared";

import { accountModels } from "@/core/models/account";
import { characterModels } from "@/core/models/character";
import { imageAssets } from "@/core/controllers/mediaAsset";
import { generatePassword, hashPassword } from "@/core/services/auth";
import { fromRoll20Export, type IRoll20Character } from "@/core/services/roll20";

import { importerErrors } from "./importer.errors";
import type { IImporterController, IImporterControllerDeps } from "./importer.types";

/**
 * Builds the Roll20 importer. The character goes to a player account (by default the login is the character
 * name; `login` picks another, like the player's own name), created with a generated password when missing, with
 * access to the imported character; a character with the same name already granted to that account is only
 * overwritten when force is set.
 */
export function createImporterController(deps: IImporterControllerDeps): IImporterController {
  const importCharacter: IImporterController["importCharacter"] = async (input) => {
    let parsed: IRoll20Character;
    try {
      parsed = fromRoll20Export(input.raw);
    } catch {
      return { error: importerErrors.invalidExport };
    }
    const login = input.login?.trim() || parsed.name;
    if (login.length > LOGIN_MAX_LENGTH) return { error: importerErrors.nameTooLong };
    try {
      const existing = await deps.accounts.findCredentialsByLogin(login);
      if (existing?.account.role === "GM") return { error: importerErrors.loginTaken };
      const current = existing
        ? await deps.characters.findByAccountAndName(existing.account.id, parsed.name)
        : null;
      if (current && !input.force) {
        return {
          message: "Personagem já existe",
          payload: {
            characterId: current.id,
            name: parsed.name,
            status: "skipped",
            password: null,
            mediaWarning: null,
          },
        };
      }
      const password = existing ? null : deps.generatePassword();
      const account = existing
        ? existing.account
        : await deps.accounts.upsertAccount({
            login,
            passwordHash: await deps.hashPassword(password ?? ""),
            role: "PLAYER",
          });
      const character = await deps.characters.upsertCharacter({
        id: current?.id,
        accountIds: [account.id],
        name: parsed.name,
        sheet: parsed.sheet,
        legacy: input.raw,
      });
      let mediaWarning: string | null = null;
      try {
        const images = [
          ["avatar", input.avatar],
          ["art", input.art],
        ] as const;
        for (const [kind, body] of images) {
          if (!body) continue;
          const stored = await deps.assets.ingest(body);
          if (!stored) {
            mediaWarning = importerErrors.mediaFailed;
            continue;
          }
          const { previousKey } = await deps.characters
            .setImageKey(character.id, kind, stored.key)
            .catch(async (error: unknown) => {
              await deps.assets.release(stored.key).catch(() => undefined);
              throw error;
            });
          if (previousKey && previousKey !== stored.key)
            await deps.assets.release(previousKey).catch(() => undefined);
        }
      } catch (error) {
        console.error("import media failed:", error);
        mediaWarning = importerErrors.mediaFailed;
      }
      return {
        message: "Personagem importado",
        payload: {
          characterId: character.id,
          name: parsed.name,
          status: current ? "updated" : "created",
          password,
          mediaWarning,
        },
      };
    } catch (error) {
      console.error("importCharacter failed:", error);
      return { error: importerErrors.unexpected };
    }
  };

  return { importCharacter };
}

export const importerController = createImporterController({
  accounts: accountModels,
  characters: characterModels,
  hashPassword,
  generatePassword,
  assets: imageAssets,
});
