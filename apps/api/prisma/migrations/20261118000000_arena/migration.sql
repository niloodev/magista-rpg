-- CreateTable
CREATE TABLE "arena_scenes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "mapKey" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arena_tokens" (
    "id" UUID NOT NULL,
    "sceneId" UUID NOT NULL,
    "characterId" UUID,
    "name" TEXT,
    "imageKey" TEXT,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "size" INTEGER NOT NULL DEFAULT 140,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arena_state" (
    "id" UUID NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "activeSceneId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "arena_tokens_sceneId_idx" ON "arena_tokens"("sceneId");

-- CreateIndex
CREATE INDEX "arena_tokens_characterId_idx" ON "arena_tokens"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "arena_state_singleton_key" ON "arena_state"("singleton");

-- CreateIndex
CREATE UNIQUE INDEX "arena_state_activeSceneId_key" ON "arena_state"("activeSceneId");

-- AddForeignKey
ALTER TABLE "arena_tokens" ADD CONSTRAINT "arena_tokens_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "arena_scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_tokens" ADD CONSTRAINT "arena_tokens_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_state" ADD CONSTRAINT "arena_state_activeSceneId_fkey" FOREIGN KEY ("activeSceneId") REFERENCES "arena_scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
