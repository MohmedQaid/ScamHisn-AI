import { Briefcase, CheckCircle2, MapPin, ShieldAlert, XCircle } from 'lucide-react';
import type { JobAuthenticityBreakdown, MapVerificationBreakdown } from '@scamhisn/shared';
import { useLocale } from '../i18n/LocaleContext';

interface ModeInsightsCardProps {
  jobAnalysis: JobAuthenticityBreakdown | null;
  mapAnalysis: MapVerificationBreakdown | null;
}

export function ModeInsightsCard({ jobAnalysis, mapAnalysis }: ModeInsightsCardProps) {
  const { locale, t } = useLocale();

  if (jobAnalysis) {
    const auth = jobAnalysis.jobAuthenticityScore;
    const barColor =
      auth >= 75
        ? 'bg-emerald-500'
        : auth >= 45
          ? 'bg-amber-500'
          : 'bg-rose-600';
    const redFlags = locale === 'ar' ? jobAnalysis.redFlagsAr : jobAnalysis.redFlagsEn;

    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0e161e] sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.labels.jobAuthenticityTitle}
            </h3>
            {jobAnalysis.companyName && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {jobAnalysis.companyName}
              </p>
            )}
          </div>
        </div>

        {/* Job Authenticity Confidence Meter */}
        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {t.labels.jobConfidenceLabel}
            </span>
            <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
              {auth}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${auth}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatusPill
            label={t.labels.linkLegitimacyLabel}
            ok={jobAnalysis.linkLegitimate}
            okText={t.labels.legitimate}
            badText={t.labels.suspiciousOrFake}
          />
          <StatusPill
            label={t.labels.companyVerificationLabel}
            ok={jobAnalysis.companyVerified}
            okText={t.labels.verified}
            badText={t.labels.unverified}
          />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {locale === 'ar' ? jobAnalysis.verificationNotesAr : jobAnalysis.verificationNotesEn}
        </p>

        {redFlags.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {redFlags.map((flag, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300"
              >
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (mapAnalysis) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0e161e] sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.labels.mapVerificationTitle}
            </h3>
            {mapAnalysis.placeName && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {mapAnalysis.placeName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatusPill
            label={t.labels.placeExistsLabel}
            ok={mapAnalysis.businessExistsOnExternalSources && mapAnalysis.placeVerified}
            okText={t.labels.verified}
            badText={t.labels.unverified}
          />
          <StatusPill
            label={t.labels.contactHijackLabel}
            ok={!mapAnalysis.contactHijackingSuspected}
            okText={t.labels.clean}
            badText={t.labels.flagged}
          />
          <StatusPill
            label={t.labels.reviewAuditLabel}
            ok={!mapAnalysis.reviewInjectionOrScamLinksFound}
            okText={t.labels.clean}
            badText={t.labels.flagged}
          />
        </div>

        {mapAnalysis.coordinates && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t.labels.coordinatesLabel}:{' '}
            <span dir="ltr" className="font-mono font-semibold text-slate-700 dark:text-slate-200">
              {mapAnalysis.coordinates.latitude.toFixed(5)},{' '}
              {mapAnalysis.coordinates.longitude.toFixed(5)}
            </span>
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {locale === 'ar' ? mapAnalysis.verificationNotesAr : mapAnalysis.verificationNotesEn}
        </p>
      </div>
    );
  }

  return null;
}

function StatusPill({
  label,
  ok,
  okText,
  badText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  badText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
          ok
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
        }`}
      >
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        <span>{ok ? okText : badText}</span>
      </span>
    </div>
  );
}
