-- AlterTable
ALTER TABLE "arena_tokens" ADD COLUMN     "healthCurrent" INTEGER,
ADD COLUMN     "healthMax" INTEGER,
ADD COLUMN     "sanityCurrent" INTEGER,
ADD COLUMN     "sanityMax" INTEGER,
ADD COLUMN     "statusPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "arena_token_status_viewers" (
    "tokenId" UUID NOT NULL,
    "accountId" UUID NOT NULL,

    CONSTRAINT "arena_token_status_viewers_pkey" PRIMARY KEY ("tokenId","accountId")
);

-- CreateIndex
CREATE INDEX "arena_token_status_viewers_accountId_idx" ON "arena_token_status_viewers"("accountId");

-- AddForeignKey
ALTER TABLE "arena_token_status_viewers" ADD CONSTRAINT "arena_token_status_viewers_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "arena_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_token_status_viewers" ADD CONSTRAINT "arena_token_status_viewers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

