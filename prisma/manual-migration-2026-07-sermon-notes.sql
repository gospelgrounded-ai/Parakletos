-- Manual migration for the sermon-notes upgrade (series, tags, favorites,
-- share links, per-note translation).
-- Generated via `prisma migrate diff` (offline, schema-to-schema — not a
-- live DB introspection), for environments where the Prisma CLI can't reach
-- the database directly but a SQL editor (Neon's web console) can.
--
-- Safe to run once against a database that already has the SermonNote table.
-- Every statement below is purely additive — no existing table, column, or
-- row is altered destructively.
--
-- Run this in the Neon dashboard BEFORE deploying the sermon-notes upgrade:
-- your project -> SQL Editor -> paste this whole file -> Run.

BEGIN;

-- AlterTable
ALTER TABLE "SermonNote" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "series" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shareToken" TEXT,
ADD COLUMN     "tags" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "translation" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SermonNote_shareToken_key" ON "SermonNote"("shareToken");

COMMIT;
