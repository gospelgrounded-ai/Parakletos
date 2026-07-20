-- Manual migration for the commentary read-through cache.
-- Generated via `prisma migrate diff` (offline, schema-to-schema — not a
-- live DB introspection), for environments where the Prisma CLI can't reach
-- the database directly but a SQL editor (Neon's web console) can.
--
-- Safe to run once. Purely additive — one new table, no existing table,
-- column, or row is touched. The app also degrades gracefully if deployed
-- before this runs (cache reads/writes fail soft), but commentary won't
-- survive a bible.helloao.org outage until the table exists.
--
-- Run this in the Neon dashboard:
-- your project -> SQL Editor -> paste this whole file -> Run.

BEGIN;

-- CreateTable
CREATE TABLE "CommentaryCache" (
    "id" TEXT NOT NULL,
    "commentaryId" TEXT NOT NULL,
    "book" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentaryCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentaryCache_commentaryId_book_chapter_key" ON "CommentaryCache"("commentaryId", "book", "chapter");

COMMIT;
