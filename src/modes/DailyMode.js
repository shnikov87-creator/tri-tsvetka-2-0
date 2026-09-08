// src/modes/DailyMode.js
// Ежедневный пазл: один раз в сутки, детерминированный по дате.

import { dailySpec, mulberry32, dateNum } from '../levels/daily.js';

export class DailyMode {
  constructor(app) {
    this.app = app;
    this.name = 'daily';
  }

  start() {
    const g = this.app.game;
    g.mode = 'daily';
    const seed = dateNum();
    const done = this.app.storage.get('daily-' + seed, '0') === '1';
    g.levelCfg = dailySpec(seed);
    g.goal = g.levelCfg.goal || 0;
    document.getElementById('btnHome').style.display = 'inline-flex';
    this.applyDaytime(1);
    this.app.hud.updateLevelHeader();
    this.app.hud.updateModeHUD();
    g.levelStartScore = 0;
    this.app.score.setScore(0);
    g.moves = g.levelCfg.moves;
    this.app.hud.setMoves(g.moves);
    g.picked = 0;
    g.almCounts = [0, 0, 0, 0, 0, 0];
    this.app.hud.updateAlmanac();
    g.statsRun.maxCombo = 0;
    g.undoSnap = null;
    this.app.boosters.updateUndoBtn();
    g.lastTaskHTML = '';
    this.app.goal.updateProgress();
    this.app.hud.resetVase();
    const rnd = mulberry32(seed + 7);
    this.app.overlay.show({
      title: 'Пазл дня',
      text: this.app.goal.previewText() + (done ? ' (сегодня уже решён — можно повторить без награды)' : ' Награда за первое решение — бустер.'),
      btn: 'Начать',
      fn: () => g.deal(rnd),
      tasks: true,
    });
  }

  applyDaytime(level) {
    const tier = Math.floor((level - 1) / 6);
    document.body.dataset.time = ['morning', 'day', 'sunset', 'dusk'][Math.min(tier, 3)];
  }

  restart() {
    this.start();
  }

  async win() {
    const g = this.app.game;
    g.busy = true;
    clearTimeout(g.hintT);
    g.clearSelection();
    this.app.boosters.disarm();
    this.app.save.clear();
    this.app.sound.win();
    this.app.buzz([30, 50, 30]);
    this.app.hud.showRibbon();
    const dk = 'daily-' + dateNum();
    const first = this.app.storage.get(dk, '0') !== '1';
    this.app.storage.set(dk, '1');
    const gift = first ? this.app.boosters.awardRandom() : null;
    this.app.achievements.unlock('daily');
    this.app.overlay.show({
      title: 'Пазл дня решён!',
      text: (first ? `В награду — ${gift}. ` : '') + 'Возвращайтесь завтра за новой раскладкой.',
      btn: 'В дневник',
      fn: () => this.app.setMode('journal'),
    });
  }

  lose() {
    const g = this.app.game;
    g.busy = true;
    clearTimeout(g.hintT);
    this.app.boosters.disarm();
    this.app.save.clear();
    this.app.sound.lose();
    this.app.overlay.show({
      title: 'Сад засыпает…',
      text: `Ходы закончились. Счёт ${g.score.toLocaleString('ru-RU')} — до цели не хватило.`,
      btn: 'Ещё раз',
      fn: () => this.start(),
    });
  }
}

export default DailyMode;
