# Parakletos — UI/UX Redesign Plan (war-gamed & revised)

## Context

The app is functionally complete after the 4-phase improvement work (cost controls, resilience, discipleship features, PWA/CI). This pass is **UI and UX only**, prompted by a full-app audit of every surface. The audit found: mobile users literally cannot reach Settings, sign-out, or Sermon Notes; tablets render two navs at once; two fixed bottom bars collide; the flagship audio feature is buried in an overflow menu; there is no Card/EmptyState primitive so every page hand-rolls diverging styles; several hardcoded colors break in dark mode; zero route-level loading states; and no onboarding. The reader typography, search, share-card modal, and book/chapter selector are the app's strongest surfaces and are deliberately left alone.

This plan was adversarially war-gamed against the actual code; 10 attacks landed and their amendments are baked in below.

**Binding constraints:**
- UI/UX only, with exactly two small backend touches called out for approval here (nothing else touches the backend):
  1. **D3** adds an un-complete branch to the existing plan-progress API route (no schema change) — without it, un-marking a plan day is impossible and the item gets cut.
  2. **D1** extends the Home page's existing server query to also select the current plan day's passages (read-only, same tables) so the "Today" card can deep-link.
- Everything in the "Out of scope" section stays out of scope — it is a do-not-do list, not deferred work.
- No schema changes, no new vendors/dependencies, no removed translations or features.
- After each phase: `npm run lint && npx tsc --noEmit && npm run test && npm run build` green.
- Commit per phase with descriptive messages; never commit `.claude/`.
- Also write this plan to `docs/UI_UX_PLAN.md` and commit it first so it travels with the repo.

---

## Phase A — Navigation architecture

### A1. Make every destination reachable on every device
- `MobileBottomNav.tsx:8-14` has 5 tabs; Settings/Sermon Notes/sign-out exist only in the desktop sidebar (`AppSidebar.tsx:27-35,86-130`) → unreachable on phones.
- Replace the 5th tab with a **"More" tab** opening a bottom `Sheet` (reuse `ui/sheet.tsx`): user row (avatar/name) on top, then Library, Prayer, Memorize, Sermon Notes, Settings, Sign out. Rows `min-h-[48px]`, full-width. "More" shows active state when pathname matches any sheet destination.
- **Also add Prayer and Memorize to the desktop sidebar** (`AppSidebar.tsx:27-35` currently omits both).

### A2. One nav per viewport (kill the tablet double-nav)
- Sidebar is `hidden md:flex` (`AppSidebar.tsx:52`), bottom nav `lg:hidden` (`MobileBottomNav.tsx:20`) → both render at 768–1023px.
- Sidebar → `hidden lg:flex`; drop the md icon-only `w-16` rail entirely (it also has unlabeled icon links — `AppSidebar.tsx:79` labels are `hidden lg:block`).
- **Offsets move to the shell, not fixed components** (war-game #7): the guest reader has no sidebar/bottom nav, yet `AudioPlayer.tsx:486` bakes in `md:left-16 lg:left-[220px]` and `bottom-16`. After A3, the authenticated `AppShell` supplies positioning context (or an `isAuthenticated`-keyed class) so AudioPlayer/VerseActionsBar offsets are correct in both authenticated and guest layouts. Grep for all `md:left-16`/`lg:left-[220px]`/`bottom-16` fixed-position offsets and route them through the shell.

### A3. Extract one `AppShell`
`(app)/layout.tsx:17-25` and `(reader)/layout.tsx:15-23` are near-duplicates. Extract `AppShell` (sidebar + bottom nav + main padding, guest-header variant via prop/slot) used by both.

### A4. Fix the audio-bar / verse-actions collision — **implement together with C3**
Both are `fixed bottom-16 lg:bottom-0` (`VerseActionsBar.tsx:296`, `AudioPlayer.tsx:486`) and stack when a verse is selected during playback. The audio bar's height is not stable (C3 makes it two rows on mobile; the unsupported-TTS notice adds a row). Fix: AudioPlayer measures itself (ref) and publishes `--audio-bar-h` as an inline CSS variable on the reader container; VerseActionsBar uses `bottom: calc(var(--audio-bar-h, 0px) + <nav offset>)`. `BibleReaderClient` already tracks both states (`:58,445,462`).

---

## Phase B — Design-system foundation

### B1. Missing primitives, then adoption
- `ui/card.tsx` (standard shadcn Card, `rounded-xl border bg-card`) — adopt in home, library, plans, prayer, sermon-notes, memorize, settings. One radius (StreakWidget `rounded-2xl` → `rounded-xl`).
- `components/shared/EmptyState.tsx` (`{icon, title, hint?, action?}`) — replaces 5 copy-pasted variants (`library:83-90`, `prayer:45-52`, `sermon-notes:82-88`, `memorize:103-138`, `plans:159-163`). Keep each page's existing copy.
- `components/shared/ProgressBar.tsx` (one `h-1.5` height, token colors) — replaces `home:121`, `plans:55`, `plans/[planId]:88`.
- Adopt `<Button>` for raw buttons/links: plans Start/Continue (`plans:125-135`), plan-detail Read chip (`plans/[planId]:174-181`), VOTD share (`VerseOfTheDayCard:42`). (Settings Save is removed entirely in D2.)

### B2. Dark-mode / off-token color fixes
- `plans/[planId]/page.tsx:82-94` banner hardcodes `text-white`/`bg-white/20` on user `coverColor` → replace with neutral `bg-card` header + small coverColor accent bar/dot (no text on raw color; works both themes). Same for `plans/page.tsx:92` icon.
- Add `--success` token (light+dark) to `globals.css` + Tailwind theme; use in `plans:112`, `plans/[planId]:125`, and align `PrayerEntryEditor:161`.
- `library:53` `bg-gray-200` fallback dot → `bg-muted`; library highlight dots get the reader's existing `dark:` variants (`tailwind.config.ts:26-30`).

### B3. Typography: actually ship Lora (corrected edit list — war-game #1)
The load-bearing hardcode is the inline style in `BibleReaderClient.tsx:346-351` (`--reader-font-family: "Georgia, 'Times New Roman', serif"` for the serif option) — it always overrides `globals.css`. Edits: `BibleReaderClient.tsx:350` serif value → `var(--font-serif), Georgia, serif`; settings preview `settings/page.tsx:279`; the "Serif" chip in `ChapterNav.tsx:481`; `globals.css:71` fallback. Do NOT touch `tailwind.config.ts:88` (already correct).

### B4. Global a11y baseline
- `globals.css`: `*:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }` — verified no doubling with shadcn's `focus-visible:ring` (those set `outline-none`) or VerseItem (has its own outline). Fixes the dozens of hover-only links (landing, home, library, plans, prayer, memorize, both navs).
- Broaden `prefers-reduced-motion` (`globals.css:158-163`): universal `transition-duration: 0.01ms !important; animation-duration: 0.01ms !important;` — verified no `transitionend`/`animationend` listeners in src.
- Raise sub-AA text: `text-muted-foreground/60` (`library:107`) and `/70` (`library:273`) → full `text-muted-foreground`.

### B5. Route-level loading states
Zero `loading.tsx` exist. Add skeleton `loading.tsx` for async server routes: `(app)/home`, `(app)/prayer/[id]`, `(app)/sermon-notes/[id]`, `(reader)/bible/[translation]/[book]/[chapter]`. Skip `plans/[planId]` (client-skeletoned). Use `<Skeleton>` blocks mirroring each page's layout.

---

## Phase C — Reader & audio UX

### C1. Un-bury reader features (ChapterNav restructure, mobile-corrected — war-game #3, #5)
Today audio/parallel/interlinear/font/theme all hide behind one `⋯` popover (`ChapterNav.tsx:327-515`).
- **≥sm:** three visible controls: Headphones button (toggles audio player; aria-label "Listen to this chapter"; active = `text-primary` + dot) · "Aa" popover (font size stepper, typeface, theme — **no line-spacing control**; the client settings model has no lineHeight field and adding one is out of scope) · view menu (`Columns` icon: Parallel + Interlinear with their selects).
- **<sm (375px budget):** only TWO visible controls — Headphones + a single merged menu (Aa + view toggles). Move the translation select inside the book/chapter selector sheet on mobile; title button gets `min-w-0 flex-1 truncate` and drops its BookOpen icon below sm.
- Delete dead `ReaderSettingsButton.tsx` (verified unreferenced); the Aa popover is the single implementation.
- Add keyboard hint line ("← → chapters · j/k verses") in the Aa popover, `hidden lg:block`.

### C2. Touch-target pass (44px floor, mobile-first)
`min-h-[44px]`/`h-11 w-11` (desktop may keep density via `sm:` overrides): ChapterNav prev/next (`:302,527`) + menu buttons (`:330-332`), TranslationSelector trigger (`:46`), AudioPlayer transport (`:513-539`), VerseActionsBar swatches `w-7`→`w-9` (`:317`) and close `p-1`→`p-2` (`:302`), search testament pills (`SearchInterface.tsx:309`).

### C3. AudioPlayer responsive redesign (with A4)
Current single non-wrapping row crushes phones (`AudioPlayer.tsx:487-609`); 5 speed chips are ~18px tall.
- **<sm:** two rows — (1) verse label truncating + close; (2) prev/play/next centered + single cycling speed button (0.75→1→1.25→1.5, label "1.25×") + voice select.
- **≥sm:** one row, 5 chips replaced by the same cycling speed button.
- Publishes `--audio-bar-h` (see A4).

### C4. Verse selection legibility
- First verse selected → hint in VerseActionsBar: "Tap another verse to select a range" (muted text-xs; disappears once a range exists).
- Range mode hides 4 of 7 actions silently (`VerseActionsBar.tsx:343-389`) → show "Bookmarks, notes & study apply to single verses" note instead.
- Fix double toast on note save: remove child toast (`VerseActionsBar.tsx:142`), keep parent (`BibleReaderClient.tsx:292`).

### C5. Reader consistency
- Font-size setting is ignored in parallel/interlinear: replace hardcoded `text-sm sm:text-base` (`ParallelVerseList.tsx:102,124`, `InterlinearVerseList.tsx:252`) with the `.bible-text` size var (~0.85× scale for columns is fine).
- Parallel view stacks vertically below sm (`grid-cols-1 sm:grid-cols-2`).
- StudyPanel: raise body text one step (cross-refs `:314` and commentary body — currently `text-xs`/`text-[10-11px]` — to `text-sm`/`text-xs`; keep metadata small). Swap `▲/▼` glyphs (`:401`) for lucide `ChevronUp/Down`.

---

## Phase D — Page-level flows

### D1. Home: answer "what should I do today?"
Restructure `home/page.tsx`:
1. Greeting (keep).
2. **"Today" card (new, the page's single visual priority):** up to three full-width action rows — "Continue reading {Book} {Ch}" (progress), "Read today's plan passage" (**requires extending the home query**: include the current day's `PlanDay.passages` for the most recent active enrollment and parse server-side to build the deep link — war-game #10; degrade to the `/plans/[id]` link if parsing fails), "Review {n} memory verses" (due count already fetched).
3. Verse of the Day (keep, slightly smaller).
4. Streak widget — demote to a compact row (flame + count + heatmap; no gradient hero).
5. Quick Access grid (fix "Open Bible" tile `Flame` icon → `BookOpen`, `home:174`).
Remove the separate Continue-Reading/Active-Plans sections (absorbed by the Today card; keep an Active Plans list only when >1 enrollment).

### D2. Settings: instant apply
- Remove the Save button and split-save model (`settings:83-93,295-303`). Font size/family and default translation save on change — `useReaderSettings.update()` already writes localStorage + **POSTs** (the API has GET/POST, not PATCH) on every change, so this is wiring, not new plumbing. Transient "Saved" inline check.
- Native `<select>`s → `ui/select.tsx` primitive. Keep the live preview card.

### D3. Plans: state coverage & reversibility (includes backend touch #1 from the constraints)
- Enroll (`plans/page.tsx:70-83`): pending state (disabled + spinner) + `.catch` → error toast; prevents double-enroll.
- Split into "My plans" / "Browse plans" sections.
- **API amendment (backend touch #1, no schema change):** `api/reading-plans/[planId]/progress/route.ts:109-111` only ever adds to `completedSet`; accept `{ dayNumber, completed: false }` to remove the day from the comma-separated `completedDays` string. UI: tapping a completed day's check un-marks it.
- Guard `JSON.parse(day.passages)` at `plans/[planId]/page.tsx:103` **and** the identical unguarded parse in `ChapterNav.tsx:67` (`flattenPlan`) — skip malformed days instead of white-screening. Replace `if (!plan) return null` (`:65`) with an error state.
- Banner per B2.

### D4. Ghost-entry fix (prayer + sermon notes) — reuse, don't delete-on-unmount (war-game #6)
"New" immediately POSTs an empty row (`prayer/page.tsx:90-105`, `sermon-notes/page.tsx:40-54`), leaving "Untitled" ghosts. Unmount-cleanup DELETE is unsafe (StrictMode double-mount would delete the open entry; tab close never fires it). **Fix:** "New" first checks the already-fetched list for an existing completely-empty entry and navigates to it instead of POSTing a new one. Ghosts self-heal to at most one, which the next "New" reuses.

### D5. Sermon-notes honesty & cleanup
- AudioRecorder recordings are never persisted (`SermonNoteEditor.tsx:199`); storage is out of scope → label the section "Record & download — audio isn't saved with the note" and warn (confirm dialog) before navigating away with an un-downloaded recording.
- Notes textarea `font-mono` (`:220`) → `font-sans`.
- Delete empty `/sermon-notes/new/` dir and orphan `library/highlights/page.tsx` redirect (both verified unreferenced).

### D6. Library: manage, not just view
- Per-row delete (trash icon + confirm) for highlights/bookmarks/notes using existing DELETE endpoints (verified present).
- Raw search `<input>` (`library:305`) → `Input` primitive.

---

## Phase E — First impressions

### E1. Landing: show the product
No binary screenshots. Build a **CSS product mockup** in the hero: a framed reader card (sepia bg, serif John 1:1-5, one highlighted verse, mini actions bar) — real markup, always in sync with the design. Hero copy left / mockup right, stacked on mobile. Add "Create account" button beside "Sign in" in the header (`page.tsx:17-22`).

### E2. First-run guidance (all three auth paths — war-game #8)
- Route new registrants to `/home`: `RegisterForm.tsx:104` (`router.push("/bible")` → `/home`) **and** `RegisterForm.tsx:64` (Google `callbackUrl: "/bible"` → `/home`). Leave `auth.config.ts:45` (logged-in user visiting auth pages → `/bible`) and the login flow as-is — returning users should land in the reader.
- On Home, when the user has no progress/highlights/enrollments: one-time dismissable **"Getting started" card** (localStorage flag) with three links: Read a chapter, Highlight a verse (deep-link John 1), Start a reading plan. Replaces the Today card for brand-new users.

### E3. PWA correctness
- Maskable icons: **two new** icon routes with ~20% safe-area padding (192 + 512, `purpose: "maskable"`), keeping the existing two as `purpose: "any"` → four manifest entries. (A single icon can't be both.)
- `themeColor` media variants in `layout.tsx:33-35` for light/dark.
- Manifest `shortcuts` for Read / Prayer / Memorize.

---

## Out of scope (do not do)
- Persisting sermon audio (needs a storage vendor) — D5 makes the UI honest instead.
- Full offline mode, push notifications, tour libraries, any schema change, removing anything.
- Redesigning share-card modal, search, or book/chapter selector — strongest surfaces, leave them.

## Sequencing
A → B → C → D → E. A4 and C3 land in the same commit. B1's primitives precede all adoption work.

## Verification (manual, after `lint && tsc && test && build` per phase)
- 375px: reach Settings, sign out, Prayer, Memorize, Sermon Notes via More sheet; ChapterNav fits without crushing the title.
- 820px: exactly one nav visible.
- Guest (signed-out) reader at lg: audio bar spans correctly with no phantom 220px offset.
- Start audio, select a verse: bars stack without overlap (both one-row and two-row audio bar).
- Reader: audio toggle and display settings one tap from the sticky bar; font-size setting affects parallel + interlinear.
- Keyboard-only: visible focus ring on landing, home, library, both navs.
- Dark mode: plans list/detail, success states, library dots readable.
- New account (credentials AND Google): lands on /home with Getting-started card; dismissal persists.
- Plan day: complete then un-complete a day; malformed passages JSON doesn't white-screen.
- Prayer/sermon: tap New, leave immediately, tap New again — no ghost accumulation.
- Lighthouse: installable, maskable icon passes.
