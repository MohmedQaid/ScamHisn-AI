import { useLocale } from '../i18n/LocaleContext';
import { FortIllustration } from './FortIllustration';
import { Scribbled } from './ScribbleUnderline';

interface HeroProps {
  /** A result or progress is on screen: one small heading line, no illustration. */
  compact: boolean;
}

export function Hero({ compact }: HeroProps) {
  const { t } = useLocale();

  if (compact) {
    return (
      <div className="pb-5 pt-6 sm:pb-6 sm:pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[32px] rtl:tracking-normal">
          {t.hero.line1} {t.hero.line2} <Scribbled>{t.hero.scribbleWord}</Scribbled>
        </h1>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-x-10 gap-y-2 pb-8 pt-8 sm:pb-12 sm:pt-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:pb-14 lg:pt-14">
      <div className="min-w-0">
        <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[56px] lg:text-[70px] rtl:leading-[1.3] rtl:tracking-normal">
          <span className="block">{t.hero.line1}</span>
          <span className="block">
            {t.hero.line2} <Scribbled>{t.hero.scribbleWord}</Scribbled>
          </span>
        </h1>
        <p className="mt-6 max-w-[31rem] text-lg leading-relaxed text-muted sm:mt-7 sm:text-xl sm:leading-relaxed">
          {t.hero.sub}
        </p>
      </div>

      <FortIllustration className="mx-auto h-auto w-full max-w-[250px] sm:max-w-[320px] lg:ms-auto lg:me-0 lg:max-w-[430px]" />
    </div>
  );
}
