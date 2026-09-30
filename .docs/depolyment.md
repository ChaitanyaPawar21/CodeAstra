# 🚀 CodeAstra — Vercel Deployment Guide

> **Stack:** React 19 · TypeScript · Vite · TailwindCSS 3 · React Router v7

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Pre-Deployment Checklist](#2-pre-deployment-checklist)
3. [Method A — Vercel Dashboard (Recommended)](#3-method-a--vercel-dashboard-recommended)
4. [Method B — Vercel CLI](#4-method-b--vercel-cli)
5. [Build & Output Settings](#5-build--output-settings)
6. [Environment Variables](#6-environment-variables)
7. [SPA Routing Fix](#7-spa-routing-fix)
8. [Preview & Production Deployments](#8-preview--production-deployments)
9. [Custom Domain](#9-custom-domain)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9.x | bundled with Node |
| Git | any | [git-scm.com](https://git-scm.com) |
| Vercel account | — | [vercel.com/signup](https://vercel.com/signup) |

---

## 2. Pre-Deployment Checklist

Run these locally before pushing to make sure the build is clean:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run TypeScript type check + production build
npm run build
```

> **Important:** The build script is `tsc -b && vite build`. Fix **all TypeScript errors** before deploying — Vercel will fail the build otherwise.

A successful build outputs static assets to `frontend/dist/`.

---

## 3. Method A — Vercel Dashboard (Recommended)

### Step 1 — Push to GitHub / GitLab / Bitbucket

Make sure your code is pushed to a remote repository.

```bash
git add .
git commit -m "chore: ready for deployment"
git push origin main
```

### Step 2 — Import the project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Add New → Project"**
3. Select your Git provider and find the **`codeAstra`** repository
4. Click **"Import"**

### Step 3 — Configure build settings

On the **"Configure Project"** screen, set the following:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> **Note:** Setting **Root Directory** to `frontend` tells Vercel to treat that folder as the project root — correct for a monorepo layout.

### Step 4 — Add environment variables

See [Section 6 — Environment Variables](#6-environment-variables).

### Step 5 — Deploy

Click **"Deploy"**. Vercel will:

1. Clone the repo
2. `cd frontend && npm install`
3. Run `npm run build`
4. Serve `dist/` on a global CDN

Your site will be live at `https://codeastra-<hash>.vercel.app` in ~60 seconds.

---

## 4. Method B — Vercel CLI

### Install the CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy from the frontend directory

```bash
cd frontend
vercel
```

Follow the interactive prompts:

```
? Set up and deploy "frontend"? → Y
? Which scope? → <your Vercel team/account>
? Link to existing project? → N
? What's your project's name? → codeastra
? In which directory is your code located? → ./
? Want to modify these settings? → Y
  Build Command: npm run build
  Output Directory: dist
  Development Command: npm run dev
```

### Deploy to production

```bash
vercel --prod
```

---

## 5. Build & Output Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Framework | `Vite` | Auto-detected |
| Root Directory | `frontend` | Monorepo root |
| Build Command | `npm run build` | Runs `tsc -b && vite build` |
| Output Directory | `dist` | Vite default |
| Node.js Version | `18.x` or `20.x` | Set in Vercel project settings |

---

## 6. Environment Variables

If the frontend communicates with a backend API, set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `VITE_API_BASE_URL` | `https://api.codeastra.dev` | Backend API base URL |
| `VITE_APP_ENV` | `production` | App environment flag |

> **Important:** Vite **only** exposes variables prefixed with `VITE_` to the browser bundle. Never store secrets (API keys, DB credentials) in `VITE_*` variables — they are public.

### Local development `.env`

Create `frontend/.env.local` (gitignored by default):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
```

---

## 7. SPA Routing Fix

Since **React Router v7** handles routing client-side, refreshing any non-root route (e.g. `/dashboard`) returns a **404** from Vercel's CDN without this fix.

Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/((?!api/.*).*)",
      "destination": "/index.html"
    }
  ]
}
```

This rewrites all non-API routes to `index.html`, letting React Router take over.

---

## 8. Preview & Production Deployments

Vercel creates **automatic preview deployments** for every pull request / branch push.

| Branch | Deployment Type | URL Pattern |
|--------|----------------|-------------|
| `main` / `master` | **Production** | `codeastra.vercel.app` |
| Any other branch | **Preview** | `codeastra-git-<branch>-<org>.vercel.app` |
| Pull Request | **Preview** | Auto-commented on the PR |

### Promote a preview to production

```bash
vercel promote <deployment-url> --scope <your-scope>
```

---

## 9. Custom Domain

1. **Vercel Dashboard → Project → Settings → Domains**
2. Add your domain, e.g. `codeastra.yourdomain.com`
3. Update your DNS provider with the records Vercel shows:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

SSL is provisioned automatically via Let's Encrypt.

---

## 10. Troubleshooting

### ❌ Build fails: TypeScript errors

```
error TS2345: Argument of type ...
```

**Fix:** Run `npm run build` locally and resolve all TS errors before pushing.

---

### ❌ 404 on page refresh

**Fix:** Add `frontend/vercel.json` with the SPA rewrite rule — see [Section 7](#7-spa-routing-fix).

---

### ❌ `VITE_API_BASE_URL` is `undefined` in production

**Fix:** Add the variable in **Vercel → Settings → Environment Variables** and redeploy. The prefix must be exactly `VITE_`.

---

### ❌ Build can't find `package.json`

**Fix:** In Vercel project settings → **Root Directory** → set to `frontend`.

---

### ❌ Node version mismatch

**Fix:** Go to **Vercel → Project → Settings → General → Node.js Version** and select `20.x`.

---

### ❌ React Router routes return 404 after deploy

**Fix:** Ensure `frontend/vercel.json` is in place with the rewrite rule from [Section 7](#7-spa-routing-fix).

---

## Quick Reference

```bash
# Local build test
cd frontend && npm run build

# First deploy (interactive)
cd frontend && vercel

# Production deploy
cd frontend && vercel --prod

# View deployment logs
vercel logs <deployment-url>

# List all deployments
vercel ls
```

---

*Last updated: September 2026 · CodeAstra Frontend v0.0.0*

