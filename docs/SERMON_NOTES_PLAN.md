# Parakletos — Sermon Notes Upgrade Plan (war-gamed & revised)

## Context

Sermon notes should be a feature users reach for every week, inspired by the Spirit Notes app: audio recording with tap-to-jump timestamps on each note point, inline scripture that expands as you type a reference, organization by series/tags/speaker, and one-link sharing. Today Parakletos' version is a bare single-blob editor: no search, no tags/series/favorites, no sharing, recordings vanish on page close, scripture detection has real bugs (any word before a book name silently loses the reference; `Song of Solomon` never matches; no verse ranges), the APIs accept unbounded unvalidated input, and pending autosaves are lost on navigation.

This plan was designed from a full audit of the feature and adversarially war-gamed against the actual code (11 attacks landed and are baked in). It makes the feature Spirit-Notes-good and, in places, better: timestamps live inside the plain text so they survive copy/paste and export; share pages are honest, revocable, and noindexed; everything works within the app's no-vendor constraints.

**Binding constraints:**
- No new paid vendors or file-storage services. Sermon audio (30–60 MB) can NOT go in Postgres (Neon free tier is 0.5 GB) — recordings persist **client-side in IndexedDB** (honestly labeled "this device only"; Download stays the durable path).
- Schema changes ADDITIVE only. The owner applies SQL by pasting into Neon's web console — S3 ships an exact `prisma migrate diff`-verified SQL file (`prisma/manual-migration-2026-07-sermon-notes.sql`, same conventions as the existing manual-migration file). **Remind the owner to run it in Neon before deploying S3+.**
- Read-only sharing is in; comments/collaboration are NOT (no social feeds).
- No removed features. After each phase: `npm run lint && npx tsc --noEmit && npm run test && npm run build` green. Commit per phase; never commit `.claude/`. Also commit this plan to `docs/SERMON_NOTES_PLAN.md` first.
- Tests are node-env pure-lib only (no jsdom/RTL installed) — new testable logic lives in `src/lib/`.

---

## S1. Scripture detection fixes + tests (pure lib, no schema)

Files: `src/lib/detect-scriptures.ts`, new `src/lib/detect-scriptures.test.ts`, `src/components/sermon-notes/ScriptureCard.tsx`.

- The current regex consumes `"God John"` in `"love God John 3:16"`, fails the alias lookup, and skips past — **the reference is silently lost whenever any word precedes the book name** (war-game A1). Fix: capture generously (up to 4 book-name words), then resolve the captured words against the alias map by **longest suffix first**. This one mechanism also fixes three-word books (`Song of Solomon 2:4`) and `"chapter Romans 8"`.
- Add verse ranges and comma lists: `John 3:16-18`, `Rom 8:1, 5` (each comma segment = its own `DetectedRef`; new additive field `verseEnd: number | null`, included in key/display). Validate `verseEnd > verse`, keep chapter-bounds check.
- `ScriptureCard`: for ranges, join `verse..min(verseEnd, verse+5)` with an ellipsis if truncated.
- Tests: ranges, comma lists, Song of Solomon, `"love God John 3:16"`, `"chapter Romans 8"`, `1 Corinthians 13:4-7`, dedupe, invalid chapter dropped.

## S2. Shared `useAutosave` hook + API hardening (no schema)

Files: new `src/hooks/useAutosave.ts`, new `src/lib/validations/sermon-note.ts` (zod — already a dependency; mirror `lib/validations/auth.ts`), `src/app/api/sermon-notes/route.ts`, `src/app/api/sermon-notes/[id]/route.ts`, refactor `SermonNoteEditor.tsx` **and** `PrayerEntryEditor.tsx` onto the hook (their debounce code is duplicated verbatim).

- `useAutosave<T>({ save, delay = 1500 })` → `{ status, schedule(payload) }`. Flush pending payload with a **normal fetch on unmount** (fixes the real lost-edits bug on SPA navigation) and on `visibilitychange → hidden`; `keepalive` fetch only as best-effort in `beforeunload` (its 64 KiB body cap can't be trusted with 50 k-char notes — war-game A7).
- Validation caps: title/speaker/location/series ≤200, tags ≤500, notes ≤50 000, date `YYYY-MM-DD`, translation ≤10 nullable, isFavorite boolean. Partial schema for PATCH (typed like prayer's PATCH), defaults schema for POST.
- POST: `request.json().catch(() => ({}))`, 400 on invalid, `checkRateLimit("sermon-create:" + userId, 30)`. **Do NOT rate-limit PATCH** — autosave fires every ~2–5 s during live note-taking and would trip any sane window (war-game A2); auth + size caps protect it instead.
- GET: stop swallowing DB errors as `[]`; return 500 and render an error EmptyState on the list page.

## S3. Additive schema + manual migration SQL

Files: `prisma/schema.prisma` (SermonNote block), new `prisma/manual-migration-2026-07-sermon-notes.sql`.

```prisma
series      String  @default("")
tags        String  @default("")   // comma-separated
isFavorite  Boolean @default(false)
shareToken  String? @unique        // null = private
translation String?                // per-note override; null = user default
```
SQL (verify with offline `prisma migrate diff` exactly as the existing manual-migration file documents):
```sql
BEGIN;
ALTER TABLE "SermonNote" ADD COLUMN "series" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SermonNote" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SermonNote" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SermonNote" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "SermonNote" ADD COLUMN "translation" TEXT;
CREATE UNIQUE INDEX "SermonNote_shareToken_key" ON "SermonNote"("shareToken");
COMMIT;
```
- `npx prisma generate` (offline-safe). Add the new fields to **both explicit selects** — `sermon-notes/[id]/page.tsx` and `api/sermon-notes/route.ts` GET — or the editor type-crashes (war-game A10). The export route uses un-selected `findMany`, so it picks the fields up automatically.

## S4. Organization UI + inline verse insertion + right translation

Files: `SermonNoteEditor.tsx`, `ScriptureCard.tsx`, `sermon-notes/page.tsx`.

- **Editor:** series `<Input list>` + `<datalist>` (values deduped from the existing list SWR); tag chip input (Enter/comma adds, × removes; serialized to the comma string); favorite Star toggle in the header (immediate single-field PATCH, prayer's `toggleAnswered` pattern); small translation `<select>` (popular list from `useTranslations().popular` + "App default") writing `translation`.
- **Kill the hardcoded-KJV bug:** pass `translation={note.translation ?? settings.defaultTranslation}` (from `useReaderSettings`) to every ScriptureCard instance.
- **Insert into note:** ScriptureCard's root is currently a `<Link>` — a button inside it is invalid HTML (war-game A3). Restructure root to a `<div>` containing the existing Link body + a sibling action row shown only when the new optional `onInsert` prop is passed (grep-verified: only the sermon editor uses this card). Inserted block: `> "…verse text…" — John 3:16-18 (ESV)` at the textarea caret via an `insertAtCursor` helper routed through `handleChange` so autosave fires; restore caret after.
- **List page:** search input (title/speaker/series/tags/notes, lowercase-includes), filter chips (All / Favorites / per-series), grouped-by-series display with "Ungrouped" fallback — all transplanted from the library page's proven `groupByBook`/filter patterns. Show the favorite star on rows. Extend the ghost-note blank check to also require `!series && !tags && !isFavorite` (war-game A9).

## S5. Timestamped notes + IndexedDB recording persistence (highest risk — after foundations)

Files: new `src/lib/timestamps.ts` + `src/lib/timestamps.test.ts`, new `src/lib/audio-store.ts`, `AudioRecorder.tsx`, `SermonNoteEditor.tsx`.

- **Design (war-game A4):** stamps are plain text `[m:ss]` / `[h:mm:ss]` markers living inside the normal textarea — they survive copy/paste, export, and the share page with zero schema. No contentEditable, no preview pane. The tap-to-jump UI is a chip strip rendered by AudioRecorder *below* a real `<audio controls>` element (replacing the headless `new Audio()` that can't seek).
- `src/lib/timestamps.ts` (pure): `formatStamp(seconds)`, `parseStamps(text)` with `/\[(?:(\d{1,2}):)?(\d{1,2}):([0-5]\d)\]/g`, sorted+deduped. Test that stamps can't collide with scripture detection (detection requires a letter word before numbers).
- `src/lib/audio-store.ts`: dependency-free IndexedDB wrapper (`parakletos-audio` / `recordings`, key = note id, value `{ blob, mimeType, duration, createdAt }`); `put/get/deleteRecording`, all failing soft (resolve null) for private-browsing.
- `AudioRecorder` new props `noteId`, `onStamp(seconds)`, `stamps` (the Stamp button must live here — it owns `elapsed`; war-game A5). On stop → `putRecording`; on mount → restore from IDB (idempotent + object-URL cleanup — StrictMode double-runs effects; war-game A6); Discard also deletes from IDB; store our own `duration` (Chrome webm blobs report `Infinity`); fix `fmt()` for >1 h sermons; label: "Saved on this device only — your browser may clear it; download to keep it permanently" (iOS Safari can evict IDB after ~7 days of non-use).
- Editor: `parseStamps(notes)` → `stamps` prop; `onStamp={(s) => insertAtCursor(formatStamp(s) + " ")}`.

## S6. Share via link (read-only, revocable, honest)

Files: `src/auth.config.ts`, new `src/app/api/sermon-notes/[id]/share/route.ts`, new `src/app/shared/sermon/[token]/page.tsx`, `SermonNoteEditor.tsx`.

- `auth.config.ts`: add `if (pathname.startsWith("/shared/")) return true;` beside the other public branches — verified the middleware matcher otherwise bounces the route to /login (war-game A8). The page lives **outside** `(app)` so it never renders the authed shell.
- Share API: POST → auth + ownership + `checkRateLimit("sermon-share:" + userId, 20)` → `shareToken = crypto.randomBytes(24).toString("base64url")` (cuid rejected — not secret-grade); DELETE → `shareToken: null` (revoked links 404 by construction).
- Public page: server component, `findUnique({ where: { shareToken } })` → `notFound()`; fetch the owner's `UserSettings` for translation fallback; render title/date/speaker/location/series, ScriptureCards (their `/api/bible/*` source is already public), notes `whitespace-pre-wrap`, "Shared from Parakletos" footer, and the honest line "The audio recording stays on the note-taker's device." `robots: { index: false, follow: false }`.
- Editor header: Share button → POST + copy link + toast; when shared, show "Copy link / Stop sharing".

## S7. Delight + surfacing

Files: `src/app/(app)/home/page.tsx`, `SermonNoteEditor.tsx`.

- Home Today card: add `findFirst` most-recent sermon note to the existing `Promise.all`; if `updatedAt` within 7 days → action row "Review: {title}" linking to the note. (No 7th Quick-Access tile — the grid goes ragged and the feature is already in both navs; war-game A11.)
- "Use outline" ghost button, only when notes are empty, inserting a skeleton: `## Big Idea / ## Key Points / ## Scriptures / ## Application / ## Prayer`.

## S8. Final sweep

Full gate, then manual checklist:
1. Type `see Song of Solomon 2:4, John 3:16-18` → two cards with correct ranges; insert a verse block at the caret.
2. Record 30 s, stamp twice, reload the editor → recording restored from this device, tapping a chip jumps playback.
3. Discard removes the IndexedDB entry; download still works.
4. Share → open the link in a private window (no session) → renders without audio and without login bounce; revoke → 404.
5. Tag/series/favorite filters and search on the list page; grouped by series.
6. Edit a note and hit Back immediately → the edit persisted (unmount flush). Prayer editor still autosaves (shared hook).
7. Paste the migration SQL into Neon per the file header **before deploying**; export JSON includes the new fields.

## Explicitly rejected (do not resurrect)
- Relational `SermonSeries` table (string + datalist is right at solo scale; promotable later).
- Server-stored audio in any form (Postgres bytea, Vercel Blob, any vendor) and localStorage audio (5 MB cap).
- Rich-text/contentEditable editor or in-textarea chip rendering.
- Timestamps as a DB table; rate-limiting PATCH; list pagination; comments/collaboration on shared pages; mid-recording IDB chunk persistence (noted as a future crash-safety upgrade).
