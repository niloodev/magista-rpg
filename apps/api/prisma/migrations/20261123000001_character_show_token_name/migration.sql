-- Existing sheets keep showing the name of their tokens; new sheets start hidden.
ALTER TABLE "characters" ADD COLUMN "showTokenName" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "characters" ALTER COLUMN "showTokenName" SET DEFAULT false;
