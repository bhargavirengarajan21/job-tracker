# Deployment Guide

This app has **two pieces** that deploy to **two different places**:

| Piece | What it is | Where to deploy |
|-------|------------|-----------------|
| `client/` | React (Create React App) static site | **Vercel** ✅ |
| `server/` | Node/Express API (SQLite via sql.js, file uploads, cron + Puppeteer) | **Render / Railway / Fly.io** — NOT Vercel |

## Why the backend can't go on Vercel

Vercel runs backends as **serverless functions**, which are stateless and short-lived. This backend needs a **long-running server** because it:

- Writes its database to a local file (`jobtracker.db` via `sql.js`) — serverless filesystems are read-only/ephemeral, so data would vanish.
- Runs a daily **cron job** (`node-cron`) — serverless functions don't stay alive to fire cron.
- Uses **Puppeteer** (headless Chrome) for the company job-scraper — too heavy for serverless.

So: **frontend → Vercel, backend → a host that runs a persistent Node process.** Render is the simplest; steps below use it.

---

## Step 1 — Deploy the backend (Render)

1. Push this repo to GitHub (see "Before you deploy" at the bottom).
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo.
3. Configure:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** at least the paid **Starter** if you want the DB to persist (the free tier's disk is wiped on every deploy/restart — fine for testing, loses data otherwise).
4. Add a **Persistent Disk** (Render → your service → *Disks*) mounted so `jobtracker.db` survives restarts. Mount path e.g. `/opt/render/project/src/server` (or move the DB onto the disk — see note below).
5. Set **Environment Variables** (Render → *Environment*):
   ```
   JWT_SECRET       = <a long random string — generate with: openssl rand -hex 32>
   ANTHROPIC_API_KEY = <your Anthropic key>
   ```
   Do **not** set `PORT` — Render provides it and the app already reads `process.env.PORT`.
6. Deploy. Note the public URL, e.g. `https://job-tracker-api.onrender.com`.
7. Test it: open `https://<your-url>/api/health` — you should see `{"status":"ok",...}`.

> **Puppeteer note:** Render's standard Node environment includes the libraries Chromium needs, and Puppeteer downloads its own Chromium on `npm install`. If the job-scraper ever fails to launch Chrome, switch that service to a **Docker** deploy using Puppeteer's official base image. The scraper only runs if you add tracked companies via the cron API — the core app (applications, ATS scanner, job board, resume generator) works without it.

## Step 2 — Deploy the frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the same GitHub repo.
2. Configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Create React App (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `build` (default)
3. Add an **Environment Variable** (Vercel → *Settings → Environment Variables*):
   ```
   REACT_APP_API_URL = https://<your-render-url>/api
   ```
   ⚠️ CRA bakes env vars in **at build time**, so set this *before* the first build. If you add it later, trigger a redeploy.
4. Deploy. Your app is live at `https://<project>.vercel.app`.

## Step 3 — Connect them (CORS)

The backend currently allows all origins (`app.use(cors())`), so the Vercel site can call it out of the box. To lock it down to just your frontend, edit `server/index.js`:

```js
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
```

and set `CLIENT_URL=https://<project>.vercel.app` on Render.

---

## Before you deploy — checklist

- [ ] **Rotate your Anthropic API key.** The current key sits in `server/.env` on your machine. `.env` is gitignored (good, it won't be pushed), but set the key as an env var on Render instead of committing it anywhere.
- [ ] **Set a strong `JWT_SECRET`** in Render env vars (don't ship the dev default).
- [ ] Optionally delete `server/jobtracker.db` locally so production starts with a clean database (it's recreated automatically on first run).
- [ ] Confirm `server/.gitignore` still lists `.env`, `jobtracker.db`, `uploads/`, `node_modules/`.

## Free-tier alternative for the database

If you don't want a paid persistent disk, the cleanest long-term option is to move off the single-file `sql.js` database to a hosted Postgres (Render, Supabase, and Neon all have free tiers). That's a code change (swap `db.js` for a Postgres client) — not required to launch, but worth it once you have real users, since the current file-based DB is single-writer and doesn't survive a wiped disk.
