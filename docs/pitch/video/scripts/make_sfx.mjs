// Synthesises a restrained sound-effects track for the pitch video (no samples, no music) and
// writes it as one 48 kHz stereo WAV aligned to the MASTER timeline, plus a cue sheet.
// Usage: node make_sfx.mjs <out.wav> <cues.md> [time scale, e.g. 0.8526 for the 59-second cut]
import fs from 'node:fs';

const SR = 48000;
const K = Number(process.argv[4] ?? 1); // time scale: 59 / 69.2 for the one-minute cut
const DUR = 69.2 * K;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const cues = [];
let seed = 20261125;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(t, samples, gain, pan = 0) {
  const start = Math.round(t * K * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < samples.length; i++) {
    const k = start + i;
    if (k < 0 || k >= N) continue;
    L[k] += samples[i] * gl * 1.414;
    R[k] += samples[i] * gr * 1.414;
  }
}
const env = (i, n, attack, decay) => Math.min(1, i / (attack * SR)) * Math.exp((-i / SR) * decay);

/** Soft UI tick: a few milliseconds of pitched click. */
function tick(t, gain = 0.1, hz = 2100, pan = 0, note) {
  const n = Math.round(0.03 * SR);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = (Math.sin((2 * Math.PI * hz * i) / SR) * 0.8 + rnd() * 0.2 * Math.exp(-i / (0.0012 * SR))) * env(i, n, 0.0006, 190);
  add(t, s, gain, pan);
  if (note) cues.push([t, 'tick', note]);
}
/** Pointer press: lower, rounder than a tick. */
function tap(t, gain = 0.22, note) {
  const n = Math.round(0.07 * SR);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = Math.sin((2 * Math.PI * 760 * i) / SR) * env(i, n, 0.001, 120) * 0.6 + Math.sin((2 * Math.PI * 190 * i) / SR) * env(i, n, 0.002, 60) * 0.7;
  add(t, s, gain);
  if (note) cues.push([t, 'tap', note]);
}
/** Low soft thump for a number or a verdict landing. */
function thump(t, gain = 0.5, note) {
  const n = Math.round(0.36 * SR);
  const s = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const f = 46 + 54 * Math.exp(-i / (0.035 * SR));
    ph += (2 * Math.PI * f) / SR;
    s[i] = Math.sin(ph) * env(i, n, 0.004, 13);
  }
  add(t, s, gain);
  if (note) cues.push([t, 'thump', note]);
}
/** Airy swish: band-passed noise whose centre sweeps; `up` rises, otherwise falls. */
function whoosh(t, dur, gain = 0.12, up = true, pan0 = -0.3, pan1 = 0.3, note) {
  const n = Math.round(dur * SR);
  const sl = new Float32Array(n);
  const sr = new Float32Array(n);
  let low = 0, band = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const fc = up ? 320 * Math.pow(7, x) : 2200 * Math.pow(1 / 7, x);
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    const q = 0.9;
    low += f * band;
    const high = rnd() - low - q * band;
    band += f * high;
    const a = Math.pow(Math.sin(Math.PI * x), 1.6);
    const p = pan0 + (pan1 - pan0) * x;
    sl[i] = band * a * Math.cos(((p + 1) * Math.PI) / 4);
    sr[i] = band * a * Math.sin(((p + 1) * Math.PI) / 4);
  }
  const start = Math.round(t * K * SR);
  for (let i = 0; i < n; i++) {
    const k = start + i;
    if (k < 0 || k >= N) continue;
    L[k] += sl[i] * gain * 1.414;
    R[k] += sr[i] * gain * 1.414;
  }
  if (note) cues.push([t, 'whoosh', note]);
}
/** Clean two-note ping for the brand mark. */
function ping(t, gain = 0.22, base = 880, note) {
  const n = Math.round(1.1 * SR);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const e = env(i, n, 0.004, 4.2);
    s[i] = (Math.sin((2 * Math.PI * base * i) / SR) * 0.6 + Math.sin((2 * Math.PI * base * 1.5 * i) / SR) * 0.32 + Math.sin((2 * Math.PI * base * 2 * i) / SR) * 0.1) * e;
  }
  add(t, s, gain);
  if (note) cues.push([t, 'ping', note]);
}
/** Phone vibrating on a table. */
function buzz(t, dur, gain = 0.2, note) {
  const n = Math.round(dur * SR);
  const s = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const a = Math.min(1, x / 0.08) * Math.min(1, (1 - x) / 0.15);
    const raw = (Math.sin((2 * Math.PI * 158 * i) / SR) + 0.35 * Math.sin((2 * Math.PI * 474 * i) / SR)) * (0.6 + 0.4 * Math.sin((2 * Math.PI * 31 * i) / SR));
    lp += 0.2 * (raw - lp);
    s[i] = lp * a;
  }
  add(t, s, gain);
  if (note) cues.push([t, 'buzz', note]);
}
/** Short falling tone: a step failing. */
function fall(t, gain = 0.14, note) {
  const n = Math.round(0.16 * SR);
  const s = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    ph += (2 * Math.PI * (520 - 200 * (i / n))) / SR;
    s[i] = Math.sin(ph) * env(i, n, 0.003, 22);
  }
  add(t, s, gain);
  if (note) cues.push([t, 'fall', note]);
}
function ticksDecelerating(t0, t1, gain, note) {
  let t = t0, gap = 0.028, first = true;
  while (t < t1) {
    tick(t, gain * (0.7 + 0.3 * Math.abs(rnd())), 2500, rnd() * 0.25, first ? note : undefined);
    first = false;
    gap *= 1.11;
    t += gap;
  }
}

// ------------------------------------------------------------------ the cue list (MASTER seconds)
// 01 hook
buzz(0.77, 0.19, 0.2, 'phone buzz as the message lands');
buzz(1.02, 0.17, 0.17);
whoosh(4.7, 0.36, 0.07, true, -0.2, 0.3, 'cut on the push-in');
// 02 problem
thump(5.03, 0.5, '7 in 10 lands');
whoosh(7.2, 0.32, 0.08, true, -0.3, 0.3, 'number pushed through');
thump(7.53, 0.5, '1 in 3 lands');
whoosh(9.4, 0.32, 0.08, true, -0.3, 0.3);
thump(9.73, 0.5, 'Dh140M lands');
whoosh(11.7, 0.32, 0.08, true, -0.3, 0.3);
// 03 solution
ping(12.38, 0.22, 880, 'logo mark');
whoosh(15.64, 0.38, 0.09, true, -0.2, 0.2, 'name pushed through');
// 04 reveal
for (let i = 0; i < 10; i++) tick(16.92 + i * 0.075, 0.045, 1700 + i * 60, -0.5 + i * 0.1, i === 0 ? 'interface pieces settle' : undefined);
// 05 demo
tap(22.4, 0.2, 'pointer taps the box');
{
  let t = 22.54;
  let first = true;
  while (t < 23.68) {
    tick(t, 0.05 + 0.02 * Math.abs(rnd()), 1900 + 300 * rnd(), 0, first ? 'typing the link' : undefined);
    first = false;
    t += 0.05 + 0.035 * Math.abs(rnd());
  }
}
tap(24.38, 0.24, 'Check is pressed');
whoosh(24.55, 0.8, 0.07, false, 0, 0, 'page rearranges');
ticksDecelerating(25.62, 26.44, 0.04, 'number counts to 84%');
thump(26.5, 0.42, 'verdict lands');
whoosh(26.78, 0.6, 0.075, true, 0.3, -0.1, 'evidence row lifts');
whoosh(29.62, 0.5, 0.06, false, -0.1, 0.3, 'row returns');
whoosh(30.22, 0.6, 0.075, true, -0.3, 0.1, 'offline notice lifts');
whoosh(32.98, 0.5, 0.06, false, 0.1, -0.3, 'notice returns');
whoosh(33.4, 0.66, 0.12, true, 0, 0, 'push into the verdict colour');
// 06 two agents, chain
tick(34.74, 0.08, 1500, 0, 'verdict chip settles');
whoosh(34.9, 0.5, 0.055, false, -0.7, -0.2, 'researcher card');
whoosh(35.06, 0.5, 0.055, false, 0.7, 0.2, 'judge card');
ping(36.45, 0.13, 660, 'both feed the verdict');
whoosh(38.98, 0.34, 0.07, true, -0.2, 0.2);
for (let k = 0; k < 5; k++) tick(39.92 + k * 0.09, 0.06, 1500 + k * 90, -0.6 + k * 0.3, k === 0 ? 'fallback steps appear' : undefined);
[41.2, 41.95, 42.7].forEach((t, k) => {
  fall(t, 0.13, k === 0 ? 'a step fails' : undefined);
  tick(t + 0.36, 0.09, 2300, -0.5 + k * 0.35, k === 0 ? 'the next takes over' : undefined);
});
whoosh(44.64, 0.36, 0.08, true, -0.2, 0.2);
// 07 reach
whoosh(45.98, 0.68, 0.08, true, 0.4, -0.4, 'verdict flips to Arabic');
for (let i = 0; i < 4; i++) tick(48.7 + i * 0.12, 0.06, 1600 + i * 110, -0.55 + i * 0.37, i === 0 ? 'four kinds of check' : undefined);
whoosh(50.28, 0.3, 0.07, true, -0.2, 0.2);
// 08 report
tap(52.1, 0.22, 'Report to Abu Dhabi Police is pressed');
whoosh(52.24, 0.5, 0.06, false, 0, 0, 'Aman panel opens');
whoosh(55.28, 0.3, 0.07, true, -0.2, 0.2);
// 09 proof
ticksDecelerating(56.2, 57.5, 0.035, 'numbers count up');
thump(57.55, 0.3, 'numbers settle');
whoosh(60.88, 0.3, 0.07, true, -0.2, 0.2);
// 10 vision
whoosh(61.3, 0.4, 0.05, false, -0.3, 0.1, 'first line');
whoosh(62.36, 0.4, 0.05, false, 0.3, -0.1, 'second line');
tick(63.1, 0.07, 1500, 0, 'concept tag');
whoosh(64.86, 0.34, 0.08, true, -0.2, 0.2);
// 11 close
ping(67.25, 0.2, 880, 'name beside the phone');
tap(68.5, 0.1, 'screen sleeps');

// ------------------------------------------------------------------ master and write
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const target = Math.pow(10, -9 / 20); // -9 dBFS peak: quiet by design
const g = peak > 0 ? target / peak : 1;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
}
fs.writeFileSync(process.argv[2], buf);

cues.sort((a, b) => a[0] - b[0]);
const fmt = (t0) => {
  const t = t0 * K;
  return `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
};
fs.writeFileSync(
  process.argv[3],
  `# Sound-effect cues\n\nNo music and no voice-over. These are the moments that take a sound, with the kind of sound each one wants.\nThe track in \`assets/sfx/scamhisn_sfx_synth.wav\` was synthesised by script (no samples) and has not been checked by ear;\nreplace any cue with a sound from a professional library at the same time.\n\n| Time | Sound | Moment |\n|---|---|---|\n${cues.map(([t, kind, note]) => `| ${fmt(t)} | ${kind} | ${note} |`).join('\n')}\n\nKinds: **buzz** phone vibration on a table · **thump** soft low hit · **whoosh** short airy swish · **tick** light UI tick · **tap** pointer press · **ping** clean two-note tone · **fall** short falling tone.\n`,
);
console.log('wrote', process.argv[2], (buf.length / 1e6).toFixed(1) + ' MB', '| cues listed', cues.length, '| raw peak', peak.toFixed(2));
