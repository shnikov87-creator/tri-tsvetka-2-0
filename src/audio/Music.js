// src/audio/Music.js
// Фоновая атмосфера: птицы / ручей / дождь. Слои синтезируются через WebAudio.

const AMB_CFG = {
  birds: { wind: { gain: 0.005, freq: 420, q: 0.5 }, birdGap: [4200, 8500], cuckoo: true, water: false, rain: false },
  brook: { wind: { gain: 0.0012, freq: 480, q: 0.7 }, birdGap: [9000, 17000], cuckoo: false, water: true, rain: false },
  rain: { wind: { gain: 0.001, freq: 380, q: 0.6 }, birdGap: [15000, 30000], cuckoo: false, water: false, rain: true },
};

export class Music {
  constructor(app) {
    this.app = app;
    this.started = false;
    this.startedFast = false;
    this.timers = [];
    this.layers = [];
  }

  cfg() {
    return AMB_CFG[this.app.store.get('ambStyle')];
  }

  clearTimers() {
    this.timers.forEach((id) => { clearTimeout(id); clearInterval(id); });
    this.timers = [];
  }

  tm(fn, ms, isIv) {
    this.timers.push(isIv ? setInterval(fn, ms) : setTimeout(fn, ms));
  }

  noise() {
    const c = this.app.sound.ctx;
    if (!this.app.sound.noiseBuf || this.app.sound.noiseBuf.duration < 2) {
      this.app.sound.noiseBuf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
      const d = this.app.sound.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = this.app.sound.noiseBuf;
    src.loop = true;
    return src;
  }

  // Коричневый шум (brown noise) — мягкий, низкочастотный.
  // Идеален для воды: интегрированный белый шум с утечкой, без резких пиков.
  noiseBrown() {
    const c = this.app.sound.ctx;
    if (!this._brownBuf) {
      this._brownBuf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
      const d = this._brownBuf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.5;
      }
    }
    const src = c.createBufferSource();
    src.buffer = this._brownBuf;
    src.loop = true;
    return src;
  }

  stopLayers(fast) {
    const c = this.app.sound.ctx;
    this.layers.forEach((L) => {
      try {
        L.g.gain.cancelScheduledValues(c.currentTime);
        L.g.gain.setTargetAtTime(0.0001, c.currentTime, fast ? 0.05 : 0.4);
        const t = c.currentTime + (fast ? 0.25 : 1.4);
        L.src.stop(t);
        if (L.lfo) L.lfo.stop(t);
        if (L.lfo2) L.lfo2.stop(t);
      } catch (e) { /* noop */ }
    });
    this.layers = [];
  }

  mkWind(cf) {
    const c = this.app.sound.ctx;
    const src = this.noise();
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = cf.wind.freq; bp.Q.value = cf.wind.q;
    const g = c.createGain(), n0 = c.currentTime;
    g.gain.setValueAtTime(0.0001, n0);
    g.gain.linearRampToValueAtTime(cf.wind.gain, n0 + (this.startedFast ? 2.5 : 5));
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.05 + Math.random() * 0.06; lg.gain.value = cf.wind.gain * 0.55;
    lfo.connect(lg); lg.connect(g.gain);
    src.connect(bp); bp.connect(g); g.connect(this.app.sound.master);
    src.start(); lfo.start();
    this.layers.push({ src, lfo, g });
  }

  mkWater() {
    const c = this.app.sound.ctx;
    // === Мягкий ручей на коричневом шуме ===
    // Brown noise через lowpass — мягкое, непрерывное течение воды без резких пиков.
    const src = this.noiseBrown();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.5;
    const g = c.createGain(), n0 = c.currentTime;
    g.gain.setValueAtTime(0.0001, n0);
    g.gain.linearRampToValueAtTime(0.012, n0 + 4);
    // Медленный LFO на gain — вода «дышит» (то громче, то тише), без воющего эффекта.
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 0.1; lg.gain.value = 0.003;
    lfo.connect(lg); lg.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(this.app.sound.master);
    src.start(); lfo.start();
    this.layers.push({ src, lfo, g });
  }

  mkRain() {
    const c = this.app.sound.ctx;
    // === Реалистичный дождь ===
    // 1) Низкочастотный гул — дальний дождь/ветер (bandpass 300Hz, очень тихий).
    const srcLow = this.noise();
    const bpLow = c.createBiquadFilter();
    bpLow.type = 'bandpass'; bpLow.frequency.value = 300; bpLow.Q.value = 0.5;
    const gLow = c.createGain(), n0 = c.currentTime;
    gLow.gain.setValueAtTime(0.0001, n0);
    gLow.gain.linearRampToValueAtTime(0.003, n0 + 5);
    srcLow.connect(bpLow); bpLow.connect(gLow); gLow.connect(this.app.sound.master);
    srcLow.start();
    this.layers.push({ src: srcLow, g: gLow });

    // 2) Шорох листвы — очень тихий высокочастотный шум (bandpass 5kHz).
    const srcHi = this.noise();
    const bpHi = c.createBiquadFilter();
    bpHi.type = 'bandpass'; bpHi.frequency.value = 5000; bpHi.Q.value = 0.8;
    const gHi = c.createGain();
    gHi.gain.setValueAtTime(0.0001, n0);
    gHi.gain.linearRampToValueAtTime(0.0015, n0 + 5);
    srcHi.connect(bpHi); bpHi.connect(gHi); gHi.connect(this.app.sound.master);
    srcHi.start();
    this.layers.push({ src: srcHi, g: gHi });
    // Отдельные капли синтезируются в drop() — sharp noise bursts.
  }

  birdPhrase() {
    if (this.app.store.get('mute') || !this.app.store.get('music') || !this.app.sound.ensure()) return;
    const c = this.app.sound.ctx;
    const kind = Math.random();
    if (kind < 0.5) {
      let t = 0, f = 1400 + Math.random() * 1500;
      const n = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const dur = 0.05 + Math.random() * 0.09, n0 = c.currentTime + t;
        const o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, n0);
        o.frequency.exponentialRampToValueAtTime(Math.max(500, f * (0.72 + Math.random() * 0.6)), n0 + dur);
        v.frequency.value = 22 + Math.random() * 26; vg.gain.value = f * 0.05;
        v.connect(vg); vg.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, n0);
        g.gain.linearRampToValueAtTime(0.010 + Math.random() * 0.006, n0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, n0 + dur);
        o.connect(g); g.connect(this.app.sound.master);
        o.start(n0); o.stop(n0 + dur + 0.05); v.start(n0); v.stop(n0 + dur + 0.05);
        t += dur + 0.04 + Math.random() * 0.12;
        f = Math.max(700, Math.min(3400, f * (0.8 + Math.random() * 0.5)));
      }
    } else if (kind < 0.8) {
      const base = 2200 + Math.random() * 900, n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) this.app.sound.tone(base * (i % 2 ? 0.88 : 1.06), { t: i * 0.11, dur: 0.07, g: 0.009, slide: -90 });
    } else {
      const a = 3100 + Math.random() * 250, r = 2 + (Math.random() < 0.5 ? 2 : 0);
      for (let i = 0; i < r; i++) {
        this.app.sound.tone(a, { t: i * 0.24, dur: 0.06, g: 0.011, slide: -140 });
        this.app.sound.tone(a * 0.82, { t: i * 0.24 + 0.11, dur: 0.07, g: 0.010, slide: -120 });
      }
    }
  }

  cuckoo() {
    if (this.app.store.get('mute') || !this.app.store.get('music') || !this.app.sound.ensure()) return;
    const f = 690 + Math.random() * 60;
    this.app.sound.tone(f, { dur: 0.16, g: 0.017, atk: 0.03 });
    this.app.sound.tone(f * 0.79, { t: 0.24, dur: 0.2, g: 0.015, atk: 0.03 });
  }

  bloop() {
    if (this.app.store.get('mute') || !this.app.store.get('music') || !this.app.sound.ensure()) return;
    // Мягкий бульк — noise burst через bandpass с низкой частотой и низким Q.
    // Не тоны (как раньше), а мягкий всплеск — как капля в воду.
    this.app.sound.noiseHit({
      dur: 0.08 + Math.random() * 0.04,
      g: 0.0035,
      freq: 300 + Math.random() * 200,
      q: 0.4,
      atk: 0.005,
    });
  }

  drop() {
    if (this.app.store.get('mute') || !this.app.store.get('music') || !this.app.sound.ensure()) return;
    const c = this.app.sound.ctx;
    // Реалистичная капля дождя — короткий шумовой всплеск с sharp attack.
    // Разная «поверхность»: лист (высокая), камень (средняя), вода (низкая).
    const surface = Math.random();
    let freq, q, g, dur;
    if (surface < 0.5) {
      // Капля по листу — высокая частота, тихий.
      freq = 3000 + Math.random() * 2000; q = 1.5; g = 0.0028; dur = 0.04;
    } else if (surface < 0.85) {
      // Капля по камню — средняя частота.
      freq = 1500 + Math.random() * 1500; q = 1.2; g = 0.0035; dur = 0.05;
    } else {
      // Капля в лужу — низкая частота, с «бульком».
      freq = 600 + Math.random() * 600; q = 0.8; g = 0.004; dur = 0.07;
    }
    this.app.sound.noiseHit({ dur, g, freq, q, atk: 0.002 });
  }

  start(fast) {
    if (this.started) return;
    this.started = true;
    this.startedFast = !!fast;
    this.app.sound.ensure();
    const cf = this.cfg();
    this.mkWind(cf);
    if (cf.water) this.mkWater();
    if (cf.rain) this.mkRain();
    const blo = () => { this.birdPhrase(); this.tm(blo, cf.birdGap[0] + Math.random() * cf.birdGap[1]); };
    this.tm(blo, fast ? 1800 : 4000 + Math.random() * 4000);
    if (cf.cuckoo) {
      const ck = () => { this.cuckoo(); this.tm(ck, 45000 + Math.random() * 50000); };
      this.tm(ck, 18000 + Math.random() * 30000);
    }
    if (cf.water) {
      // Мягкие бульки — реже и тише, не отвлекают.
      const bl = () => { this.bloop(); this.tm(bl, 600 + Math.random() * 900); };
      this.tm(bl, 1500);
    }
    if (cf.rain) {
      // Капли дождя — часто (50-150ms), реалистичная плотность.
      const dr = () => { this.drop(); this.tm(dr, 50 + Math.random() * 100); };
      this.tm(dr, 200);
    }
  }

  stop(fast) {
    this.started = false;
    this.clearTimers();
    this.stopLayers(fast);
  }

  switchAmb(v) {
    this.app.store.set('ambStyle', v);
    if (this.started) {
      this.stop(true);
      if (this.app.store.get('music') && !this.app.store.get('mute')) {
        this.app.sound.ensure();
        this.start(true);
      }
    }
    this.app.banner('Атмосфера: ' + { birds: 'Птицы', brook: 'Ручей', rain: 'Дождь' }[v]);
  }

  setMusicPref(on) {
    this.app.store.set('music', on);
    if (on && !this.app.store.get('mute')) this.start();
    else this.stop();
  }
}

export default Music;
