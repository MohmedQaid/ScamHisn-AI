import { EXTENSION_CONFIG } from './config.js';

const CONTEXT_MENU_ID = 'scamhisn-inspect-link';
const scanCache = new Map();
const MAX_CACHE_ENTRIES = 100;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Inspect link with ScamHisn AI',
      contexts: ['link'],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.linkUrl) return;
  await chrome.storage.local.set({
    pendingContextUrl: info.linkUrl,
    pendingContextTimestamp: Date.now(),
  });
  if (chrome.action && typeof chrome.action.openPopup === 'function') {
    try {
      await chrome.action.openPopup();
    } catch {
      // Fallback: user can click the toolbar icon and the link will be pre-filled
    }
  }
});

async function getApiBase() {
  const stored = await chrome.storage.sync.get(['apiBaseUrl']);
  const raw = (stored.apiBaseUrl || EXTENSION_CONFIG.DEFAULT_API_BASE || '').trim();
  return raw.replace(/\/$/, '');
}

// Dev-only background proxy for "Check Everything" auto-monitoring
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'DEV_AUTO_SCAN_URL') return false;

  // Hard production guard: never allow auto-scanning when DEV_MODE is false
  if (!EXTENSION_CONFIG.DEV_MODE) {
    sendResponse({ ok: false, error: 'DEVELOPERS_ONLY' });
    return false;
  }

  const targetUrl = String(message.url || '').trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    sendResponse({ ok: false, error: 'INVALID_URL' });
    return false;
  }

  if (scanCache.has(targetUrl)) {
    sendResponse({ ok: true, data: scanCache.get(targetUrl) });
    return false;
  }

  (async () => {
    try {
      const state = await chrome.storage.local.get(['devAutoMonitorEnabled']);
      if (!state.devAutoMonitorEnabled) {
        sendResponse({ ok: false, error: 'MONITOR_DISABLED' });
        return;
      }

      const apiBase = await getApiBase();
      const res = await fetch(`${apiBase}/api/v1/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-ScamHisn-Client': 'chrome-extension-dev/1.0.0',
        },
        body: JSON.stringify({ url: targetUrl, mode: 'general', locale: 'en' }),
      });

      if (!res.ok) {
        sendResponse({ ok: false, error: `HTTP_${res.status}` });
        return;
      }

      const data = await res.json();
      if (scanCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = scanCache.keys().next().value;
        if (oldestKey) scanCache.delete(oldestKey);
      }
      scanCache.set(targetUrl, {
        scamScore: data.scamScore,
        verdict: data.verdict,
      });

      sendResponse({ ok: true, data: { scamScore: data.scamScore, verdict: data.verdict } });
    } catch (err) {
      sendResponse({ ok: false, error: err instanceof Error ? err.message : 'NETWORK_ERROR' });
    }
  })();

  return true;
});
