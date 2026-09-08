// src/modes/JournalMode.js
// Основная история: листы дневника с прогрессом по звёздам.

import { mulberry32 } from '../levels/daily.js';

export class JournalMode {
  constructor(app) {
    this.app = app;
    this.name = 'journal';
  }

  start() {
    const g = this.app.game;
    g.mode = 'journal';
    g.timeLeft = 0;
    clearInterval(g.timerIv);
    g.timerIv = null;
    document.getElementById('btnHome').style.display = 'none';
    g.level = this.app.levels.progress;
    g.levelStartScore = 0;
    this.setupLevel();
  }

  setupLevel() {
    const g = this.app.game;
    clearInterval(g.timerIv);
    g.timerIv = null;
    document.getElementById('btnHome').style.display = 'none';
    // Автосмена сезона по прогрессу.
    this.app.seasons.applyForLevel(g.level, { silent: false });
    const cfg = this.app.levels.configFor(g.level);
    g.levelCfg = cfg;
    g.diff = cfg.diff;
    g.diffMul = cfg.diffMul;
    g.goal = cfg.goal || 0;
    g.moves = cfg.moves;
    this.app.hud.setMoves(g.moves);
    g.picked = 0;
    g.bloomCount = 0;
    g.dewCleared = 0; g.weedCleared = 0; g.bfCleared = 0;
    g.dewDivs.clear(); g.weedDivs.clear(); g.dewSet.clear(); g.weedSet.clear();
    g.almCounts = [0, 0, 0, 0, 0, 0];
    this.app.hud.updateAlmanac();
    g.statsRun.maxCombo = 0;
    g.undoSnap = null;
    this.app.boosters.updateUndoBtn();
    g.lastTaskHTML = '';
    this.app.goal.updateProgress();
    this.app.hud.updateLevelHeader();
    this.app.hud.updateModeHUD();
    this.applyDaytime(g.level);
    this.app.score.setScore(g.levelStartScore);
    this.app.hud.resetVase();
    const sv = this.app.save.read();
    const extra = (sv && sv.level === g.level && (sv.mode || 'journal') === 'journal')
      ? { label: 'Продолжить лист', fn: () => this.app.save.continueSaved() }
      : null;
    this.app.overlay.show({
      title: `Лист ${g.level} · ${this.app.goal.typeLabel(g.levelCfg.type)}`,
      text: this.app.goal.previewText(),
      btn: 'Начать',
      fn: () => g.deal(),
      tasks: true,
      diff: true,
      extra,
    });
  }

  applyDaytime(level) {
    const tier = Math.floor((level - 1) / 6);
    document.body.dataset.time = ['morning', 'day', 'sunset', 'dusk'][Math.min(tier, 3)];
  }

  restart() {
    this.app.game.levelStartScore = 0;
    this.setupLevel();
  }

  confirmNewDiary() {
    this.app.overlay.show({
      title: 'Новый дневник',
      text: 'Начнёте дневник с первого листа. Прогресс листов и их звёзды сбросятся, но останутся: рекорд счёта, альбом букетов, достижения, бустеры и заряд лейки.',
      btn: 'Начать заново',
      fn: () => {
        const g = this.app.game;
        g.level = 1;
        g.levelStartScore = 0;
        this.app.levels.setProgress(1);
        this.app.store.set('stars', {});
        this.app.seasons.reset();
        this.app.save.clear();
        this.start();
      },
      extra: { label: 'Отмена', fn: () => this.start() },
      tasks: false,
    });
  }


  async win() {
    const g = this.app.game;
    const my = g.epoch;
    g.busy = true;
    clearTimeout(g.hintT);
    g.clearSelection();
    this.app.boosters.disarm();
    this.app.save.clear();
    const movesAtWin = g.moves;
    if (g.moves > 0) {
      this.app.animations.showPhrase('Лишние ходы — в залп!', true);
      await this.app.sleep(650);
      if (my !== g.epoch) return;
      const salvos = Math.min(g.moves, 8);
      const rect = g.board.el.getBoundingClientRect();
      for (let i = 0; i < salvos; i++) {
        if (my !== g.epoch) return;
        g.moves--;
        this.app.hud.setMoves(g.moves);
        const cands = [];
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
          const cl = g.board.grid[r][c];
          if (cl && !cl.stone && cl.t !== -4) cands.push({ r, c, cl });
        }
        if (!cands.length) break;
        const p = cands[Math.floor(Math.random() * cands.length)];
        this.app.particles.spawnSparks(rect.left + (p.c + 0.5) * g.board.cell, rect.top + (p.r + 0.5) * g.board.cell, 10);
        p.cl.el.classList.add('pop');
        this.app.score.setScore(g.score + 100);
        this.app.sound.pop(2 + (i % 3));
        setTimeout(() => {
          p.cl.el.remove();
          if (g.board.grid[p.r][p.c] === p.cl) g.board.grid[p.r][p.c] = null;
        }, 240);
        await this.app.sleep(160);
      }
    }
    if (my !== g.epoch) return;
    this.app.sound.win();
    this.app.buzz([30, 50, 30]);
    this.app.hud.showRibbon();

    const base = this.app.levels.starBase(g.level);
    const st = this.app.levels.countStars(g.level, g.score);
    this.app.levels.setStars(g.level, st);
    if (this.app.levels.progress < g.level + 1) {
      this.app.levels.setProgress(g.level + 1);
    }
    this.app.hud.updateLevelHeader();
    let boosterMsg = '';
    if (st === 3) {
      const gift = this.app.boosters.awardRandom();
      boosterMsg = ` За три звезды — подарок: ${gift}!`;
    }
    this.app.achievements.unlock('first');
    this.app.progress.add({
      lv: g.level,
      type: this.app.goal.typeLabel(g.levelCfg.type) || 'Лист',
      stars: st,
      score: g.score,
      comp: this._composition(),
      date: new Date().toLocaleDateString('ru-RU'),
    });
    this.app.achievements.checkAll();
    const spent = g.levelCfg.moves - movesAtWin;
    const gotParts = g.almCounts.map((n, i) => (n > 0 ? `${n} ${this._rug(i)}` : null)).filter(Boolean);
    this.app.overlay.show({
      title: 'Лист перевёрнут',
      text: `Цель выполнена — счёт ${g.score.toLocaleString('ru-RU')}.${st < 3 ? ' Соберите больше очков за то же число ходов, чтобы получить три звезды.' : ''}${boosterMsg}`,
      btn: 'Следующий лист',
      fn: () => {
        g.level++;
        g.levelStartScore = g.score;
        this.setupLevel();
      },
      stats: `Каскад ×${g.statsRun.maxCombo} · ходов потрачено: ${spent} из ${g.levelCfg.moves}${g.diff !== 'norm' ? ' · ' + this.app.goal.diffName(g.diff) : ''}` + (gotParts.length ? ` · собрано: ${this._joinRu(gotParts)}` : ''),
      stars: st,
    });
    this.app.overlay.showBtn2();
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
      fn: () => {
        g.score = g.levelStartScore;
        this.setupLevel();
      },
    });
  }

  _rug(i) {
    const seasons = this.app.store.get('season');
    const G = {
      summer: ['ромашек', 'маков', 'тюльпанов', 'васильков', 'подсолнухов', 'веточек зелени'],
      spring: ['подснежников', 'крокусов', 'нарциссов', 'ландышей', 'гиацинтов', 'одуванчиков'],
      autumn: ['астр', 'георгинов', 'физалиса', 'георгинов медных', 'лунника', 'морозника алого'],
      winter: ['морозников светлых', 'зимних роз', 'анютиных глазок', 'снежноягодника', 'морозников тёмных', 'падуба'],
    };
    return G[seasons][i];
  }

  _composition() {
    const g = this.app.game;
    const comp = g.almCounts.map((n, i) => (n > 0 ? { i, n } : null)).filter(Boolean).sort((a, b) => b.n - a.n).slice(0, 3);
    return comp.map((c) => `${c.n}× ${this._sing(c.i)}`).join(', ');
  }

  _sing(i) {
    const seasons = this.app.store.get('season');
    const S = {
      summer: ['ромашки', 'маки', 'тюльпаны', 'васильки', 'подсолнухи', 'зелень'],
      spring: ['подснежник', 'крокус', 'нарцисс', 'ландыш', 'гиацинт', 'одуванчик'],
      autumn: ['астра', 'георгин пурпурный', 'физалис', 'георгин медный', 'лунник', 'морозник алый'],
      winter: ['морозник светлый', 'зимняя роза', 'анютины глазки', 'снежноягодник', 'морозник тёмный', 'падуб'],
    };
    return S[seasons][i];
  }

  _joinRu(a) {
    return a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1];
  }
}

export default JournalMode;
