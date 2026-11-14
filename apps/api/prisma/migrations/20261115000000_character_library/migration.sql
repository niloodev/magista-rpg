-- CreateTable
CREATE TABLE "character_folders" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_access" (
    "characterId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_access_pkey" PRIMARY KEY ("characterId","accountId")
);

-- AlterTable
ALTER TABLE "characters" ADD COLUMN "folderId" UUID,
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Preserve ownership as access rows and order existing characters by name
INSERT INTO "character_access" ("characterId", "accountId")
SELECT "id", "accountId" FROM "characters";

UPDATE "characters" AS c
SET "position" = ordered.rn - 1
FROM (
    SELECT "id", row_number() OVER (ORDER BY "name") AS rn FROM "characters"
) AS ordered
WHERE c."id" = ordered."id";

-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_accountId_fkey";

-- DropIndex
DROP INDEX "characters_accountId_key";

-- AlterTable
ALTER TABLE "characters" DROP COLUMN "accountId";

-- CreateIndex
CREATE INDEX "character_folders_parentId_idx" ON "character_folders"("parentId");

-- CreateIndex
CREATE INDEX "character_access_accountId_idx" ON "character_access"("accountId");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "character_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_folders" ADD CONSTRAINT "character_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "character_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_access" ADD CONSTRAINT "character_access_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_access" ADD CONSTRAINT "character_access_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
