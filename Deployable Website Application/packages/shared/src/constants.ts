export const API_V1_PREFIX = '/api/v1';

export const API_ENDPOINTS = {
  health: `${API_V1_PREFIX}/health`,
  scan: `${API_V1_PREFIX}/scan`,
  reportPdf: `${API_V1_PREFIX}/report/pdf`,
} as const;

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export const VERDICT_THRESHOLDS = {
  SAFE_MAX: 19,
  CAUTION_MAX: 44,
  SUSPICIOUS_MAX: 74,
  HIGH_RISK_MAX: 94,
  CONFIRMED_SCAM_MIN: 95,
} as const;

export const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
} as const;
