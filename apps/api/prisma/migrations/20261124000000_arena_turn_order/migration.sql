-- Turn order of each scene (Roll20 style): entries by token, the token whose turn it is and the round.
-- AlterTable
ALTER TABLE "arena_scenes" ADD COLUMN     "turnRound" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "turnTokenId" UUID;

-- AlterTable
ALTER TABLE "arena_tokens" ADD COLUMN     "initiativeBonus" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "arena_turn_entries" (
    "id" UUID NOT NULL,
    "sceneId" UUID NOT NULL,
    "tokenId" UUID NOT NULL,
    "initiative" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_turn_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "arena_turn_entries_tokenId_key" ON "arena_turn_entries"("tokenId");

-- CreateIndex
CREATE INDEX "arena_turn_entries_sceneId_idx" ON "arena_turn_entries"("sceneId");

-- CreateIndex
CREATE UNIQUE INDEX "arena_scenes_turnTokenId_key" ON "arena_scenes"("turnTokenId");

-- AddForeignKey
ALTER TABLE "arena_scenes" ADD CONSTRAINT "arena_scenes_turnTokenId_fkey" FOREIGN KEY ("turnTokenId") REFERENCES "arena_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_turn_entries" ADD CONSTRAINT "arena_turn_entries_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "arena_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_turn_entries" ADD CONSTRAINT "arena_turn_entries_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "arena_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

