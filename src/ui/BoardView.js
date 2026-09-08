// src/ui/BoardView.js
// Управляет DOM доски: pointer-события, слайды тайлов, repaint при смене сезона,
// применение операций collapse (move/spawn).

import { N } from '../game/data/seasons.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class BoardView {
  constructor(app) {
    this.app = app;
  }

  mount(boardEl) {
    this.el = boardEl;
    // Pointer events.
    boardEl.addEventListener('pointerdown', (e) => this._onDown(e));
    window.addEventListener('pointermove', (e) => this._onMove(e));
    window.addEventListener('pointerup', (e) => this._onUp(e));
    window.addEventListener('pointercancel', () => { this.app.game.drag = null; });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.app.boosters.disarm(); });
  }

  _onDown(e) {
    const g = this.app.game;
    if (g.busy) return;
    g.resetHintTimer();
    const p = g.cellFromEvent(e);
    if (!p) return;
    if (g.armed) {
      g.handleArmed(p);
      return;
    }
    g.drag = { ...p, px: e.clientX, py: e.clientY };
  }

  _onMove(e) {
    const g = this.app.game;
    if (!g.drag || g.busy) return;
    const dx = e.clientX - g.drag.px, dy = e.clientY - g.drag.py;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < g.board.cell * 0.35) return;
    const dr = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
    const tr = g.drag.r + dr[0], tc = g.drag.c + dr[1];
    if (tr >= 0 && tc >= 0 && tr < N && tc < N) {
      const src = { r: g.drag.r, c: g.drag.c };
      g.drag = null;
      g.clearSelection();
      g.trySwap(src, { r: tr, c: tc });
      return;
    }
    g.drag = null;
  }

  _onUp() {
    const g = this.app.game;
    if (g.drag) {
      g.handleTap(g.drag.r, g.drag.c);
      g.drag = null;
    }
  }

  // Перерисовать все тайлы (при смене сезона).
  repaintAll() {
    const g = this.app.game;
    if (!g.board || !g.board.grid.length) return;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cl = g.board.grid[r][c];
        if (cl) cl.paint(this.app.store.get('season'));
      }
    }
  }

  // Удалить DOM-тайлы из clearMap и анимировать попы.
  async afterWave(clearMap, creations) {
    const g = this.app.game;
    if (!g.board || !g.board.el) return;
    clearMap.forEach(({ r, c }) => {
      const cl = g.board.grid[r][c];
      if (!cl) return;
      cl.el.remove();
      g.board.grid[r][c] = null;
    });
    creations.forEach((cr) => {
      const cl = g.board.grid[cr.r][cr.c];
      if (!cl) return;
      cl.sp = cr.sp;
      if (cr.sp === 'wild') cl.t = -1;
      cl.paint(this.app.store.get('season'));
      this.app.animations.celebrate(cl.el);
      const rect = g.board.el.getBoundingClientRect();
      this.app.particles.spawnSparks(rect.left + (cr.c + 0.5) * g.board.cell, rect.top + (cr.r + 0.5) * g.board.cell, 8);
    });
  }

  // Применить операции collapse: move — двигает существующие тайлы; spawn-* — новые.
  async applyCollapse(ops, maxDist) {
    const g = this.app.game;
    if (!g.board) return;
    for (const op of ops) {
      if (op.kind === 'move') {
        const cl = g.board.grid[op.to.r][op.to.c];
        if (cl) g.board.place(cl.el, op.to.r, op.to.c, op.dur);
      } else if (op.kind === 'spawn-top') {
        const season = this.app.store.get('season');
        op.tile.createElement(season);
        g.board.el.appendChild(op.tile.el);
        op.tile.el.style.transitionDuration = '0s';
        op.tile.el.style.transform = `translate(${op.to.c * g.board.cell}px,${(op.to.r - maxDist - 1) * g.board.cell}px)`;
        void op.tile.el.offsetWidth;
        g.board.place(op.tile.el, op.to.r, op.to.c, op.dur);
      } else if (op.kind === 'spawn-mid') {
        const season = this.app.store.get('season');
        op.tile.createElement(season);
        g.board.el.appendChild(op.tile.el);
        op.tile.el.style.transitionDuration = '0s';
        op.tile.el.style.transform = `translate(${op.to.c * g.board.cell}px,${op.to.r * g.board.cell}px)`;
        void op.tile.el.offsetWidth;
        const body = op.tile.el.querySelector('.body');
        if (body) {
          body.animate(
            [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
            { duration: 320, delay: 120, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'backwards' },
          );
        }
      }
    }
  }

  async collectButterflies(cols) {
    // анимация лежит в Game._collectButterflies; тут только sync-хелпер
    return Promise.resolve();
  }

  // Пересчёт layout слотов/тайлов/овереев при ресайзе.
  reflowOverlays() {
    const g = this.app.game;
    if (!g.board || !g.board.grid.length) return;
    const move = (map) => map.forEach((d, k) => {
      const [r, c] = k.split(',').map(Number);
      d.style.left = c * g.board.cell + 'px';
      d.style.top = r * g.board.cell + 'px';
    });
    move(g.weedDivs); move(g.dewDivs);
  }
}

export default BoardView;
