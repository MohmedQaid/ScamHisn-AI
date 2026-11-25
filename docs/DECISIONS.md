# Decisions log

Team Cybersound · ScamHisn AI · 42 Abu Dhabi × Abu Dhabi Police ScamShield AI hackathon.
Last updated 24 Nov 2026. Work is on the branch `feat/pitch-ready`.

## Ground rules we agreed

- Keep the idea. Small changes only; polish what exists until it is ready to ship.
- Do not add a new product. Make the existing one stand out through presentation.
- Judging is the repo plus a short live presentation.
- Every number we show must be measured by us or cited to a source.

## Product decisions

| # | Decision | Status |
|---|---|---|
| 1 | The prompt-injection rule no longer flags ordinary text such as "Developer mode", so the app stops rating its own homepage a 98% scam. | Done, tested |
| 2 | Hybrid AI: Gemini researches live sources, a self-hosted UAE-built model judges. Either can be missing. Two Gemini keys plus an optional backup model. | Done. Tested end to end with real Gemini keys and a real local model in Link, Job, Map and Screenshot modes |
| 2a | When every Gemini key fails, Job, Map and Image checks pause for a cool-down (default 2 min) and switch back on by themselves. General link checks keep working. | Done, tested end to end |
| 3 | An incomplete check is never shown as "safe". The result says how much of the analysis ran. | Done, tested |
| 4 | A link whose domain is dead gets a verdict from the address itself, not an error. | Done, tested |
| 5 | A pasted SMS works: the link is pulled out of the text. | Done, tested |
| 6 | Brand list fixed both ways: real brand-owned sites are not flagged, obvious UAE look-alikes are. | Done, tested |
| 7 | One-click samples include a fake fine link and a scam SMS. | Done |
| 8 | The police button lists the official Aman channels (800 2626, SMS 2828, aman@adpolice.gov.ae). eCrime is Dubai Police. | Done, verified on adpolice.gov.ae |
| 9 | No police dashboard. Out of scope for the time we have. | Decided |
| 10 | Local model: Falcon-H1 7B (TII, Abu Dhabi) on the team PC. Jais 2 was downloaded and tried, but llama.cpp gives garbage output for it on the GPU (Vulkan and CUDA builds) and only 8 tokens a second on the processor, so it is not used. Swapping models is one setting. | Falcon-H1: 9 of 9 smoke cases, about 6.5 s per check. Jais 2: blocked by the runner, see AI_FALLBACK_SETUP.md |
| 10a | The Chrome extension popup uses the same look, wording, verdict rules and Aman channels as the website; its icons and the site favicon use the new mark. | Done |
| 11 | Gemini stays the main model. Local models cannot search Google or Maps and cannot read images. | Decided |
| 12a | In-app Impact page with cited problem figures, measured accuracy, cost and savings estimates. | Done |
| 12b | Certificate, Map and Job scoring no longer treat "could not verify" as fraud. | Done, tested |

## Pitch decisions

| # | Decision | Status |
|---|---|---|
| 12 | Headline: "Today we check the link. With TAMM, we check the claim." The TAMM part is shown as a labelled concept. | Proposed |
| 13 | Open with two SMS messages side by side, one real and one fake. | Proposed |
| 14 | Live demo on our own samples, ending on the PDF report, with a recorded backup in case the internet fails. | Proposed |
| 15 | Feature Map mode as "the scam with no link" only if it tests reliably. | Map mode not yet tested live |
| 16 | The deck keeps three short slides the rules require: architecture, why these models, privacy. | Done: nine slides in `docs/pitch/`, drawn in the same paper-and-ink look, fonts embedded, PDF copy alongside |
| 17 | Pitch video: 69 seconds, 1080p60, no music or voice-over, loops. Phone shots in Blender, everything else in After Effects from the real interface cut into layers. | Done: storyboard and build scripts in `docs/pitch/video/`; a sound-effects track is optional and has not been checked by ear |
| 18 | Visual redesign to the paper-and-ink look chosen by the team, across the website and the extension. | Done |

## Contradictions we found and how we resolved them

| Conflict | Resolution |
|---|---|
| "We check the claim" describes a concept, while the product checks the link. | Say "today the link, next the claim" and label the mock a concept. |
| The demo pastes a fake link, but real scam links are usually dead and the app used to error on them. | Fixed by decision 4, and the samples are our own. |
| Map mode was going to be a pitch pillar without having been tested. | Test first; drop or show one honest screenshot if unreliable. |
| Cutting architecture from the pitch versus the rule that the deck must explain it. | Keep three short slides, one sentence each aloud. |
| Arabic screen in the demo, but the Arabic PDF is mostly English. | Demo the screen in Arabic and the PDF in English, unless the PDF is fixed. |
| Replacing Gemini with a local model versus keeping Maps, Job and Image modes working. | Local model is a fallback, not a replacement. |

## Open questions

- **Deadline and pitch length.** Deadline is within hours; the pitch time limit is unknown.
- **Deploying.** Live at `https://scamhisn-ai-v1.onrender.com` since 25 Nov 2026: a new Render service (free plan, Frankfurt) built from the root `Dockerfile` on `main`. It was created from the public repository address, so it does not redeploy by itself; press Manual Deploy after changes. The self-hosted judge reaches it through a tunnel from a team PC (`scripts/start-falcon-live.ps1`), whose address changes when the tunnel restarts. The earlier service at `scamhisn-ai.onrender.com` still runs the old version.
- **Two Gemini keys from two accounts.** May conflict with Google's terms on getting around quotas. A backup model or a paid key avoids the question.
- **Privacy slide.** Screenshots and page text go to Google's Gemini API. The README says so.
- **Live Google lookups.** Google lists Search grounding as not available on the free tier for `gemini-3.5-flash-lite`. Map and Job "live verification" may not be running. Check a scan's `coverage.liveSourcesChecked`. Options: a paid key, or `gemini-2.5-flash-lite`, whose free tier includes 500 lookups a day.
- **Abu Dhabi Police already have an AI check.** The Aman portal's "Smart assessment" analyses messages and links. Pitch ScamHisn as going further, not as the first.
- **Map mode** has still not been tested live with a working Gemini key.

## Where things are

| What | Where |
|---|---|
| Pitch deck (PowerPoint and PDF) | [`docs/pitch/`](./pitch/) |
| Fallback chain setup | [`docs/AI_FALLBACK_SETUP.md`](./AI_FALLBACK_SETUP.md) |
| Measured accuracy | [`docs/eval/address-layer.md`](./eval/address-layer.md) |
| Research and sources | [`docs/research/`](./research/) |
| Cost and savings model | [`docs/IMPACT.md`](./IMPACT.md) |
| Open data files | [`data/open-data/`](../data/open-data/) |
| Tests | `Deployable Website Application/apps/api/src/__tests__/` |
