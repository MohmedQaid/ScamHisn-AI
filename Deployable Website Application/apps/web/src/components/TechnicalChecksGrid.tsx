import {
  CalendarClock,
  CheckCircle2,
  Cpu,
  ExternalLink,
  FileCode2,
  GitFork,
  Lock,
  ShieldCheck,
  ShieldX,
  XCircle,
} from 'lucide-react';
import type { PromptInjectionReport, TechnicalChecks } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';

interface TechnicalChecksGridProps {
  checks: TechnicalChecks;
  promptInjection: PromptInjectionReport;
}

export function TechnicalChecksGrid({ checks, promptInjection }: TechnicalChecksGridProps) {
  const { t } = useLocale();
  const { tls, domainRegistration, redirects, headers, dns, domAndForms, anomalies } = checks;

  const sslStatus: 'good' | 'warn' | 'bad' = !tls.isHttps
    ? 'bad'
    : tls.valid
      ? 'good'
      : tls.checked
        ? 'bad'
        : 'warn';

  const domainStatus: 'good' | 'warn' | 'bad' = domainRegistration.isNewlyRegistered
    ? 'bad'
    : domainRegistration.isYoungDomain || domainRegistration.source === 'unavailable'
      ? 'warn'
      : 'good';

  const redirectStatus: 'good' | 'warn' | 'bad' =
    redirects.maxHopsExceeded || redirects.hopCount >= 4
      ? 'bad'
      : redirects.crossDomainRedirect
        ? 'warn'
        : 'good';

  const headerStatus: 'good' | 'warn' | 'bad' =
    headers.missingCriticalHeaders.length === 0
      ? 'good'
      : headers.missingCriticalHeaders.length <= 2
        ? 'warn'
        : 'bad';

  const domStatus: 'good' | 'warn' | 'bad' =
    domAndForms.externalFormActions.length > 0 ||
    domAndForms.exfiltrationEndpoints.length > 0 ||
    anomalies.hasMixedScriptHomograph ||
    Boolean(anomalies.impersonatedBrand)
      ? 'bad'
      : domAndForms.hasSensitiveInputs ||
          domAndForms.obfuscatedScriptIndicators.length > 0 ||
          anomalies.suspiciousTld
        ? 'warn'
        : 'good';

  const piStatus: 'good' | 'warn' | 'bad' = promptInjection.detected ? 'bad' : 'good';

  return (
    <section>
      <h3 className="mb-3.5 text-base font-extrabold text-slate-900 dark:text-white">
        {t.technicalChecksTitle}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. SSL / TLS Card */}
        <CheckCard title={t.cards.sslTitle} icon={Lock} status={sslStatus}>
          <MetricRow
            label="TLS"
            value={
              !tls.isHttps
                ? t.labels.noHttps
                : tls.valid
                  ? `${t.labels.valid}${tls.protocol ? ` (${tls.protocol})` : ''}`
                  : t.labels.invalid
            }
            highlight={sslStatus}
          />
          {tls.issuer && <MetricRow label={t.labels.issuer} value={tls.issuer} mono />}
          {tls.daysRemaining !== null && (
            <MetricRow
              label={t.labels.expiresIn}
              value={`${tls.daysRemaining} ${t.labels.days}`}
              highlight={tls.daysRemaining < 15 ? 'bad' : 'good'}
            />
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tls.selfSigned && <MiniChip text={t.labels.selfSigned} tone="bad" />}
            {tls.expired && <MiniChip text={t.labels.expired} tone="bad" />}
            {tls.hostnameMismatch && <MiniChip text={t.labels.mismatch} tone="bad" />}
          </div>
        </CheckCard>

        {/* 2. Domain Age & Registration */}
        <CheckCard title={t.cards.domainTitle} icon={CalendarClock} status={domainStatus}>
          <MetricRow
            label={t.labels.domainAge}
            value={
              domainRegistration.domainAgeDays !== null
                ? `${domainRegistration.domainAgeDays.toLocaleString()} ${t.labels.days}`
                : t.labels.unavailable
            }
            highlight={domainStatus}
          />
          <MetricRow
            label={t.labels.registrar}
            value={domainRegistration.registrar ?? t.labels.unavailable}
          />
          <MetricRow
            label={t.labels.created}
            value={
              domainRegistration.createdAt
                ? domainRegistration.createdAt.slice(0, 10)
                : t.labels.unavailable
            }
            mono
          />
          {domainRegistration.isNewlyRegistered && (
            <div className="mt-2">
              <MiniChip text={t.labels.newlyRegistered} tone="bad" />
            </div>
          )}
        </CheckCard>

        {/* 3. Redirects & Destination */}
        <CheckCard title={t.cards.redirectTitle} icon={GitFork} status={redirectStatus}>
          <MetricRow
            label={t.labels.hops}
            value={`${redirects.hopCount}`}
            highlight={redirectStatus}
          />
          <MetricRow
            label={t.labels.httpStatus}
            value={headers.httpStatus ? `${headers.httpStatus}` : t.labels.unavailable}
            mono
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <MiniChip
              text={redirects.crossDomainRedirect ? t.labels.crossDomain : t.labels.sameDomain}
              tone={redirects.crossDomainRedirect ? 'warn' : 'good'}
            />
          </div>
          {redirects.chain.length > 1 && (
            <div className="mt-2.5 max-h-20 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-2 dark:bg-slate-900/70">
              {redirects.chain.map((hop, idx) => (
                <p
                  key={`${hop.url}-${idx}`}
                  dir="ltr"
                  className="truncate font-mono text-[10.5px] text-slate-600 dark:text-slate-400"
                >
                  {idx + 1}. {hop.status ? `[${hop.status}] ` : ''}
                  {hop.url}
                </p>
              ))}
            </div>
          )}
        </CheckCard>

        {/* 4. Security Headers & DNS Auth */}
        <CheckCard title={t.cards.headersDnsTitle} icon={Cpu} status={headerStatus}>
          <div className="flex flex-wrap gap-1.5">
            <HeaderBadge name="HSTS" present={headers.hsts} />
            <HeaderBadge name="CSP" present={headers.csp} />
            <HeaderBadge name="X-Frame" present={headers.xFrameOptions} />
            <HeaderBadge name="NoSniff" present={headers.xContentTypeOptions} />
            <HeaderBadge name="SPF" present={dns.hasSpf} />
            <HeaderBadge name="DMARC" present={dns.hasDmarc} />
            <HeaderBadge name="MX" present={dns.mxRecords.length > 0} />
          </div>
          {checks.ssrf.resolvedIps.length > 0 && (
            <p
              dir="ltr"
              className="mt-3 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400"
            >
              IP: {checks.ssrf.resolvedIps.slice(0, 2).join(', ')}
            </p>
          )}
        </CheckCard>

        {/* 5. DOM, Forms & Anomalies */}
        <CheckCard title={t.cards.domFormsTitle} icon={FileCode2} status={domStatus}>
          <MetricRow
            label={t.labels.sensitiveForms}
            value={domAndForms.hasSensitiveInputs ? t.labels.yes : t.labels.no}
            highlight={domAndForms.hasSensitiveInputs ? 'warn' : 'good'}
          />
          <MetricRow
            label={t.labels.externalFormPost}
            value={
              domAndForms.externalFormActions.length > 0
                ? `${domAndForms.externalFormActions.length}`
                : t.labels.no
            }
            highlight={domAndForms.externalFormActions.length > 0 ? 'bad' : 'good'}
          />
          <MetricRow
            label={t.labels.hiddenElements}
            value={`${domAndForms.hiddenElementCount}`}
            highlight={domAndForms.hiddenElementCount > 10 ? 'warn' : 'good'}
          />
          {anomalies.impersonatedBrand && (
            <MetricRow
              label={t.labels.impersonatedBrand}
              value={anomalies.impersonatedBrand}
              highlight="bad"
            />
          )}
          {anomalies.hasMixedScriptHomograph && (
            <div className="mt-2">
              <MiniChip text={t.labels.punycodeHomograph} tone="bad" />
            </div>
          )}
        </CheckCard>

        {/* 6. Prompt-Injection Defense Shield */}
        <CheckCard
          title={t.cards.injectionShieldTitle}
          icon={promptInjection.detected ? ShieldX : ShieldCheck}
          status={piStatus}
        >
          <MetricRow
            label="Status"
            value={promptInjection.detected ? t.labels.attackDetected : t.labels.cleanShield}
            highlight={piStatus}
          />
          <MetricRow
            label={t.labels.zeroWidthChars}
            value={`${promptInjection.zeroWidthCharCount}`}
            highlight={promptInjection.zeroWidthCharCount >= 10 ? 'warn' : 'good'}
          />
          {promptInjection.detected && (
            <MetricRow
              label={t.labels.channelsDetected}
              value={Array.from(new Set(promptInjection.findings.map((f) => f.channel))).join(', ')}
              highlight="bad"
              mono
            />
          )}
        </CheckCard>
      </div>
    </section>
  );
}

function CheckCard({
  title,
  icon: Icon,
  status,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'good' | 'warn' | 'bad';
  children: React.ReactNode;
}) {
  const ring =
    status === 'good'
      ? 'border-slate-200/90 dark:border-slate-800'
      : status === 'warn'
        ? 'border-amber-300/80 dark:border-amber-500/30'
        : 'border-rose-300/90 dark:border-rose-500/40';

  const iconTone =
    status === 'good'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
      : status === 'warn'
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400';

  return (
    <div
      className={`flex flex-col rounded-3xl border bg-white p-4.5 shadow-xs transition-colors dark:bg-[#0e161e] ${ring}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl ${iconTone}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            status === 'good'
              ? 'bg-emerald-500'
              : status === 'warn'
                ? 'bg-amber-500'
                : 'bg-rose-600'
          }`}
        />
      </div>
      <div className="space-y-2 text-xs">{children}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: 'good' | 'warn' | 'bad';
  mono?: boolean;
}) {
  const valColor =
    highlight === 'bad'
      ? 'font-bold text-rose-700 dark:text-rose-400'
      : highlight === 'warn'
        ? 'font-semibold text-amber-700 dark:text-amber-400'
        : highlight === 'good'
          ? 'font-semibold text-emerald-700 dark:text-emerald-400'
          : 'font-medium text-slate-800 dark:text-slate-200';

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
      <span
        dir={mono ? 'ltr' : undefined}
        className={`truncate text-end ${mono ? 'font-mono text-[11px]' : ''} ${valColor}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function HeaderBadge({ name, present }: { name: string; present: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-semibold ${
        present
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300'
          : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400'
      }`}
    >
      {present ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      <span>{name}</span>
    </span>
  );
}

function MiniChip({ text, tone }: { text: string; tone: 'good' | 'warn' | 'bad' }) {
  const cls =
    tone === 'good'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/25'
      : tone === 'warn'
        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/25'
        : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-500/30';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {text}
    </span>
  );
}

export { ExternalLink };
