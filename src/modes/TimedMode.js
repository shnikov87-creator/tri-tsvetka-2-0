// src/modes/TimedMode.js
// На время: 120 секунд. Цель — максимальный счёт.

export class TimedMode {
  constructor(app) {
    this.app = app;
    this.name = 'timed';
  }

  start() {
    const g = this.app.game;
    g.mode = 'timed';
    g.levelCfg = { type: 'timed', theme: '', moves: 9999 };
    g.goal = 0;
    this._reset();
    g.deal().then(() => this.startTimer());
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

  startTimer() {
    const g = this.app.game;
    clearInterval(g.timerIv);
    g.timeLeft = 120;
    this.app.hud.setMoves(g.timeLeft);
    g.timerIv = setInterval(() => {
      if (g.mode !== 'timed') { clearInterval(g.timerIv); g.timerIv = null; return; }
      if (this.app.overlay.isOpen() || this.app.ui.settings.isOpen()) return;
      g.timeLeft--;
      this.app.hud.setMoves(g.timeLeft);
      this.app.goal.updateProgress();
      if (g.timeLeft <= 0) this.endTimed();
    }, 1000);
  }

  endTimed() {
    const g = this.app.game;
    g.busy = true;
    clearTimeout(g.hintT);
    g.clearSelection();
    this.app.boosters.disarm();
    clearInterval(g.timerIv);
    g.timerIv = null;
    this.app.sound.win();
    const bt = this.app.store.get('besttimed') || 0;
    const isBest = g.score > bt;
    if (isBest) this.app.store.set('besttimed', g.score);
    this.app.overlay.show({
      title: 'Время вышло!',
      text: `Счёт ${g.score.toLocaleString('ru-RU')}${isBest ? ' — новый рекорд режима!' : ` · лучшее: ${bt.toLocaleString('ru-RU')}`}.`,
      btn: 'Ещё раз',
      fn: () => this.start(),
      extra: { label: 'В дневник', fn: () => this.app.setMode('journal') },
    });
    this.app.overlay.showBtn2();
  }

  restart() {
    this.start();
  }

  async win() {}
  lose() {}
}

export default TimedMode;
