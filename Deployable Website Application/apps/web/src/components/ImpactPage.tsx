import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { IMPACT, IMPACT_SOURCES } from '../data/impact';
import { SectionHeading } from './ScribbleUnderline';

function Tag({ children, tone }: { children: ReactNode; tone: 'measured' | 'estimate' | 'cited' }) {
  const styles = {
    measured: 'bg-brand-tint text-brand',
    estimate: 'bg-warn-tint text-warn',
    cited: 'bg-hairline text-ink',
  } as const;
  return (
    <span
      className={`inline-block rounded-[5px] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rtl:tracking-normal ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-hairline py-10 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SectionHeading>{title}</SectionHeading>
        {tag}
      </div>
      {children}
    </section>
  );
}

function Ref({ id }: { id: number }) {
  return (
    <a
      href={`#source-${id}`}
      className="ms-1 align-super text-[10px] font-bold text-brand no-underline hover:underline"
    >
      [{id}]
    </a>
  );
}

/** Turns "[4]" markers inside a sentence into links to the source list. */
function withRefs(text: string): ReactNode[] {
  return text.split(/(\[\d+\])/g).map((part, idx) => {
    const m = /^\[(\d+)\]$/.exec(part);
    return m ? <Ref key={idx} id={Number(m[1])} /> : <span key={idx}>{part}</span>;
  });
}

export function ImpactPage() {
  const { locale, t } = useLocale();
  const c = IMPACT[locale];
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <article className="mx-auto w-full max-w-4xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <a
        href="#/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand"
      >
        <BackIcon className="h-3.5 w-3.5" />
        {t.nav.back}
      </a>

      <header className="pb-10 pt-6 sm:pb-14">
        <p className="text-sm font-extrabold text-brand">
          {c.eyebrow}
        </p>
        <h1 className="mt-3 text-[40px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-6xl sm:leading-[1.1] rtl:leading-[1.3] rtl:tracking-normal sm:rtl:leading-[1.3]">
          {c.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/80 sm:text-lg">
          {c.lead}
        </p>
      </header>

      {/* The problem */}
      <Section title={c.problemTitle} tag={<Tag tone="cited">{c.citedTag}</Tag>}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {c.problemStats.map((s) => (
            <div key={s.label}>
              <dt className="text-3xl font-extrabold tracking-tight text-danger sm:text-4xl">
                {s.value}
              </dt>
              <dd className="mt-1.5 text-sm leading-snug text-ink/80">
                {s.label}
                <Ref id={s.source} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-7 max-w-2xl text-sm leading-relaxed text-muted">
          {withRefs(c.problemNote)}
        </p>
      </Section>

      {/* Measured accuracy */}
      <Section title={c.accuracyTitle} tag={<Tag tone="measured">{c.measuredTag}</Tag>}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
          {c.accuracyStats.map((s) => (
            <div key={s.label}>
              <dt className="text-4xl font-extrabold tracking-tight text-brand sm:text-5xl">
                {s.value}
              </dt>
              <dd className="mt-1.5 text-sm leading-snug text-ink/80">{s.label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-7 max-w-2xl text-sm leading-relaxed text-muted">
          {c.accuracyNote}
        </p>
      </Section>

      {/* Running cost */}
      <Section title={c.costTitle} tag={<Tag tone="estimate">{c.estimateTag}</Tag>}>
        <p className="max-w-2xl text-lg font-semibold leading-snug text-ink sm:text-xl">
          {c.costLead}
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-outline text-xs font-bold text-muted">
                {c.costHeaders.map((h) => (
                  <th key={h} scope="col" className="py-2 pe-4 text-start font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.costRows.map((row) => (
                <tr key={row.scale} className="border-b border-hairline">
                  <th scope="row" className="py-2.5 pe-4 text-start font-bold text-ink">
                    {row.scale}
                  </th>
                  <td className="py-2.5 pe-4 text-ink/80">{row.users}</td>
                  <td className="py-2.5 pe-4 text-ink">{row.withoutLookups}</td>
                  <td className="py-2.5 pe-4 text-ink">{row.withLookups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
          {withRefs(c.costNote)}
        </p>
      </Section>

      {/* Savings */}
      <Section title={c.savingsTitle} tag={<Tag tone="estimate">{c.estimateTag}</Tag>}>
        <p className="max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
          {c.savingsHeadline}
        </p>
        <ol className="mt-6 max-w-2xl space-y-2 text-sm text-ink/80">
          {c.savingsSteps.map((step) => (
            <li key={step} className="border-s-2 border-brand ps-3">
              {withRefs(step)}
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
          {c.savingsNote}
        </p>
      </Section>

      {/* Fallback chain */}
      <Section title={c.chainTitle}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-bold text-ink">
          {c.chainSteps.map((step, idx) => (
            <li key={step} className="flex items-center gap-2">
              <span className="ink-line rounded-[10px] bg-surface px-3 py-1.5">{step}</span>
              {idx < c.chainSteps.length - 1 && (
                <span aria-hidden="true" className="text-muted">
                  {locale === 'ar' ? '←' : '→'}
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">{c.chainNote}</p>
      </Section>

      {/* Roadmap */}
      <Section
        title={c.roadmapTitle}
        tag={
          <span className="rounded-[5px] bg-hairline px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink rtl:tracking-normal">
            {c.roadmapTag}
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {c.roadmap.map((item, idx) => (
            <div key={item.title}>
              <p className="font-mono text-xs text-muted">0{idx + 1}</p>
              <h3 className="mt-1 text-base font-extrabold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Sources */}
      <Section title={c.sourcesTitle}>
        <ol className="space-y-2 text-xs leading-relaxed text-muted">
          {IMPACT_SOURCES.map((s) => (
            <li key={s.id} id={`source-${s.id}`} dir="ltr" className="flex gap-2 text-start">
              <span className="font-bold text-ink">[{s.id}]</span>
              <span>
                {s.label}.{' '}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-brand underline-offset-2 hover:underline"
                >
                  {s.url}
                </a>
              </span>
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}
