-- AlterTable
ALTER TABLE "characters" ADD COLUMN "avatarKey" TEXT, ADD COLUMN "artKey" TEXT;

UPDATE "characters"
SET
  "avatarKey" = CASE
    WHEN "tokenUrl" IS NULL THEN NULL
    ELSE 'legacy/' || substring(split_part("tokenUrl", '?', 1) FROM '^/media/(.*)$')
  END,
  "artKey" = CASE
    WHEN "avatarUrl" IS NULL THEN NULL
    ELSE 'legacy/' || substring(split_part("avatarUrl", '?', 1) FROM '^/media/(.*)$')
  END;

ALTER TABLE "characters" DROP COLUMN "avatarUrl", DROP COLUMN "tokenUrl";
