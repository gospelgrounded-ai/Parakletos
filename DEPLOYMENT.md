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

## Step 5 — Deploy

Click **Deploy**. The first build will:
1. Install dependencies (`npm install` → runs `prisma generate`)
2. Push schema to Neon (`prisma db push`)
3. Seed reading plans (`tsx prisma/seed.ts`)
4. Build Next.js

This takes ~2 minutes. Once done you'll get a live URL.

## Step 6 — Fix NEXTAUTH_URL

After the first deploy, Vercel shows your actual URL (e.g. `parakletos-abc123.vercel.app`).
Go to **Vercel → Project → Settings → Environment Variables** and update `NEXTAUTH_URL` to match, then redeploy.

## Optional: Google OAuth

1. Go to https://console.developers.google.com/
2. Create a project → Enable Google+ API → Create OAuth credentials
3. Add `https://your-app.vercel.app/api/auth/callback/google` as an authorized redirect URI
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel env vars

## Local dev with PostgreSQL

If you want to use the Neon database locally too:
```bash
# .env.local
DATABASE_URL="<your neon pooled URL>"
DIRECT_URL="<your neon direct URL>"
AUTH_SECRET="<your secret>"
NEXTAUTH_URL="http://localhost:3000"
```
