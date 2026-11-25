# ScamHisn AI for Chrome

Check a link without leaving the page you are on. The extension uses the same scanner as the website, so the verdict, the evidence and the Aman reporting channels are identical.

Works in Chrome, Edge, Brave, Arc and Opera (any Chromium browser, Manifest V3).

## Install it in two minutes

1. [Download the extension (.zip)](https://scamhisn-ai-v1.onrender.com/scamhisn-extension.zip) and unzip it. If you cloned this repository, you can use the `deployable/` folder instead.
2. Open `chrome://extensions`, switch on **Developer mode**, click **Load unpacked** and choose the folder.
3. Click the ScamHisn AI icon in the toolbar, or right-click any link and choose **Inspect link with ScamHisn AI**.

The ⚙ button in the popup sets which server the extension talks to. It starts on `https://scamhisn-ai-v1.onrender.com`; use `http://localhost:3001` when you run the app yourself.

## What is in this folder

| Path | What it is |
|---|---|
| `deployable/` | The public build, ready to load. This is what the download above contains. |
| `source/` | The code to edit. It also holds the automatic page scanning that the public build leaves out. |
| `scripts/build.mjs` | Builds everything from `source/`. |

## Two builds, on purpose

- **Public (`deployable/`)** checks a link only when you ask. Automatic scanning of every page is shown as "Developers only", so a public install cannot run up API costs for the team.
- **Developer (`dev/`)** has automatic scanning unlocked and talks to a local server. It is created by the build script and is not kept in git.

The public build asks for three permissions only: the active tab, storage for your settings, and the right-click menu.

## Rebuild after a change

```bash
node "Chrome Extension/scripts/build.mjs"
```

This rewrites `deployable/`, creates `dev/`, and updates the download the website serves.
