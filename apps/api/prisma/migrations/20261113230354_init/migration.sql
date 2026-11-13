-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('PLAYER', 'GM');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "login" TEXT NOT NULL,
    "loginKey" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sheet" JSONB NOT NULL DEFAULT '{}',
    "sheetVersion" INTEGER NOT NULL DEFAULT 0,
    "legacy" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_loginKey_key" ON "accounts"("loginKey");

-- CreateIndex
CREATE UNIQUE INDEX "characters_accountId_key" ON "characters"("accountId");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
