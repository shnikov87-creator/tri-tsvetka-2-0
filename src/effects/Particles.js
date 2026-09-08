// src/effects/Particles.js
// Эффекты очистки тайлов: лепестки, искры, полёт цветка в вазу.

import { MAX_BLOOM } from '../game/data/seasons.js';

const rand = (a, b) => a + Math.random() * (b - a);

export class Particles {
  constructor(app) {
    this.app = app;
    this.fx = null; // #fx layer
    this.vaseMouth = null; // SVG element
    this.stemsG = null;
    this.bloomsG = null;
    this.bloomCount = 0;
  }

  mount(fxEl, vaseMouth, stemsG, bloomsG) {
    this.fx = fxEl;
    this.vaseMouth = vaseMouth;
    this.stemsG = stemsG;
    this.bloomsG = bloomsG;
  }

  reset() {
    this.bloomCount = 0;
    if (this.stemsG) this.stemsG.innerHTML = '';
    if (this.bloomsG) this.bloomsG.innerHTML = '';
  }

  spawnPetals(x, y, color, count = 6, delay = 0) {
    if (!this.fx) return;
    const fxMul = this.app.store.get('fx');
    count = Math.max(1, Math.round(count * fxMul));
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'petal';
      p.innerHTML = `<svg viewBox="0 0 20 20" fill="${color}"><use href="#petal"/></svg>`;
      this.fx.appendChild(p);
      const a = rand(0, Math.PI * 2), d = rand(36, 85), tx = Math.cos(a) * d, ty = Math.sin(a) * d - 34;
      p.animate([
        { transform: `translate(${x}px,${y}px) rotate(0deg) scale(1)`, opacity: 1 },
        { transform: `translate(${x + tx}px,${y + ty - 14}px) rotate(${rand(-160, 160)}deg) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x + tx}px,${y + ty + 34}px) rotate(${rand(-260, 260)}deg) scale(.7)`, opacity: 0 },
      ], { duration: rand(620, 940), delay, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => p.remove();
    }
  }

  spawnSparks(x, y, count = 7, delay = 0, color = '#D9A62E') {
    if (!this.fx) return;
    const fxMul = this.app.store.get('fx');
    count = Math.max(1, Math.round(count * fxMul));
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'petal';
      s.innerHTML = `<svg viewBox="0 0 20 20" fill="${color}"><use href="#spark"/></svg>`;
      this.fx.appendChild(s);
      const a = rand(0, Math.PI * 2), d = rand(30, 70);
      s.animate([
        { transform: `translate(${x}px,${y}px) scale(1) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d}px) scale(.2) rotate(${rand(90, 240)}deg)`, opacity: 0 },
      ], { duration: rand(420, 640), delay, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => s.remove();
    }
  }

  flyToVase(symId, x, y) {
    if (!this.fx || !this.vaseMouth) return;
    const my = this.app.game.epoch;
    const fl = document.createElement('div');
    fl.className = 'flyer';
    fl.innerHTML = `<svg viewBox="0 0 100 100"><use href="#${symId}" width="100" height="100"/></svg>`;
    this.fx.appendChild(fl);
    const tr = this.vaseMouth.getBoundingClientRect();
    const x1 = tr.left + tr.width / 2, y1 = tr.top + tr.height / 2;
    const cx = (x + x1) / 2 + rand(-40, 40), cy = Math.min(y, y1) - 90 - rand(0, 60);
    const t0 = performance.now(), dur = 700;
    const step = (now) => {
      if (my !== this.app.game.epoch) { fl.remove(); return; }
      const p = Math.min(1, (now - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const px = (1 - e) * (1 - e) * x + 2 * (1 - e) * e * cx + e * e * x1;
      const py = (1 - e) * (1 - e) * y + 2 * (1 - e) * e * cy + e * e * y1;
      fl.style.transform = `translate(${px}px,${py}px) translate(-50%,-50%) rotate(${e * 160}deg) scale(${1 - e * 0.45})`;
      if (p < 1) requestAnimationFrame(step);
      else {
        fl.remove();
        this.addBloomArt(symId);
        this.app.sound.bloom();
      }
    };
    requestAnimationFrame(step);
  }

  scheduleFly(symId, x, y, delay) {
    delay = delay || 0;
    const my = this.app.game.epoch;
    setTimeout(() => {
      if (my !== this.app.game.epoch) return;
      this.flyToVase(symId, x, y);
    }, delay);
  }

  addBloomArt(symId) {
    this.bloomCount++;
    if (this.bloomCount > MAX_BLOOM) return;
    if (!this.stemsG || !this.bloomsG) return;
    const NS = 'http://www.w3.org/2000/svg';
    const XLINK_NS = 'http://www.w3.org/1999/xlink';
    const a = (-56 + Math.random() * 112) * Math.PI / 180, rr = 42 + Math.random() * 66;
    const hx = 110 + Math.sin(a) * rr * 0.85, hy = 196 - Math.cos(a) * rr, sx = 110 + rand(-9, 9);
    const stem = document.createElementNS(NS, 'path');
    stem.setAttribute('d', `M ${sx} 206 Q ${(sx + hx) / 2 + rand(-14, 14)} ${(206 + hy) / 2 + 8} ${hx} ${hy + 7}`);
    stem.setAttribute('class', 'stem');
    this.stemsG.appendChild(stem);
    const u = document.createElementNS(NS, 'use');
    // Современные браузеры понимают href, но для совместимости ставим оба.
    u.setAttributeNS(null, 'href', '#' + symId);
    u.setAttributeNS(XLINK_NS, 'xlink:href', '#' + symId);
    // Центр <use> должен оказаться в (hx, hy): use с x=hx-15, y=hy-15, w=30, h=30.
    u.setAttribute('x', hx - 15);
    u.setAttribute('y', hy - 15);
    u.setAttribute('width', 30);
    u.setAttribute('height', 30);
    // Стартовый масштаб 0 — через SVG-атрибут transform (работает везде,
    // в отличие от CSS transform на SVG <use> в ряде браузеров).
    u.setAttribute('transform', `translate(${hx} ${hy}) scale(0) translate(${-hx} ${-hy})`);
    this.bloomsG.appendChild(u);
    // Двойной rAF — к следующему кадру DOM уже отрисован, и scale(1) покажет бутон.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      u.setAttribute('transform', `translate(${hx} ${hy}) scale(1) translate(${-hx} ${-hy})`);
    }));
  }
}

export default Particles;
