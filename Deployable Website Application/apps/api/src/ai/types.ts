import type {
  AnomalyCheck,
  DnsCheck,
  DomAndFormsCheck,
  DomainRegistration,
  PromptInjectionReport,
  RedirectCheck,
  ScanMode,
  SecurityHeadersCheck,
  TlsCheck,
} from '@scamhisn/shared';
import type { BrowserInspectionResult } from '../inspectors/browserInspector.js';

/** Everything an AI provider (Gemini or a self-hosted model) receives for one scan. */
export interface AiAnalysisInput {
  mode: ScanMode;
  inputUrl: string;
  finalUrl: string;
  tls: TlsCheck;
  registration: DomainRegistration;
  redirects: RedirectCheck;
  headers: SecurityHeadersCheck;
  dns: DnsCheck;
  domAndForms: DomAndFormsCheck;
  anomalies: AnomalyCheck;
  promptInjection: PromptInjectionReport;
  browser: BrowserInspectionResult;
}
