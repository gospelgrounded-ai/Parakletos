-- Manual migration for the tables added in this session's improvement work.
-- Generated via `prisma migrate diff` (offline, schema-to-schema — not a
-- live DB introspection), for environments where the Prisma CLI can't reach
-- the database directly (e.g. no raw TCP egress) but a SQL editor (Neon's
-- web console) can.
--
-- Safe to run once against a database that already has the pre-existing
-- Parakletos tables (User, Highlight, Bookmark, Note, ReadingProgress,
-- UserSettings, DailyReading, SermonNote, ReadingPlan, PlanDay,
-- PlanEnrollment, Account, Session, VerificationToken). Every statement
-- below is purely additive — no existing table, column, or row is altered
-- destructively.
--
-- Run this in the Neon dashboard: your project -> SQL Editor -> paste this
-- whole file -> Run.

BEGIN;

-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "fontSize" SET DEFAULT 100;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioCache" (
    "id" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "book" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "voice" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "audio" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TtsUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TtsUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterCache" (
    "id" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "book" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verses" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChapterCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookListCache" (
    "id" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "books" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookListCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryVerse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "book" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "box" INTEGER NOT NULL DEFAULT 1,
    "nextReview" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryVerse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "AudioCache_createdAt_idx" ON "AudioCache"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AudioCache_translation_book_chapter_verse_voice_service_key" ON "AudioCache"("translation", "book", "chapter", "verse", "voice", "service");

-- CreateIndex
CREATE INDEX "TtsUsage_date_idx" ON "TtsUsage"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TtsUsage_userId_date_key" ON "TtsUsage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterCache_translation_book_chapter_key" ON "ChapterCache"("translation", "book", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX "BookListCache_translation_key" ON "BookListCache"("translation");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "MemoryVerse_userId_nextReview_idx" ON "MemoryVerse"("userId", "nextReview");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryVerse_userId_translation_book_chapter_verse_key" ON "MemoryVerse"("userId", "translation", "book", "chapter", "verse");

-- CreateIndex
CREATE INDEX "PrayerEntry_userId_idx" ON "PrayerEntry"("userId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TtsUsage" ADD CONSTRAINT "TtsUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryVerse" ADD CONSTRAINT "MemoryVerse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerEntry" ADD CONSTRAINT "PrayerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
