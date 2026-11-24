# ScamHisn AI — Chromium Browser Extension (Manifest V3)

Completely isolated from `ScamHisn AI [website]/`. Works on **Google Chrome, Microsoft Edge, Brave, Arc, and Opera**, calling your exact same ScamHisn AI `/api/v1/scan` & `/api/v1/report/pdf` backend.

---

## Folder Structure

```text
ScamHisn AI [extension]/
├── source/                     ← Editable extension source code
├── scripts/build.mjs           ← Generates both dev/ and deployable/ + .zip
├── dev/                        ← PRIVATE developer build ("Check Everything" UNLOCKED)
├── deployable/                 ← PRODUCTION build ("Check Everything" LOCKED — "Developers only")
└── scamhisn-extension-prod.zip ← Ready to upload directly to Chrome Web Store
```

---

## How to Load Locally in Chrome / Edge / Brave

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn ON **Developer mode** (top-right toggle).
3. Click **Load unpacked**:
   - Select **`deployable/`** to test the **Production** experience (*Check Everything* locked as *"Developers only"*, only *Check Manually* available).
   - Select **`dev/`** to test your **Private Developer** experience (*Check Everything* unlocked for auto-monitoring open web pages).
4. Pin **ScamHisn AI** to your Chrome toolbar, click the icon, click **⚙**, and enter your Render backend URL (e.g. `https://scamhisn-ai.onrender.com` — or `http://localhost:3001` for local testing).

---

## How to Deploy to the Chrome Web Store

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Click **New Item** and upload **`scamhisn-extension-prod.zip`**.
3. Fill in store description & screenshots (minimal permissions: `activeTab`, `storage`, `contextMenus` only — no broad `<all_urls>` content script in production!).
4. Submit for review.

## Rebuilding After Edits
If you edit anything inside `source/`, run:
```bash
node "ScamHisn AI [extension]/scripts/build.mjs"
```
This regenerates `dev/`, `deployable/`, and `scamhisn-extension-prod.zip` automatically.
