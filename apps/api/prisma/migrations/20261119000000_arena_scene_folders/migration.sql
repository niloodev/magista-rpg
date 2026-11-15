-- AlterTable
ALTER TABLE "arena_scenes" ADD COLUMN "folderId" UUID;

-- CreateTable
CREATE TABLE "arena_scene_folders" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arena_scene_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "arena_scene_folders_parentId_idx" ON "arena_scene_folders"("parentId");

-- CreateIndex
CREATE INDEX "arena_scenes_folderId_idx" ON "arena_scenes"("folderId");

-- AddForeignKey
ALTER TABLE "arena_scene_folders" ADD CONSTRAINT "arena_scene_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "arena_scene_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arena_scenes" ADD CONSTRAINT "arena_scenes_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "arena_scene_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
