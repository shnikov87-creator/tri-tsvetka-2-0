// src/audio/Sound.js
// Синтез SFX через WebAudio API. Без аудиофайлов — все звуки рисуются осцилляторами.

export class Sound {
  constructor(app) {
    this.app = app;
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.app.store.get('vol');
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  isMuted() {
    return this.app.store.get('mute');
  }

  // Нотный осциллятор.
  tone(f, o = {}) {
    if (this.isMuted() || !this.ensure()) return;
    const {
      t = 0, dur = 0.2, g = 0.05, type = 'sine', slide = 0, atk = 0.02,
    } = o;
    const c = this.ctx;
    const osc = c.createOscillator(), gn = c.createGain(), n0 = c.currentTime + t;
    osc.type = type;
    osc.frequency.setValueAtTime(f, n0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), n0 + dur * 0.85);
    gn.gain.setValueAtTime(0.0001, n0);
    gn.gain.linearRampToValueAtTime(g, n0 + atk);
    gn.gain.exponentialRampToValueAtTime(0.0001, n0 + dur);
    osc.connect(gn); gn.connect(this.master);
    osc.start(n0); osc.stop(n0 + dur + 0.08);
  }

  // Удар шумом (для камня, сорняка).
  noiseHit(o = {}) {
    if (this.isMuted() || !this.ensure()) return;
    const {
      t = 0, dur = 0.14, g = 0.014, freq = 1900, q = 1.1,
    } = o;
    const c = this.ctx;
    if (!this.noiseBuf) {
      this.noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.4), c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    const gn = c.createGain(), n0 = c.currentTime + t;
    gn.gain.setValueAtTime(0.0001, n0);
    gn.gain.linearRampToValueAtTime(g, n0 + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, n0 + dur);
    src.connect(bp); bp.connect(gn); gn.connect(this.master);
    src.start(n0); src.stop(n0 + dur + 0.05);
  }

  // === Game SFX ===
  swap() { this.tone(330, { dur: 0.09, g: 0.022, type: 'triangle' }); }
  fail() { this.tone(238, { dur: 0.13, g: 0.026 }); this.tone(198, { t: 0.09, dur: 0.16, g: 0.026 }); }
  stone() {
    this.tone(176, { dur: 0.13, g: 0.038, slide: -62 });
    this.tone(352, { t: 0.006, dur: 0.06, g: 0.014, type: 'triangle' });
    this.noiseHit({ dur: 0.06, g: 0.007, freq: 900 });
  }
  weed() {
    this.noiseHit({ dur: 0.17, g: 0.012, freq: 2400, q: 0.9 });
    this.tone(523, { t: 0.02, dur: 0.13, g: 0.018, type: 'triangle', slide: -150 });
  }
  dew() { this.tone(660, { dur: 0.18, g: 0.024, slide: 430 }); }
  pop(cb) {
    const sc = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7];
    const f = sc[Math.min(cb - 1, 6)];
    this.tone(f, { dur: 0.24, g: 0.04 });
    this.tone(f * 1.5, { t: 0.035, dur: 0.2, g: 0.018 });
  }
  special() {
    this.tone(392, { dur: 0.2, g: 0.032, type: 'triangle' });
    this.tone(523.25, { t: 0.06, dur: 0.24, g: 0.028, type: 'triangle' });
  }
  wild() {
    [659.25, 830.61, 987.77, 1318.5].forEach((f, i) => this.tone(f, { t: i * 0.05, dur: 0.22, g: 0.028 }));
  }
  garden() {
    [261.6, 329.6, 392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, { t: i * 0.07, dur: 0.34, g: 0.03, type: 'triangle' }));
  }
  bloom() { this.tone(1318.5, { dur: 0.12, g: 0.012 }); }
  growl() { this.tone(294, { dur: 0.2, g: 0.02, type: 'triangle', slide: 120 }); }
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, { t: i * 0.14, dur: 0.34, g: 0.038 }));
  }
  lose() {
    [392, 329.63, 261.63].forEach((f, i) => this.tone(f, { t: i * 0.2, dur: 0.34, g: 0.03 }));
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = v;
  }
}

export default Sound;
