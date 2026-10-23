/** Alle Sounds werden live synthetisiert – keine Audiodateien nötig. */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, opts: {
  type: OscillatorType; from: number; to?: number; start?: number; dur: number; gain?: number;
}) {
  const t0 = c.currentTime + (opts.start ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.from, t0);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + opts.dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.15, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

export type SoundName = "airhorn" | "stamp" | "fanfare" | "nope" | "whoosh" | "pop";

export function playSound(name: SoundName) {
  const c = audio();
  if (!c) return;
  switch (name) {
    case "airhorn": // drei leicht verstimmte Sägezähne – tä-tä-tääää
      for (const [start, dur] of [[0, 0.16], [0.2, 0.16], [0.4, 0.7]] as const) {
        for (const f of [392, 494, 587]) tone(c, { type: "sawtooth", from: f * 1.02, to: f, start, dur, gain: 0.07 });
      }
      break;
    case "stamp":
      tone(c, { type: "sine", from: 160, to: 45, dur: 0.28, gain: 0.5 });
      tone(c, { type: "square", from: 90, to: 40, dur: 0.12, gain: 0.12 });
      break;
    case "fanfare":
      [523, 659, 784, 1047].forEach((f, i) => tone(c, { type: "triangle", from: f, start: i * 0.11, dur: i === 3 ? 0.6 : 0.16, gain: 0.18 }));
      break;
    case "nope": // trauriges Posaunen-Rutschen
      tone(c, { type: "sawtooth", from: 311, to: 233, dur: 0.35, gain: 0.1 });
      tone(c, { type: "sawtooth", from: 233, to: 156, start: 0.38, dur: 0.6, gain: 0.1 });
      break;
    case "whoosh":
      tone(c, { type: "sine", from: 300, to: 1200, dur: 0.18, gain: 0.06 });
      break;
    case "pop":
      tone(c, { type: "sine", from: 500, to: 900, dur: 0.08, gain: 0.12 });
      break;
  }
}
