# ScamHisn AI pitch video: storyboard and creative direction

Team Cybersound · 42 Abu Dhabi × Abu Dhabi Police ScamShield AI hackathon.
1920 × 1080, 60 fps, 69.2 seconds, no music, no voice-over. The last frame equals the first, so the file loops.

## Creative direction

**One idea:** a message arrives and you cannot tell if it is real. Sixty seconds later you can.

**Look.** The same paper-and-ink identity as the website and the deck: paper `#FBF8F1`, ink `#14201A`, one emerald accent `#0E6B47`, red only for scam verdicts and the problem numbers, amber only for "concept". Nunito Black for headlines, Nunito for everything else. No gradients, no glows, no particles.

**Rules the film follows**

- One message per shot, two to seven words on screen.
- The interface is the real one. Each block of the running app was cut out as its own layer, so pieces move on their own; nothing is a redrawn mock.
- Text arrives from blur to sharp and leaves by being pushed through; nothing fades to black.
- A held frame is never dead still: every hold has a slow drift or push.
- Entrances decelerate, exits accelerate, rows stagger by about a tenth of a second.
- Every figure on screen is cited or measured (sources in `docs/research/`).

## What the references taught us

Three reference films were watched frame by frame (about 40 paused frames each; audio was not assessed).

| Reference | What it does | What we took |
|---|---|---|
| "Apple Christmas Ad, 3D Motion Graphics" (Kram.Visuals, 17 s) | A phone on a pale seamless backdrop, a slow push-in, interface tiles floating off the screen at staggered depths, the camera flying through the phone into the next space, one short line of heavy type per beat. | Pale seamless backdrop and soft contact shadow for the phone shots; one short line per beat; push-through exits. |
| "Clean Glassy Phone UI" (Twobase, 15 s) | One phone, one continuous take; elements lift off the screen toward the camera and the nearest go soft; the phone exits as the logo builds. | Lifting one interface piece toward the camera while the page behind blurs and dims; ending on the device with the name beside it. |
| "Google Gemini App Animation" (AR motion designer, 12 s) | Flat 2.5D; a dot stretches into a prompt pill; rows cascade in; one tile grows to fill the frame and becomes the next scene. | The verdict colour filling the frame and shrinking into a chip that starts the next scene; cascading rows; one-word-per-beat type. |

We did not copy shots, glass materials, gradients or sparkle effects: they do not belong to this identity.

## Timeline

| Time | Scene | Says | Picture | Made in |
|---|---|---|---|---|
| 0:00–0:05 | 01 Hook | "Real or fake?" | A phone on paper. The screen wakes with a fine-payment SMS and buzzes; the camera holds, then pushes in on the link. | Blender (phone, light, camera), After Effects (type) |
| 0:05–0:12 | 02 Problem | 7 in 10 · 1 in 3 · Dh140M | Three numbers, one at a time, each pushed through by the next. Source line under each. | After Effects |
| 0:12–0:16 | 03 Solution | ScamHisn AI · حصن الاحتيال · Check before you click. | The mark pops, the name lands, the underline is drawn. | After Effects |
| 0:16–0:21.5 | 04 Reveal | (no text) | The real home screen assembles from pieces flying in from depth while the camera swings to face it. | After Effects 3D |
| 0:21.5–0:34 | 05 Demo | "It names who is being faked." · "Dead link? Still caught." | Pointer to the box, the link types in, Check is pressed, the page rearranges into the verdict and the number counts to 84%. Then two pieces are lifted toward the camera in turn while the page behind blurs. Ends by pushing into the verdict colour. | After Effects 3D |
| 0:34–0:45 | 06 Differentiator | "Two AI agents. One verdict." · "No single point of failure." | The verdict colour shrinks into a chip. Researcher (Gemini) and Judge (Falcon-H1, built in Abu Dhabi) feed it. Then the five-step fallback chain: each step fails and hands over. | After Effects |
| 0:45–0:50.6 | 07 Reach | "Arabic and English." · "Links. Jobs. Maps. Screenshots." | The verdict flips to its Arabic version; then the four kinds of check. | After Effects 3D |
| 0:50.6–0:55.6 | 08 Report | "Ready to report." | Pointer presses Report to Abu Dhabi Police; the real Aman panel opens. | After Effects |
| 0:55.6–1:01.2 | 09 Proof | "Measured, not claimed." 91.5% · 0 · 139 | Three numbers count up, with the limits of the measurement in a footnote. | After Effects |
| 1:01.2–1:05.2 | 10 Vision | "Today we check the link. Next, with TAMM: the claim." | Two lines and a CONCEPT tag. | After Effects |
| 1:05.2–1:09.2 | 11 Close | ScamHisn AI · Check before you click. · scamhisn-ai-v1.onrender.com | The phone again, now showing the verdict. The camera pulls back to where the film began, the screen sleeps, and the loop restarts. | Blender, After Effects |

## Sound

No music and no voice-over, by the brief. Sound effects are optional and listed with their times in [`SFX_CUES.md`](./SFX_CUES.md).

## What is honest about it

- "Two AI agents" means two models with separate roles. Nothing acts on its own, so the film does not say "agentic".
- Falcon-H1 is built in Abu Dhabi and multilingual; the film says "built in Abu Dhabi", not "an Arabic model".
- 91.5% is the address-check layer on a blind set of 141 addresses; the footnote says the full pipeline is not yet measured.
- The TAMM line is tagged CONCEPT.
- The SMS in the opening is our own illustration of a scam message.

## Files

| What | Where |
|---|---|
| The film, small copy kept in git (1080p60, about 5 Mbps, silent) | `../ScamHisn-AI-Pitch-Video.mp4` |
| The same film with Arabic on-screen text | `../ScamHisn-AI-Pitch-Video-AR.mp4` |
| Presentation copy (15 Mbps, silent) | `renders/final/ScamHisn-AI_pitch_1080p60.mp4` |
| Master (40 Mbps, silent) | `renders/final/ScamHisn-AI_pitch_1080p60_master.mp4` |
| Copy with the optional synthesised sound effects | `renders/final/ScamHisn-AI_pitch_1080p60_with_sfx.mp4` |
| Twelve full-size stills | `renders/final/stills/` |
| Blender project (phone shots) | `blender/scamhisn_phone_shots.blend` |
| After Effects project (eleven scene comps and two masters) | `ae/scamhisn_pitch_video.aep` |
| Interface pieces, phone screens, logo, sound | `assets/` |
| Scripts that rebuild every asset and both projects | `scripts/` |

Only the small copy, this storyboard, the cue sheet and the scripts are in git. The projects, assets and larger renders stay on the machine that made them (`.gitignore` in this folder).

## The Arabic cut

Same pictures and timing; every headline, caption and label is Arabic, set in the Dubai typeface and laid out right to left (the fallback chain and the model cards are mirrored). The interface shots stay in English apart from the scene that shows the Arabic interface, and the opening SMS is unchanged. Build it with `scripts/ae_build_ar.jsx`, render with `scripts/ae_render_ar.jsx`.

## Limits

- The film loops: its last frame is its first. There is no separate non-looping cut.
- The sound-effects track was synthesised by script and has not been listened to by a person. Treat the silent film as the finished one until someone has heard the other.
- Blender carries the phone shots only. The interface scenes are After Effects 3D layers, not Blender geometry, so they have no physical lighting or depth of field; the page behind a lifted piece is blurred with an adjustment layer instead.
- Live Google lookups and the Screenshot, Job and Map checks are named but not demonstrated: only the link check is shown end to end.
