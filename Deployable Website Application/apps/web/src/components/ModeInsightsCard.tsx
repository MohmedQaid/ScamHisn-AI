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
    const barColor = auth >= 75 ? 'bg-brand' : auth >= 45 ? 'bg-warn' : 'bg-danger';
    const redFlags = locale === 'ar' ? jobAnalysis.redFlagsAr : jobAnalysis.redFlagsEn;

    return (
      <div className="box p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Briefcase className="h-6 w-6 shrink-0 text-brand" strokeWidth={1.6} aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-ink">{t.labels.jobAuthenticityTitle}</h3>
            {jobAnalysis.companyName && (
              <p className="text-sm font-medium text-muted">{jobAnalysis.companyName}</p>
            )}
          </div>
        </div>

        {/* Job Authenticity Confidence Meter */}
        <div className="mb-4">
          <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">{t.labels.jobConfidenceLabel}</span>
            <span dir="ltr" className="text-xl font-extrabold text-ink">
              {auth}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-hairline">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${auth}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
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

        <p className="mt-4 text-sm leading-relaxed text-ink/85">
          {locale === 'ar' ? jobAnalysis.verificationNotesAr : jobAnalysis.verificationNotesEn}
        </p>

        {redFlags.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-danger">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
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
      <div className="box p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <MapPin className="h-6 w-6 shrink-0 text-brand" strokeWidth={1.6} aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-ink">{t.labels.mapVerificationTitle}</h3>
            {mapAnalysis.placeName && <p className="text-sm font-medium text-muted">{mapAnalysis.placeName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-3">
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
          <p className="mt-3 text-xs text-muted">
            {t.labels.coordinatesLabel}:{' '}
            <span dir="ltr" className="font-mono font-semibold text-ink">
              {mapAnalysis.coordinates.latitude.toFixed(5)},{' '}
              {mapAnalysis.coordinates.longitude.toFixed(5)}
            </span>
          </p>
        )}

        <p className="mt-3 text-sm leading-relaxed text-ink/85">
          {locale === 'ar' ? mapAnalysis.verificationNotesAr : mapAnalysis.verificationNotesEn}
        </p>
      </div>
    );
  }

  return null;
}

/** One check as a plain line: label, then a coloured tick or cross with its word. */
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
    <div className="flex items-center justify-between gap-3 border-t border-hairline py-2.5 text-sm">
      <span className="min-w-0 font-medium text-muted">{label}</span>
      <span className={`inline-flex shrink-0 items-center gap-1 font-bold ${ok ? 'text-brand' : 'text-danger'}`}>
        {ok ? (
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <XCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        )}
        <span>{ok ? okText : badText}</span>
      </span>
    </div>
  );
}
