# ScamHisn AI (حصن الاحتيال) 🇦🇪

**ScamHisn AI (حصن الاحتيال)** is a production-ready, full-stack bilingual cybersecurity web application and versioned REST API (`/api/v1/scan`) that inspects suspicious URLs, job postings, and map/location links using an isolated local headless browser, free open-source technical forensics, a hardened anti-prompt-injection shield, and Google's **`gemini-3.5-flash-lite`** via the official `@google/genai` SDK.

---

## Key Capabilities

- **Three Dedicated Inspection Modes:**
  1. **General Link (`general`):** Detects phishing pages, UAE/global brand & government impersonation, credential harvesting, and deceptive redirects.
  2. **Job Post (`job`):** Verifies link/domain legitimacy first, then cross-checks employer existence, recruitment fees, and contact red flags—returning both a **Scam Likelihood %** and a **Job Authenticity Confidence %**.
  3. **Map Link (`map`):** Cross-references places with Google Maps & Google Search grounding and audits business descriptions & user reviews for **embedded prompt-injection attacks**, scam URLs, and hijacked contact numbers.
- **Free & Lightweight Local Forensic Pipeline:**
  - **Playwright Chromium Headless Shell** (`chromium --only-shell`) in isolated ephemeral contexts (downloads/storage blocked, heavy media/fonts aborted, capped redirects, per-hop SSRF validation).
  - **Strict SSRF Guard:** Blocks all private, loopback, link-local, cloud metadata (`169.254.169.254`), and IPv6 ULA (`::1`, `fc00::/7`) ranges after DNS resolution.
  - **SSL/TLS Certificate Inspector:** Built-in Node `tls` verification for validity, issuer, SAN hostname match, self-signed status, and days remaining.
  - **RDAP + WHOIS Domain Age:** Queries free public RDAP registries with a raw TCP WHOIS fallback (including `.ae`) to flag newly registered domains.
  - **Local Heuristics:** Punycode/IDN homograph spoofing, high-abuse TLDs, brand impersonation, security headers (HSTS/CSP/X-Frame-Options), DNS/MX/SPF/DMARC, cross-domain credential harvesting, and phishing-kit exfiltration markers.
- **Hardened Anti-Prompt-Injection & Decisive 0–100% Calibration:**
  - Multi-channel deterministic pre-scanner (visible text, hidden DOM, HTML comments, ARIA/data attributes, map reviews, Base64 payloads, zero-width & Unicode Tag Block `U+E0000–U+E007F` smuggling) in both English & Arabic.
  - Per-request cryptographic boundary tags (`<<<UNTRUSTED_PAGE_DATA_<UUID>>>>`) isolating all scraped evidence from Gemini system instructions.
  - Fatal smoking guns (broken SSL on login/payment forms, external credential harvesting, phishing-kit exfiltration, embedded prompt injection, confirmed impersonation) auto-escalate directly to **95–100% (Confirmed Scam)** with zero averaging dilution.
- **Bilingual UAE Arabic (RTL) & English (LTR) + Custom Animated Dark/Light Mode:**
  - Instant direction flip (`dir="rtl"` / `dir="ltr"`), natural refined Emirati Arabic phrasing, and tactile animated sun/clouds ↔ moon/stars theme toggle.

---

## Architecture

```text
packages/shared   (@scamhisn/shared)  → Shared TypeScript & Zod contracts (Web + API + Future Browser Extension)
apps/api          (@scamhisn/api)     → Express v1 REST API, SSRF/Playwright/TLS/RDAP/DNS/Gemini/Scoring Engine
apps/web          (@scamhisn/web)     → React 19 + Vite + Tailwind CSS v4 Bilingual Dashboard
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js `>= 20` (tested on Node 24)
- A Google AI Studio API key (`GEMINI_API_KEY`) for `gemini-3.5-flash-lite`

### Setup
```bash
# 1. Install workspace dependencies
npm install

# 2. Install lightweight Chromium headless shell for Playwright
npm run install:browser

# 3. Configure environment variables (NEVER commit .env)
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=...

# 4. Run API + Frontend in development mode
npm run dev
```

- Web UI: `http://localhost:5173`
- REST API: `http://localhost:3001/api/v1/health`

### Production Build & Tests
```bash
npm run typecheck
npm run build
npm test
npm start
```

---

## Versioned REST API (Browser-Extension Ready)

`CORS_ALLOW_EXTENSIONS=true` allows `chrome-extension://`, `moz-extension://`, and `safari-web-extension://` origins out of the box.

### `GET /api/v1/health`
Returns server status, active Gemini model (`gemini-3.5-flash-lite`), and whether `GEMINI_API_KEY` is configured.

### `POST /api/v1/scan`
```json
{
  "url": "https://example.com",
  "mode": "general",
  "locale": "ar"
}
```
Returns a strongly-typed `ScanResponse` (schema exported from `@scamhisn/shared`) containing `scamScore` (0–100), `verdict`, `smokingGunsTriggered`, `redFlags`, `technicalChecks`, `promptInjection`, and bilingual `aiAnalysis` (`summaryEn`, `summaryAr`, `jobAnalysis`, `mapAnalysis`, `groundingSources`).

---

## Deployment

### Docker / Docker Compose
```bash
cp .env.example .env
# Add GEMINI_API_KEY to .env
docker compose up --build -d
```

### Render (Blueprint)
Push this repository to GitHub and create a new **Blueprint** on Render pointing to `render.yaml`. Render will automatically prompt for `GEMINI_API_KEY` in the dashboard.

### Railway / Fly.io / Google Cloud Run
Deploy directly from the included `Dockerfile` and set `GEMINI_API_KEY` in your host's secrets/environment variables dashboard.
