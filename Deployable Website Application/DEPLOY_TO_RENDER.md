# Deploying ScamHisn AI (حصن الاحتيال) to Render

This `deployable/` folder contains everything Render needs to build and host the full-stack ScamHisn AI web app and `/api/v1/scan` REST API in a single Docker container (including Playwright Chromium headless shell).

---

## Option A — One-Click Blueprint Deploy (Recommended)

Render deploys directly from GitHub/GitLab/Bitbucket using the included `render.yaml` and `Dockerfile`.

### 1. Push this `deployable/` folder to GitHub
Create a new empty repository on GitHub (e.g., `scamhisn-ai`), then run inside this `deployable/` folder:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/scamhisn-ai.git
git push -u origin main
```

### 2. Create a Blueprint on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub account and select your `scamhisn-ai` repository.
4. Render automatically detects `render.yaml` and `Dockerfile`.
5. When prompted for **`GEMINI_API_KEY`**, paste your Gemini API key.
6. Click **Apply** to start the build & deploy!

---

## Option B — Manual Web Service (Docker)

If you prefer setting up a Web Service manually instead of using Blueprint:

1. Push `deployable/` to GitHub (Step 1 above).
2. In Render Dashboard, click **New +** → **Web Service**.
3. Select your GitHub repository.
4. Configure:
   - **Language / Runtime:** `Docker` (Render automatically detects `./Dockerfile`)
   - **Instance Type:** `Free` (for demos/testing) or `Starter` (recommended for faster cold-starts & heavier traffic)
   - **Health Check Path:** `/api/v1/health`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = *(your Gemini API key)*
   - `GEMINI_MODEL` = `gemini-3.5-flash-lite`
   - `NODE_ENV` = `production`
   - `PLAYWRIGHT_HEADLESS` = `true`
   - `MAX_CONCURRENT_SCANS` = `2`
   - `CORS_ALLOW_EXTENSIONS` = `true`
   - `CORS_ALLOWED_ORIGINS` = `*` *(or set to your Render URL `https://scamhisn-ai.onrender.com`)*
6. Click **Deploy Web Service**.

---

## Verify After Deploy
Once Render reports **Live** (first Docker build takes ~3–5 minutes because Chromium headless shell is installed inside the container):
- Visit `https://<your-service>.onrender.com/` for the bilingual web app.
- Visit `https://<your-service>.onrender.com/api/v1/health` to confirm `"status": "ok"` and `"aiConfigured": true`.
