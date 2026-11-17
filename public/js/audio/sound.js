// Synthesised sound effects (WebAudio, no audio files). Every effect is rate-limited so a wave
// of 2,000 pops stays a pleasant patter instead of noise. The context starts on the first click
// or key press, as browsers require.

const LIMITS = { pop: 26, crack: 8, boom: 7, zap: 7, tick: 9, pulse: 4, coin: 10 };

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    try { this.muted = localStorage.getItem('hollowlight.muted') === '1'; } catch { /* storage unavailable */ }
    this.budget = {};
    this.noise = null;
    const start = () => this.start();
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
  }

  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.32;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    this.master.connect(comp).connect(this.ctx.destination);
    // One second of white noise, reused for blasts and whooshes.
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('hollowlight.muted', m ? '1' : '0'); } catch { /* storage unavailable */ }
    if (this.master) this.master.gain.value = m ? 0 : 0.32;
  }

  // Call once per frame: refills each effect's per-second budget.
  update(dt) {
    for (const k in LIMITS) this.budget[k] = Math.min(LIMITS[k] * 0.25, (this.budget[k] || 0) + LIMITS[k] * dt);
  }

  ok(kind) {
    if (!this.ctx || this.muted) return false;
    if ((this.budget[kind] || 0) < 1) return false;
    this.budget[kind]--;
    return true;
  }

  tone(type, f0, f1, dur, vol, delay = 0) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  hiss(dur, vol, freq, q = 1, delay = 0, type = 'bandpass') {
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  }

  // A layer breaking. Pitch climbs with the kill streak (up to an octave).
  pop(streak = 0) {
    if (!this.ok('pop')) return;
    const f = (520 + Math.random() * 260) * 2 ** (Math.min(streak, 300) / 300);
    this.tone('triangle', f, f * 1.9, 0.07, 0.16);
  }

  crack() { // a shell or hulk breaking open
    if (!this.ok('crack')) return;
    this.hiss(0.16, 0.5, 1800, 0.8);
    this.tone('square', 180, 70, 0.14, 0.12);
  }

  boom(big = false) {
    if (!this.ok('boom')) return;
    this.hiss(big ? 0.6 : 0.3, big ? 0.9 : 0.55, big ? 300 : 500, 0.7, 0, 'lowpass');
    this.tone('sine', big ? 110 : 150, 40, big ? 0.5 : 0.25, big ? 0.5 : 0.3);
  }

  zap() {
    if (!this.ok('zap')) return;
    this.tone('sawtooth', 1400 + Math.random() * 400, 300, 0.09, 0.06);
    this.hiss(0.08, 0.2, 4000, 2);
  }

  shot() {
    if (!this.ok('tick')) return;
    this.tone('square', 900 + Math.random() * 200, 500, 0.035, 0.04);
  }

  pulse() {
    if (!this.ok('pulse')) return;
    this.hiss(0.35, 0.25, 2500, 0.6, 0, 'highpass');
  }

  coin() {
    if (!this.ok('coin')) return;
    this.tone('sine', 1320, 1320, 0.06, 0.06);
    this.tone('sine', 1760, 1760, 0.08, 0.05, 0.05);
  }

  chord(notes, dur, vol, type = 'triangle', spread = 0.06) {
    if (!this.ctx || this.muted) return;
    notes.forEach((n, i) => this.tone(type, n, n * 1.001, dur, vol, i * spread));
  }

  flare() {
    if (!this.ctx || this.muted) return;
    this.hiss(1.2, 0.9, 400, 0.5, 0, 'lowpass');
    this.tone('sine', 90, 30, 1.0, 0.6);
    this.chord([523, 659, 784, 1047], 1.2, 0.12, 'triangle', 0.04);
  }

  frost() {
    if (!this.ctx || this.muted) return;
    this.hiss(1.0, 0.6, 6000, 0.7, 0, 'highpass');
    this.chord([1568, 1976, 2349], 0.9, 0.06, 'sine', 0.05);
  }

  ability() { this.chord([392, 587, 784], 0.5, 0.12, 'square', 0.03); }
  upgrade(big) { this.chord(big ? [523, 659, 784, 1047] : [659, 988], big ? 0.6 : 0.3, 0.12, 'triangle', 0.05); }
  place() { if (this.ctx && !this.muted) this.tone('triangle', 330, 520, 0.12, 0.15); }
  sell() { if (this.ctx && !this.muted) { this.tone('sine', 988, 988, 0.08, 0.1); this.tone('sine', 1319, 1319, 0.12, 0.1, 0.06); } }
  wave(boss) { this.chord(boss ? [110, 131, 165] : [262, 330, 392], boss ? 1.4 : 0.5, boss ? 0.25 : 0.1, boss ? 'sawtooth' : 'triangle', 0.08); }
  leak(big) { if (this.ctx && !this.muted) { this.tone('sine', big ? 80 : 140, 40, big ? 0.6 : 0.25, big ? 0.6 : 0.35); } }
  streak() { this.chord([784, 988, 1175, 1568], 0.35, 0.08, 'square', 0.04); }
  bossDown() { this.boom(true); this.chord([262, 330, 392, 523, 659], 1.6, 0.14, 'triangle', 0.09); }
  lastLight() { this.flare(); this.chord([392, 494, 587, 784], 1.8, 0.12, 'sine', 0.12); }
}
