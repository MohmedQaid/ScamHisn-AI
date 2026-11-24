import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_GEMINI_MODEL } from '@scamhisn/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from monorepo root first, then local fallback without overwriting existing env vars
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

function parseOrigins(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const rawApiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const isPlaceholderKey =
  rawApiKey.length === 0 ||
  rawApiKey.toLowerCase().includes('your_google_ai_studio') ||
  rawApiKey.toLowerCase() === 'changeme';

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePositiveInt(process.env.PORT, 3001),
  geminiApiKey: isPlaceholderKey ? null : rawApiKey,
  geminiModel: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
  corsAllowedOrigins: parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
  corsAllowExtensions: parseBool(process.env.CORS_ALLOW_EXTENSIONS, true),
  playwrightHeadless: parseBool(process.env.PLAYWRIGHT_HEADLESS, true),
  scanTimeoutMs: parsePositiveInt(process.env.SCAN_TIMEOUT_MS, 25_000),
  navigationTimeoutMs: parsePositiveInt(process.env.NAVIGATION_TIMEOUT_MS, 15_000),
  maxConcurrentScans: parsePositiveInt(process.env.MAX_CONCURRENT_SCANS, 3),
  maxRedirectHops: parsePositiveInt(process.env.MAX_REDIRECT_HOPS, 8),
  rateLimitWindowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: parsePositiveInt(process.env.RATE_LIMIT_MAX, 20),
} as const;
