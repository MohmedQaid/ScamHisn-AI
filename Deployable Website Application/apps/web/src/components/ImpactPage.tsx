import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale } from '../i18n/LocaleContext';
import { IMPACT, IMPACT_SOURCES } from '../data/impact';

function Tag({ children, tone }: { children: ReactNode; tone: 'measured' | 'estimate' | 'cited' }) {
  const styles = {
    measured: 'bg-emerald-600 text-white',
    estimate: 'bg-amber-400 text-slate-950',
    cited: 'bg-slate-900 text-white dark:bg-white dark:text-slate-950',
  } as const;
  return (
    <span
      className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[tone]}`}
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
    <section className="border-t border-slate-200 py-10 dark:border-slate-800 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {title}
        </h2>
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
      className="ms-1 align-super text-[10px] font-bold text-emerald-700 no-underline hover:underline dark:text-emerald-400"
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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300"
      >
        <BackIcon className="h-3.5 w-3.5" />
        {t.nav.back}
      </a>

      <header className="pb-10 pt-6 sm:pb-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
          {c.eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          {c.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
          {c.lead}
        </p>
      </header>

      {/* The problem */}
      <Section title={c.problemTitle} tag={<Tag tone="cited">{c.citedTag}</Tag>}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {c.problemStats.map((s) => (
            <div key={s.label}>
              <dt className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 sm:text-4xl">
                {s.value}
              </dt>
              <dd className="mt-1.5 text-sm leading-snug text-slate-600 dark:text-slate-300">
                {s.label}
                <Ref id={s.source} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-7 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {withRefs(c.problemNote)}
        </p>
      </Section>

      {/* Measured accuracy */}
      <Section title={c.accuracyTitle} tag={<Tag tone="measured">{c.measuredTag}</Tag>}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
          {c.accuracyStats.map((s) => (
            <div key={s.label}>
              <dt className="text-4xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 sm:text-5xl">
                {s.value}
              </dt>
              <dd className="mt-1.5 text-sm leading-snug text-slate-600 dark:text-slate-300">{s.label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-7 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {c.accuracyNote}
        </p>
      </Section>

      {/* Running cost */}
      <Section title={c.costTitle} tag={<Tag tone="estimate">{c.estimateTag}</Tag>}>
        <p className="max-w-2xl text-lg font-semibold leading-snug text-slate-900 dark:text-white sm:text-xl">
          {c.costLead}
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {c.costHeaders.map((h) => (
                  <th key={h} scope="col" className="py-2 pe-4 text-start font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.costRows.map((row) => (
                <tr key={row.scale} className="border-b border-slate-100 dark:border-slate-800/80">
                  <th scope="row" className="py-2.5 pe-4 text-start font-bold text-slate-900 dark:text-white">
                    {row.scale}
                  </th>
                  <td className="py-2.5 pe-4 text-slate-600 dark:text-slate-300">{row.users}</td>
                  <td className="py-2.5 pe-4 text-slate-900 dark:text-white">{row.withoutLookups}</td>
                  <td className="py-2.5 pe-4 text-slate-900 dark:text-white">{row.withLookups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {withRefs(c.costNote)}
        </p>
      </Section>

      {/* Savings */}
      <Section title={c.savingsTitle} tag={<Tag tone="estimate">{c.estimateTag}</Tag>}>
        <p className="max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {c.savingsHeadline}
        </p>
        <ol className="mt-6 max-w-2xl space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {c.savingsSteps.map((step) => (
            <li key={step} className="border-s-2 border-emerald-600 ps-3 dark:border-emerald-400">
              {withRefs(step)}
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {c.savingsNote}
        </p>
      </Section>

      {/* Fallback chain */}
      <Section title={c.chainTitle}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-bold text-slate-900 dark:text-white">
          {c.chainSteps.map((step, idx) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-md border border-slate-300 px-3 py-1.5 dark:border-slate-700">{step}</span>
              {idx < c.chainSteps.length - 1 && (
                <span aria-hidden="true" className="text-slate-400">
                  {locale === 'ar' ? '←' : '→'}
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{c.chainNote}</p>
      </Section>

      {/* Roadmap */}
      <Section
        title={c.roadmapTitle}
        tag={
          <span className="rounded-sm border border-slate-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-500 dark:text-slate-300">
            {c.roadmapTag}
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {c.roadmap.map((item, idx) => (
            <div key={item.title}>
              <p className="font-mono text-xs text-slate-400">0{idx + 1}</p>
              <h3 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Sources */}
      <Section title={c.sourcesTitle}>
        <ol className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {IMPACT_SOURCES.map((s) => (
            <li key={s.id} id={`source-${s.id}`} dir="ltr" className="flex gap-2 text-start">
              <span className="font-bold text-slate-900 dark:text-white">[{s.id}]</span>
              <span>
                {s.label}.{' '}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
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
