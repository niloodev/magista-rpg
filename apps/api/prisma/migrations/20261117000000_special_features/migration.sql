-- AlterTable
ALTER TABLE "characters" ADD COLUMN "features" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "marked_shares" (
    "id" UUID NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "sourceCharacterId" UUID NOT NULL,
    "traitName" TEXT NOT NULL,
    "traitDescription" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marked_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marked_shares_singleton_key" ON "marked_shares"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "marked_shares_sourceCharacterId_key" ON "marked_shares"("sourceCharacterId");

-- AddForeignKey
ALTER TABLE "marked_shares" ADD CONSTRAINT "marked_shares_sourceCharacterId_fkey" FOREIGN KEY ("sourceCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
