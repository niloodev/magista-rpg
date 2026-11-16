-- AlterTable
ALTER TABLE "arena_tokens" ADD COLUMN     "tokenStyle" TEXT NOT NULL DEFAULT 'portrait';

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "figureKey" TEXT,
ADD COLUMN     "tokenStyle" TEXT NOT NULL DEFAULT 'portrait';

-- AlterTable
ALTER TABLE "arena_tokens" ADD COLUMN     "showName" BOOLEAN NOT NULL DEFAULT true;
