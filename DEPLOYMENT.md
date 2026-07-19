# Deploying Parakletos to Vercel + Neon

## Step 1 — Create the database (Neon)

1. Go to **https://neon.tech** → sign up free
2. Create a new project (name it `parakletos`)
3. Once created, go to **Dashboard → Connection Details**
4. Copy two strings:
   - **Pooled connection** (endpoint has `.pooler.` in the URL) → this is your `DATABASE_URL`
   - **Direct connection** (no `.pooler.`) → this is your `DIRECT_URL`

## Step 2 — Generate AUTH_SECRET

Run this in your terminal (Mac/Linux/WSL):
```bash
openssl rand -base64 32
```
Save the output — you'll need it in Step 4.

## Step 3 — Import to Vercel

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Find and select **gospelgrounded-ai/Parakletos**
4. Set the branch to `claude/bible-study-app-design-wzn09v` (or main after merging)
5. Under **"Build & Development Settings"**, set:
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `.next` (leave default)
   - **Install Command**: `npm install` (leave default)
6. **Do NOT click Deploy yet** — add env vars first

## Step 4 — Set Environment Variables in Vercel

In the same import screen, expand **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | The pooled connection string from Neon |
| `DIRECT_URL` | The direct connection string from Neon |
| `AUTH_SECRET` | The string from Step 2 |
| `NEXTAUTH_URL` | `https://your-project-name.vercel.app` (use your actual Vercel URL — you can update this after first deploy) |
| `ELEVENLABS_API_KEY` | Optional — enables premium audio-Bible narration ([get a key](https://elevenlabs.io/app/settings/api-keys)) |
| `OPENAI_API_KEY` | Optional — used for audio-Bible narration if ElevenLabs isn't set ([get a key](https://platform.openai.com/api-keys)) |
| `API_BIBLE_KEY` | Optional — layers additional translations on top of Bolls.life ([get a key](https://scripture.api.bible/)). See `.env.example` for the licensing caveat on copyrighted translations. |

## Step 5 — Push the database schema

The build command (`prisma generate && next build`) does **not** touch the
database — it only regenerates the Prisma client. You must push the schema
and seed the reading plans yourself, once, before (or right after) the first
deploy:

```bash
# with DATABASE_URL and DIRECT_URL set in your local .env.local,
# pointed at the same Neon project you configured in Vercel:
npm run db:deploy   # = prisma db push && tsx prisma/seed.ts
```

Run `npm run db:push` again any time the schema changes (e.g. after pulling
an update) — it's additive-only and safe to re-run.

## Step 6 — Deploy

Click **Deploy**. The build will:
1. Install dependencies (`npm install` → runs `prisma generate`)
2. Build Next.js

This takes ~2 minutes. Once done you'll get a live URL.

## Step 7 — Fix NEXTAUTH_URL

After the first deploy, Vercel shows your actual URL (e.g. `parakletos-abc123.vercel.app`).
Go to **Vercel → Project → Settings → Environment Variables** and update `NEXTAUTH_URL` to match, then redeploy.

## Optional: Google OAuth

1. Go to https://console.developers.google.com/
2. Create a project → Enable Google+ API → Create OAuth credentials
3. Add `https://your-app.vercel.app/api/auth/callback/google` as an authorized redirect URI
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel env vars

## Optional: Password reset emails (Resend)

Without this, the "forgot password" page honestly tells users to email
support instead of sending a reset link.

1. Go to https://resend.com → sign up free → **API Keys** → create a key
2. Add `RESEND_API_KEY` to Vercel env vars
3. Verify a sending domain (**Domains** in the Resend dashboard) so you can
   send from `noreply@parakletos.app` — until a domain is verified, Resend
   will reject the send. If you don't own that domain, edit the `from`
   address in `src/app/api/auth/forgot-password/route.ts` to one you control.

## Local dev with PostgreSQL

If you want to use the Neon database locally too:
```bash
# .env.local
DATABASE_URL="<your neon pooled URL>"
DIRECT_URL="<your neon direct URL>"
AUTH_SECRET="<your secret>"
NEXTAUTH_URL="http://localhost:3000"
# Optional — audio-Bible narration:
ELEVENLABS_API_KEY="<your key>"
OPENAI_API_KEY="<your key>"
# Optional — additional translations via api.bible:
API_BIBLE_KEY="<your key>"
```

Then push the schema locally with `npm run db:deploy` (see Step 5 above).
