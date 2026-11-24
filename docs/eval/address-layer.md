# Address-layer evaluation (blind holdout)

Generated 2026-11-24 by `apps/api/eval/addressEval.ts`.

**What this measures.** Given only the address, as when a scam domain is already offline, does the
engine call it risky (scam score ≥ 45)? It does not measure the page-rendering or AI layers.

**Dataset.** 76 real, well-known sites and 65 synthetic look-alike addresses written
in the patterns scammers use against UAE residents. The set was written before the first run and
is never used for tuning (tuning cases live in the unit tests).

| | Flagged | Not flagged |
|---|---:|---:|
| Scam look-alikes (65) | 53 | 12 |
| Legitimate sites (76) | 0 | 76 |

| Metric | Value |
|---|---:|
| Accuracy | 91.5% |
| Precision (flagged that were scams) | 100% |
| Recall (scams that were flagged) | 81.5% |
| False-alarm rate on legitimate sites | 0% |

## Misses

False alarms: none

Scam look-alikes not flagged by the address alone:
- `paypa1-login.com`
- `g00gle-verify.com`
- `abudhabi-fines.com`
- `uae-traffic-fines.com`
- `gov-ae-payment.com`
- `trafficfines-ae.top`
- `my-parcel-fee.top`
- `ae-customs-clearance.com`
- `visa-fee-uae.online`
- `faceb00k-login.com`
- `tammservices-ae.com`
- `secure-otp-verify.xyz`

Addresses with no brand name in them cannot be judged from the address alone. Those rely on the
next layers: opening the page (forms asking for card, OTP or Emirates ID) and the AI analysis.

## Limits

- The scam set is synthetic. Real campaigns may use patterns not represented here.
- 141 cases is a small sample; treat the percentages as indicative.
- This is one layer of several. A full-pipeline evaluation needs live pages and the AI model.
