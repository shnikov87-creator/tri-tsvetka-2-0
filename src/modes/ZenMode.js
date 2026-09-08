// src/modes/ZenMode.js
// Дзен: свободный сбор без ходов и цели.

export class ZenMode {
  constructor(app) {
    this.app = app;
    this.name = 'zen';
  }

  start() {
    const g = this.app.game;
    g.mode = 'zen';
    g.levelCfg = { type: 'zen', theme: '', moves: 9999 };
    g.goal = 0;
    this._reset();
    g.deal().then();
  }

  _reset() {
    const g = this.app.game;
    document.getElementById('btnHome').style.display = 'inline-flex';
    this.applyDaytime(1);
    this.app.hud.updateLevelHeader();
    this.app.hud.updateModeHUD();
    this.app.score.setScore(0);
    g.picked = 0;
    g.almCounts = [0, 0, 0, 0, 0, 0];
    this.app.hud.updateAlmanac();
    g.statsRun.maxCombo = 0;
    g.undoSnap = null;
    this.app.boosters.updateUndoBtn();
    this.app.hud.resetVase();
  }

  applyDaytime(level) {
    document.body.dataset.time = 'day';
  }

  restart() {
    this.start();
  }

  // В дзене нет поражения/победы.
  async win() {}
  lose() {}
}

export default ZenMode;
