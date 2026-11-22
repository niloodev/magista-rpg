-- World map: whether it is live, the party token position and the fog painted by the GM (bitset).
-- AlterTable
ALTER TABLE "arena_state" ADD COLUMN     "fogMask" BYTEA,
ADD COLUMN     "fogVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "partyX" DOUBLE PRECISION NOT NULL DEFAULT 1000,
ADD COLUMN     "partyY" DOUBLE PRECISION NOT NULL DEFAULT 728.5,
ADD COLUMN     "worldMapLive" BOOLEAN NOT NULL DEFAULT false;
