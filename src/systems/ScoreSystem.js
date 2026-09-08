// src/systems/ScoreSystem.js
// Управление счётом и рекордами. Анимация роста счёта.

const fmt = (n) => n.toLocaleString('ru-RU');

export class ScoreSystem {
  constructor(app) {
    this.app = app;
  }

  setScore(v) {
    const g = this.app.game;
    g.score = v;
    const mode = g.mode;
    if ((mode === 'journal' || mode === 'daily') && v > this.app.store.get('best')) {
      this.app.store.set('best', v);
      this.app.hud.setBest(v);
    }
    if (mode === 'zen') {
      const bz = this.app.store.get('bestzen') || 0;
      if (v > bz) this.app.store.set('bestzen', v);
    }
    if (mode === 'timed') {
      const bt = this.app.store.get('besttimed') || 0;
      if (v > bt) this.app.store.set('besttimed', v);
    }
    const my = ++g.scoreAnimToken;
    const from = g.shownScore;
    const t0 = performance.now();
    const step = (t) => {
      if (my !== g.scoreAnimToken) return;
      const p = Math.min(1, (t - t0) / 450);
      g.shownScore = Math.round(from + (v - from) * (1 - Math.pow(1 - p, 3)));
      this.app.hud.setScore(g.shownScore);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  fmt = fmt;
}

export default ScoreSystem;
