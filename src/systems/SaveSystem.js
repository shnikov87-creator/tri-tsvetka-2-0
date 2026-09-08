// src/systems/SaveSystem.js
// Снапшот и восстановление активной игры. localStorage SAVE_KEY.

import { Tile } from '../game/Tile.js';
import { N } from '../game/data/seasons.js';

const SAVE_KEY = 'save1';

export class SaveSystem {
  constructor(app) {
    this.app = app;
  }

  snapshotState() {
    const g = this.app.game;
    return {
      level: g.level,
      mode: g.mode,
      levelStartScore: g.levelStartScore,
      cfg: g.levelCfg,
      maxCombo: g.statsRun.maxCombo,
      diff: g.diff,
      diffMul: g.diffMul,
      score: g.score,
      moves: g.moves,
      picked: g.picked,
      bloomCount: g.bloomCount,
      dewCleared: g.dewCleared,
      weedCleared: g.weedCleared,
      bfCleared: g.bfCleared,
      charge: this.app.store.get('charge'),
      almCounts: [...g.almCounts],
      dew: [...g.dewSet],
      weed: [...g.weedSet],
      cells: g.board.grid.map((row) => row.map((cl) => {
        if (!cl) return null;
        if (cl.stone) return { s: 1 };
        if (cl.t === -3) return { t: -3, n: cl.bulb };
        return { t: cl.t, sp: cl.sp || null };
      })),
    };
  }

  write() {
    const g = this.app.game;
    if ((g.mode !== 'journal' && g.mode !== 'daily') || !g.board.grid.length || !g.levelCfg) return;
    try {
      this.app.storage.setJSON(SAVE_KEY, this.snapshotState());
    } catch (e) {
      /* noop */
    }
  }

  read() {
    try {
      return this.app.storage.getJSON(SAVE_KEY, null);
    } catch (e) {
      return null;
    }
  }

  clear() {
    this.app.storage.del(SAVE_KEY);
  }

  rebuildFromSnapshot(s, keepUndo) {
    const g = this.app.game;
    g.epoch++;
    g.busy = true;
    g.clearSelection();
    this.app.boosters.disarm();
    clearTimeout(g.hintT);
    g.lastSwap = null;
    g.drag = null;
    g.board.clear();
    g.board.buildSlots();
    g.dewDivs.clear(); g.weedDivs.clear();
    g.dewSet.clear(); g.weedSet.clear();
    const season = this.app.store.get('season');
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const d = s.cells[r][c];
        let cl;
        if (d && d.s) {
          cl = new Tile(-2, null);
        } else if (d && d.t === -3) {
          cl = new Tile(-3, null);
          cl.bulb = d.n || 3;
        } else {
          cl = new Tile(d ? d.t : 0, (d && d.sp) || null);
        }
        cl.createElement(season);
        g.board.grid[r][c] = cl;
        g.board.el.appendChild(cl.el);
        g.board.place(cl.el, r, c, 0);
      }
    }
    (s.dew || []).forEach((k) => g.addDew(k, false));
    (s.weed || []).forEach((k) => g.addWeed(k, false));
    g.score = s.score;
    g.shownScore = s.score;
    this.app.hud.setScore(s.score);
    g.moves = s.moves;
    this.app.hud.setMoves(s.moves);
    g.picked = s.picked || 0;
    g.bloomCount = s.bloomCount || 0;
    g.dewCleared = s.dewCleared || 0;
    g.weedCleared = s.weedCleared || 0;
    g.bfCleared = s.bfCleared || 0;
    g.almCounts = [...(s.almCounts || [0, 0, 0, 0, 0, 0])];
    if (typeof s.maxCombo === 'number') g.statsRun.maxCombo = s.maxCombo;
    if (typeof s.charge === 'number') {
      this.app.store.set('charge', s.charge);
    }
    this.app.goal.updateProgress();
    this.app.hud.updateAlmanac();
    if (!keepUndo) {
      g.undoSnap = null;
    }
    this.app.boosters.updateUI();
    g.busy = false;
    g.resetHintTimer();
  }

  continueSaved() {
    const s = this.read();
    if (!s || s.level !== this.app.game.level) return;
    const g = this.app.game;
    this.app.overlay.hide();
    g.mode = s.mode || 'journal';
    g.levelStartScore = s.levelStartScore || 0;
    g.levelCfg = s.cfg;
    g.goal = (g.levelCfg && g.levelCfg.goal) || 0;
    if (typeof s.diff === 'string') g.diff = s.diff;
    g.diffMul = s.diffMul || 1;
    this.rebuildFromSnapshot(s, false);
    this.app.hud.applyDaytime(g.level);
    this.app.hud.updateLevelHeader();
    this.app.hud.updateModeHUD();
    this.write();
    this.app.animations.showPhrase('Лист продолжается', true);
  }
}

export default SaveSystem;
