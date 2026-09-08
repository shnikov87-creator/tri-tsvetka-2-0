// src/effects/Weather.js
// Погодные частицы по всей странице: снег (зима), листья (осень),
// бабочки+пыльца (лето), лепестки+пыльца (весна).

const rand = (a, b) => a + Math.random() * (b - a);

export class Weather {
  constructor(app) {
    this.app = app;
    this.el = null; // #weather
    this.timers = [];
  }

  mount(el) {
    this.el = el;
    this.restart();
  }

  count() {
    const season = this.app.store.get('season');
    const fxMul = this.app.store.get('fx');
    return Math.round(
      (season === 'winter' ? 26 : season === 'autumn' ? 20 : season === 'summer' ? 7 : 14) * fxMul,
    );
  }

  clear() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.el) this.el.innerHTML = '';
  }

  mk(html, cls, size, x, y) {
    const d = document.createElement('div');
    d.className = 'wf ' + (cls || '');
    d.style.width = size + 'px';
    d.style.height = size + 'px';
    d.style.transform = `translate(${x}px,${y}px)`;
    d.innerHTML = html;
    this.el.appendChild(d);
    return d;
  }

  svgSnow() {
    return '<svg viewBox="0 0 20 20"><g stroke="#BBD7EC" stroke-width="1.6" stroke-linecap="round" opacity=".95"><line x1="10" y1="2" x2="10" y2="18"/><line x1="2" y1="10" x2="18" y2="10"/><line x1="4.3" y1="4.3" x2="15.7" y2="15.7"/><line x1="15.7" y1="4.3" x2="4.3" y2="15.7"/></g></svg>';
  }
  svgLeaf(c1, c2) {
    return `<svg viewBox="0 0 20 20"><path d="M10 18 C4 14 4 6 10 2 C16 6 16 14 10 18Z" fill="${c1}" stroke="${c2}" stroke-width="1"/><path d="M10 4 L10 17" stroke="${c2}" stroke-width="1"/></svg>`;
  }
  svgPetal() {
    return '<svg viewBox="0 0 20 20"><path d="M10 2 C15 6 15 13 10 18 C5 13 5 6 10 2Z" fill="#F5C9D8" stroke="#DDA8BE" stroke-width=".8"/></svg>';
  }
  svgButterfly() {
    const L = '<path d="M19.5 21 C12 9 3 10 4 19 C5 26 15 27 19.5 22 Z" fill="#F2C94C" stroke="#C9A227" stroke-width="1"/><path d="M19.5 23 C15 28 9 33 13 36 C17 38 19.5 31 19.5 25 Z" fill="#F7DD7A" stroke="#C9A227" stroke-width="1"/>';
    const R = '<path d="M20.5 21 C28 9 37 10 36 19 C35 26 25 27 20.5 22 Z" fill="#F2C94C" stroke="#C9A227" stroke-width="1"/><path d="M20.5 23 C25 28 31 33 27 36 C23 38 20.5 31 20.5 25 Z" fill="#F7DD7A" stroke="#C9A227" stroke-width="1"/>';
    const body = '<ellipse cx="20" cy="23" rx="1.6" ry="7" fill="#3A352C"/>';
    const wing = (f) => `<g transform="translate(20 21) scale(${f} 1) translate(-20 -21)">${L}${R}</g>`;
    return `<svg viewBox="0 0 40 40">${wing(0.45)}${wing(0.8)}${wing(1)}${body}</svg>`;
  }
  svgPollen() {
    return '<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="4" fill="#F7E8A0" opacity=".95"/><circle cx="7" cy="7" r="6.4" fill="#F7E8A0" opacity=".3"/></svg>';
  }

  spawn() {
    if (!this.el) return;
    const W = innerWidth, H = innerHeight;
    const season = this.app.store.get('season');
    if (season === 'winter') {
      const s = rand(6, 14);
      const d = this.mk(this.svgSnow(), '', s, rand(0, W), -20);
      const dur = rand(9000, 16000), sway = rand(20, 60), x0 = rand(0, W - 20);
      d.animate([
        { transform: `translate(${x0}px,-24px)` },
        { transform: `translate(${x0 + sway}px,${H * 0.35}px)` },
        { transform: `translate(${x0 - sway * 0.5}px,${H * 0.7}px)` },
        { transform: `translate(${x0 + sway * 0.4}px,${H + 10}px) scale(.6)`, opacity: 0.4 },
      ], { duration: dur, easing: 'linear' }).onfinish = () => d.remove();
    } else if (season === 'autumn') {
      const s = rand(10, 20);
      const cols = [['#D4713A', '#A64B1E'], ['#BC6C25', '#8A4E1A'], ['#E0B25E', '#A8862E']];
      const [c1, c2] = cols[Math.floor(Math.random() * 3)];
      const d = this.mk(this.svgLeaf(c1, c2), '', s, rand(0, W), -26);
      const dur = rand(8000, 14000), x0 = rand(0, W - 24);
      d.animate([
        { transform: `translate(${x0}px,-30px) rotate(0deg)` },
        { transform: `translate(${x0 + rand(-90, 90)}px,${H * 0.3}px) rotate(${rand(120, 260)}deg)` },
        { transform: `translate(${x0 + rand(-90, 90)}px,${H * 0.65}px) rotate(${rand(260, 430)}deg)` },
        { transform: `translate(${x0 + rand(-60, 60)}px,${H + 20}px) rotate(${rand(430, 620)}deg)`, opacity: 0.5 },
      ], { duration: dur, easing: 'ease-in-out' }).onfinish = () => d.remove();
    } else if (season === 'summer') {
      if (Math.random() < 0.35) {
        const s = rand(4, 7);
        const d = this.mk(this.svgPollen(), 'pollen', s, rand(0, W), rand(H * 0.3, H));
        d.animate([
          { transform: `translate(${rand(0, W)}px,${H + 8}px)`, opacity: 0 },
          { transform: `translate(${rand(0, W)}px,${rand(H * 0.2, H * 0.6)}px)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${rand(0, W)}px,${rand(0, H * 0.3)}px)`, opacity: 0 },
        ], { duration: rand(9000, 15000), easing: 'ease-in-out' }).onfinish = () => d.remove();
        return;
      }
      const s = rand(22, 34);
      const d = this.mk(this.svgButterfly(), 'fly', s, rand(0, W * 0.8), rand(H * 0.2, H * 0.8));
      const x0 = rand(W * 0.05, W * 0.85), y0 = rand(H * 0.15, H * 0.75);
      const kf = [];
      for (let i = 0; i <= 5; i++) {
        kf.push({ transform: `translate(${x0 + Math.cos(i / 5 * Math.PI * 2) * rand(60, 140)}px,${y0 + Math.sin(i / 5 * Math.PI * 2.4) * rand(40, 110)}px) rotate(${Math.cos(i / 5 * 6) * 14}deg)` });
      }
      const a = d.animate(kf, { duration: rand(14000, 22000), easing: 'ease-in-out', direction: 'alternate', iterations: Infinity });
      setTimeout(() => { a.cancel(); d.remove(); }, rand(25000, 45000));
    } else { // spring
      const s = rand(8, 15);
      const d = this.mk(this.svgPetal(), '', s, rand(0, W), -16);
      const dur = rand(9000, 15000), x0 = rand(0, W - 16);
      d.animate([
        { transform: `translate(${x0}px,-20px) rotate(0deg)` },
        { transform: `translate(${x0 + rand(-70, 70)}px,${H * 0.4}px) rotate(${rand(90, 200)}deg)` },
        { transform: `translate(${x0 + rand(-70, 70)}px,${H + 12}px) rotate(${rand(220, 380)}deg)`, opacity: 0.55 },
      ], { duration: dur, easing: 'ease-in-out' }).onfinish = () => d.remove();
      if (Math.random() < 0.4) {
        const ps = rand(4, 7);
        const pd = this.mk(this.svgPollen(), 'pollen', ps, rand(0, W), H);
        pd.animate([
          { transform: `translate(${rand(0, W)}px,${H + 8}px)`, opacity: 0 },
          { transform: `translate(${rand(0, W)}px,${rand(H * 0.2, H * 0.6)}px)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${rand(0, W)}px,${rand(0, H * 0.3)}px)`, opacity: 0 },
        ], { duration: rand(9000, 15000), easing: 'ease-in-out' }).onfinish = () => pd.remove();
      }
    }
  }

  restart() {
    this.clear();
    const tick = () => {
      if (document.hidden) { this.timers.push(setTimeout(tick, 1500)); return; }
      if (this.el.childElementCount < this.count() * 2) this.spawn();
      const season = this.app.store.get('season');
      this.timers.push(setTimeout(tick, season === 'winter' ? 160 : season === 'autumn' ? 420 : season === 'spring' ? 300 : 900));
    };
    tick();
  }

  // Переключение при смене сезона/частиц.
  switchSeason() {
    this.restart();
  }
}

export default Weather;
