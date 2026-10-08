/**
 * Background music.
 *
 * Browsers block autoplay, so playback must start inside a user gesture —
 * the envelope tap. Two sources:
 *  - an audio file (royalty-free track under /public), or
 *  - the built-in music box: a soft arpeggio synthesized with Web Audio.
 *    Zero bytes to download and royalty-free by construction.
 */

export interface MusicPlayer {
  play(): Promise<void>;
  pause(): void;
  setMuted(muted: boolean): void;
  /** Stop and release resources (used when switching tracks). */
  dispose(): void;
  readonly playing: boolean;
}

class FilePlayer implements MusicPlayer {
  private audio: HTMLAudioElement;
  playing = false;

  constructor(src: string) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.preload = "none";
    this.audio.volume = 0.6;
  }

  async play() {
    await this.audio.play();
    this.playing = true;
  }

  pause() {
    this.audio.pause();
    this.playing = false;
  }

  setMuted(muted: boolean) {
    this.audio.muted = muted;
  }

  dispose() {
    this.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
  }
}

/* --------------------------- Music box synth --------------------------- */

// I – vi – IV – V in D major, as MIDI notes (arpeggio patterns).
const PROGRESSION = [
  [62, 66, 69, 74, 78, 74, 69, 66], // D
  [59, 62, 66, 71, 74, 71, 66, 62], // Bm
  [55, 59, 62, 67, 71, 67, 62, 59], // G
  [57, 61, 64, 69, 73, 69, 64, 61], // A
];
const BASS = [38, 35, 31, 33];
const STEP = 0.36; // seconds per arpeggio note (~83 bpm eighths)

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

class MusicBoxPlayer implements MusicPlayer {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private timer: number | undefined;
  private muted = false;
  private nextTime = 0;
  private step = 0;
  playing = false;

  private setup() {
    const Ctx: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // A gentle low-pass + feedback delay gives a soft, roomy shimmer.
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 3200;
    lowpass.connect(this.master);

    const delay = ctx.createDelay(1);
    delay.delayTime.value = STEP * 1.5;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(lowpass);

    this.bus = ctx.createGain();
    this.bus.connect(lowpass);
    this.bus.connect(delay);
  }

  private note(midi: number, time: number, gain: number, length: number, type: OscillatorType) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq(midi);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(gain, time + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, time + length);
    osc.connect(env).connect(this.bus);
    osc.start(time);
    osc.stop(time + length + 0.05);

    // A quiet octave partial makes it sound like a music box tine.
    const bell = ctx.createOscillator();
    const bellEnv = ctx.createGain();
    bell.type = "sine";
    bell.frequency.value = freq(midi + 12) * 1.003;
    bellEnv.gain.setValueAtTime(0, time);
    bellEnv.gain.linearRampToValueAtTime(gain * 0.25, time + 0.008);
    bellEnv.gain.exponentialRampToValueAtTime(0.0001, time + length * 0.5);
    bell.connect(bellEnv).connect(this.bus);
    bell.start(time);
    bell.stop(time + length);
  }

  private schedule = () => {
    const ctx = this.ctx!;
    while (this.nextTime < ctx.currentTime + 0.6) {
      const bar = Math.floor(this.step / 8) % PROGRESSION.length;
      const i = this.step % 8;
      this.note(PROGRESSION[bar][i], this.nextTime, 0.11, 1.8, "sine");
      if (i === 0) this.note(BASS[bar], this.nextTime, 0.09, STEP * 8, "triangle");
      this.nextTime += STEP;
      this.step++;
    }
  };

  async play() {
    if (!this.ctx) this.setup();
    const ctx = this.ctx!;
    await ctx.resume();
    this.nextTime = Math.max(this.nextTime, ctx.currentTime + 0.05);
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.55, ctx.currentTime, 0.6);
    this.schedule();
    window.clearInterval(this.timer);
    this.timer = window.setInterval(this.schedule, 150);
    this.playing = true;
  }

  pause() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    window.clearInterval(this.timer);
    window.setTimeout(() => {
      if (!this.playing) void ctx.suspend();
    }, 600);
    this.playing = false;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.playing) this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.1);
  }

  dispose() {
    this.pause();
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx) window.setTimeout(() => void ctx.close(), 700);
  }
}

export function createMusicPlayer(src?: string): MusicPlayer {
  return src ? new FilePlayer(src) : new MusicBoxPlayer();
}
