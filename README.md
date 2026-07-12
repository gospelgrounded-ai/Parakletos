# Parakletos

_Παράκλητος — "The Helper"_

A Bible study app: multiple translations, highlights, notes, cross-references,
commentaries, word studies, reading plans, a prayer journal, verse
memorization, and an audio Bible — with no ads, no social feed, and no
subscription.

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Prisma](https://www.prisma.io) + PostgreSQL ([Neon](https://neon.tech))
- [Auth.js v5](https://authjs.dev) (email/password + Google OAuth)
- Tailwind CSS + [Radix UI](https://www.radix-ui.com) primitives
- Bible text and study data from [Bolls.life](https://bolls.life),
  [bible.helloao.org](https://bible.helloao.org), [Open Scriptures](https://openscriptures.org),
  and [openbible.info](https://openbible.info) (see attribution in the app's Terms page)
- Optional: [ElevenLabs](https://elevenlabs.io) or [OpenAI](https://platform.openai.com) for
  audio-Bible narration; [Resend](https://resend.com) for password-reset emails

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Neon + Auth.js values
npm run db:deploy            # push the schema and seed reading plans
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a full walkthrough of provisioning Neon + Vercel from scratch, see
[DEPLOYMENT.md](./DEPLOYMENT.md).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npm run test` | Run the Vitest suite |
| `npm run db:push` | Push schema changes to the database (additive-only, safe to re-run) |
| `npm run db:deploy` | `db:push` + seed the reading plans |
| `npm run db:studio` | Open Prisma Studio |

## Project layout

```
src/
  app/                 Routes (App Router) — pages and API routes
  components/          UI components, grouped by feature
  lib/                 Server-side logic: Bible API client, caching, auth helpers
  hooks/                Client-side React hooks
  data/                Static datasets (Verse of the Day list, cross-references, lexicon)
prisma/
  schema.prisma        Database schema
  seed.ts               Reading-plan seed data
```

## Contributing / CI

Pushes and pull requests run lint, typecheck, tests, and a production build
via GitHub Actions (`.github/workflows/ci.yml`). Run the same checks locally
before pushing:

```bash
npm run lint && npx tsc --noEmit && npm run test && npm run build
```
