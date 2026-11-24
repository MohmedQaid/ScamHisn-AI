/**
 * Measures the address-analysis layer on the frozen blind holdout set (see holdout.ts).
 *
 *   npx tsx eval/addressEval.ts            # print the report
 *   npx tsx eval/addressEval.ts --write    # also write docs/eval/address-layer.{json,md}
 *
 * What it measures: given ONLY the address (as when a scam domain is already offline), does the
 * engine call it risky? A case counts as "flagged" at scam score >= 45 (Suspicious or worse).
 * It does NOT measure the page-rendering or AI layers, and the scam set is synthetic.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAddressOnlyScan } from '../src/services/addressOnlyScan.js';
import { LEGITIMATE, SCAM_LOOKALIKES } from './holdout.js';

const FLAG_THRESHOLD = 45;

const NO_REGISTRATION = {
  registrableDomain: null,
  source: 'unavailable' as const,
  createdAt: null,
  expiresAt: null,
  registrar: null,
  domainAgeDays: null,
  isNewlyRegistered: false,
  isYoungDomain: false,
  statuses: [],
  error: null,
};

function score(host: string) {
  const scan = buildAddressOnlyScan({
    scanId: 'eval',
    startedAt: Date.now(),
    mode: 'general',
    url: new URL(`https://${host}/`),
    registration: NO_REGISTRATION,
    dnsErrorCode: 'EVAL',
  });
  return {
    host,
    score: scan.scamScore,
    flagged: scan.scamScore >= FLAG_THRESHOLD,
    brand: scan.technicalChecks.anomalies.impersonatedBrand,
  };
}

const legit = LEGITIMATE.map(score);
const scams = SCAM_LOOKALIKES.map(score);

const tp = scams.filter((r) => r.flagged).length;
const fn = scams.length - tp;
const fp = legit.filter((r) => r.flagged).length;
const tn = legit.length - fp;

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

const report = {
  generatedAt: new Date().toISOString(),
  layer: 'address analysis only (no page rendering, no AI)',
  flagThreshold: FLAG_THRESHOLD,
  dataset: {
    legitimate: legit.length,
    scamLookalikesSynthetic: scams.length,
    note: 'Blind holdout written before the first run and never tuned on. Scam addresses are synthetic.',
  },
  confusion: { truePositives: tp, falseNegatives: fn, falsePositives: fp, trueNegatives: tn },
  metrics: {
    accuracyPct: pct(tp + tn, legit.length + scams.length),
    precisionPct: pct(tp, tp + fp),
    recallPct: pct(tp, tp + fn),
    falseAlarmRatePct: pct(fp, legit.length),
  },
  falsePositives: legit.filter((r) => r.flagged),
  falseNegatives: scams.filter((r) => !r.flagged).map((r) => r.host),
};

console.log(JSON.stringify(report, null, 2));

if (process.argv.includes('--write')) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.resolve(here, '../../../../docs/eval');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'address-layer.json'), `${JSON.stringify(report, null, 2)}\n`);

  const md = `# Address-layer evaluation (blind holdout)

Generated ${report.generatedAt.slice(0, 10)} by \`apps/api/eval/addressEval.ts\`.

**What this measures.** Given only the address, as when a scam domain is already offline, does the
engine call it risky (scam score ≥ ${FLAG_THRESHOLD})? It does not measure the page-rendering or AI layers.

**Dataset.** ${legit.length} real, well-known sites and ${scams.length} synthetic look-alike addresses written
in the patterns scammers use against UAE residents. The set was written before the first run and
is never used for tuning (tuning cases live in the unit tests).

| | Flagged | Not flagged |
|---|---:|---:|
| Scam look-alikes (${scams.length}) | ${tp} | ${fn} |
| Legitimate sites (${legit.length}) | ${fp} | ${tn} |

| Metric | Value |
|---|---:|
| Accuracy | ${report.metrics.accuracyPct}% |
| Precision (flagged that were scams) | ${report.metrics.precisionPct}% |
| Recall (scams that were flagged) | ${report.metrics.recallPct}% |
| False-alarm rate on legitimate sites | ${report.metrics.falseAlarmRatePct}% |

## Misses

False alarms: ${report.falsePositives.length === 0 ? 'none' : report.falsePositives.map((r) => `\`${r.host}\` (as ${r.brand})`).join(', ')}

Scam look-alikes not flagged by the address alone:
${report.falseNegatives.map((h) => `- \`${h}\``).join('\n') || '- none'}

Addresses with no brand name in them cannot be judged from the address alone. Those rely on the
next layers: opening the page (forms asking for card, OTP or Emirates ID) and the AI analysis.

## Limits

- The scam set is synthetic. Real campaigns may use patterns not represented here.
- ${legit.length + scams.length} cases is a small sample; treat the percentages as indicative.
- This is one layer of several. A full-pipeline evaluation needs live pages and the AI model.
`;
  fs.writeFileSync(path.join(outDir, 'address-layer.md'), md);
  console.error(`written to ${outDir}`);
}
