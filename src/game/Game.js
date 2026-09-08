// src/game/Game.js
// Центральный координатор игровой сессии.
// Хранит активное состояние (score, moves, grid), оркестрирует
// deal / swap / resolve / win / lose / undo. Делегирует подсистемам.

import { Board } from './Board.js';
import { Tile } from './Tile.js';
import { Spawner, shuffle } from './Spawner.js';
import { Cascade } from './Cascade.js';
import {
  findMatches, matchAt, findHint, matchAfterSwap, isFlower,
} from './MatchFinder.js';
import {
  planFromGroups, expandSpecials, damageStones,
  tickBulbs, collectButterflies, wildClearMap, wildGardenClearMap,
} from './SpecialTiles.js';
import { planCollapse } from './Gravity.js';
import {
  N, TYPES, MAX_BLOOM, WILD, STONE, BULB, BF,
  SEASONS, seasonSym,
} from './data/seasons.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const fmt = (n) => n.toLocaleString('ru-RU');
const shuffleArr = (a, rnd = Math.random) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class Game {
  constructor(app) {
    this.app = app;
    this.board = null; // Board
    this.spawner = null;
    this.cascade = null;

    // Per-session state.
    this.score = 0;
    this.shownScore = 0;
    this.moves = 30;
    this.goal = 80;
    this.picked = 0;
    this.bloomCount = 0;
    this.almCounts = [0, 0, 0, 0, 0, 0];
    this.level = 1;
    this.levelStartScore = 0;
    this.levelCfg = null;
    this.mode = 'journal';
    this.diffMul = 1;
    this.diff = 'norm';
    this.timeLeft = 0;
    this.timerIv = null;

    // Overlays state.
    this.dewSet = new Set();
    this.weedSet = new Set();
    this.dewCleared = 0;
    this.weedCleared = 0;
    this.bfCleared = 0;
    this.dewDivs = new Map();
    this.weedDivs = new Map();

    // Input/selection.
    this.busy = true;
    this.selected = null;
    this.drag = null;
    this.lastSwap = null;
    this.armed = null; // 'can' | 'glove' | null
    this.gloveA = null;
    this.hintT = null;

    // Undo.
    this.undoSnap = null;

    this.epoch = 0;
    this.scoreAnimToken = 0;
    this.lastTaskHTML = '';
    this.statsRun = { maxCombo: 0 };
    this.taught = { bud: false, line: false, wild: false, bulb: false, bf: false, undo: false };
    this.taughtWeed = false;
    this.taughtDew = false;
  }

  // === Lifecycle ===

  init(boardEl) {
    this.board = new Board(boardEl);
    this.spawner = new Spawner(this.app.store.get('season'));
    this.cascade = new Cascade(this.app);
  }

  setSeason(s) {
    this.spawner.setSeason(s);
    this.app.boardView.repaintAll();
  }

  // === Helpers ===

  sym(t) {
    return seasonSym(this.app.store.get('season'), t);
  }

  fcolor(t) {
    if (t < 0) return '#C9A227';
    return SEASONS[this.app.store.get('season')].colors[t];
  }

  // Применить сложность к текущему уровню (до старта).
  // Пересчитывает levelCfg.moves/diff/diffMul, обновляет HUD и overlay.
  setDifficulty(diff) {
    if (!this.levelCfg) return;
    const raw = this.app.levels.levelSpec(this.level);
    const cfg = this.app.levels.applyDifficultyTo(raw, diff);
    this.levelCfg = cfg;
    this.diff = cfg.diff;
    this.diffMul = cfg.diffMul;
    this.moves = cfg.moves;
    this.app.hud.setMoves(this.moves);
    this.app.bus.emit('game:diff-changed', { diff, moves: cfg.moves });
    // Перерисовать чипы задания/превью.
    this.app.goal.updateProgress();
  }

  sleep = sleep;

  shuffle = shuffleArr;

  // === Slot/sym/getters ===

  computeCell() {
    const caps = { compact: 44, normal: 56, large: 68, max: 76 };
    const cap = caps[this.app.store.get('boardSize')] || 68;
    const wide = window.innerWidth > 920;
    const ledger = document.querySelector('.ledger');
    const ledgerW = wide && ledger ? ledger.offsetWidth : 0;
    const avail = window.innerWidth - ledgerW - (wide ? 130 : 48);
    let cell = Math.max(36, Math.min(cap, Math.floor(avail / N)));
    if (cell * N + ledgerW + 110 > window.innerWidth) {
      cell = Math.max(36, Math.floor((window.innerWidth - ledgerW - 110) / N));
    }
    document.documentElement.style.setProperty('--cell', cell + 'px');
    if (this.board) this.board.setCell(cell);
  }

  // === Deal ===

  async deal(rnd = Math.random) {
    const my = ++this.epoch;
    this.busy = true;
    this.clearSelection();
    this.app.boosters.disarm();
    this.lastSwap = null;
    clearTimeout(this.hintT);
    this.board.clear();
    this.board.buildSlots();
    this.dewDivs.clear(); this.weedDivs.clear();
    this.dewSet.clear(); this.weedSet.clear();
    this.dewCleared = 0; this.weedCleared = 0; this.bfCleared = 0;

    const tiles = this.spawner.deal(this.levelCfg, this.board.grid, rnd);
    for (const { r, c, tile } of tiles) {
      tile.createElement(this.app.store.get('season'));
      this.board.el.appendChild(tile.el);
      tile.el.style.transitionDuration = '0s';
      tile.el.style.transform = `translate(${c * this.board.cell}px, ${(r - N - 1.2) * this.board.cell}px)`;
    }
    void this.board.el.offsetWidth;
    for (const { r, c, tile } of tiles) {
      tile.el.style.transitionDelay = (c * 35 + r * 22) + 'ms';
      if (tile.stone) {
        this.board.place(tile.el, r, c, 0);
        tile.el.querySelector('.body').animate(
          [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
          { duration: 300, delay: c * 35 + r * 22 + 250, easing: 'cubic-bezier(.2,1.3,.4,1)', fill: 'backwards' },
        );
      } else {
        this.board.place(tile.el, r, c, 0.5);
      }
    }

    // Росa и сорняки.
    const free = this.spawner.freeForOverlays(this.board.grid);
    let fi = 0;
    if (this.levelCfg.dew) for (let i = 0; i < this.levelCfg.dew && fi < free.length; i++) this.addDew(free[fi++]);
    if (this.levelCfg.weedsInit) for (let i = 0; i < this.levelCfg.weedsInit && fi < free.length; i++) this.addWeed(free[fi++], true);

    await sleep(1250);
    if (my !== this.epoch) return;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) this.board.grid[r][c].el.style.transitionDelay = '';
    this.busy = false;
    this.resetHintTimer();
    this.undoSnap = null;
    this.app.boosters.updateUI();
    if (this.levelCfg.bf && !this.taught.bf) {
      this.taught.bf = true;
      setTimeout(() => this.app.animations.showPhrase('Бабочку доведите до нижнего ряда!', true), 600);
    }
    this.app.save.write();
    this.app.animations.showPhrase(this.app.goal.startTag(), true);
  }

  // === Dew/weed ===

  addWeed(k, animate) {
    if (this.weedSet.has(k)) return;
    const [r, c] = k.split(',').map(Number);
    const d = document.createElement('div');
    d.className = 'weed' + (animate ? ' in' : '');
    d.innerHTML = '<svg viewBox="0 0 100 100"><use href="#g-weed" width="100" height="100"/></svg>';
    d.style.left = c * this.board.cell + 'px';
    d.style.top = r * this.board.cell + 'px';
    this.board.el.appendChild(d);
    this.weedSet.add(k);
    this.weedDivs.set(k, d);
  }

  removeWeed(k) {
    if (!this.weedSet.has(k)) return;
    this.weedSet.delete(k);
    const d = this.weedDivs.get(k);
    if (d) { this.weedDivs.delete(k); d.classList.add('out'); setTimeout(() => d.remove(), 300); }
  }

  addDew(k, animate = true) {
    if (this.dewSet.has(k)) return;
    const [r, c] = k.split(',').map(Number);
    const d = document.createElement('div');
    d.className = 'dew';
    d.innerHTML = '<svg viewBox="0 0 100 100"><use href="#g-dew" width="100" height="100"/></svg>';
    d.style.left = c * this.board.cell + 'px';
    d.style.top = r * this.board.cell + 'px';
    this.board.el.appendChild(d);
    this.dewSet.add(k);
    this.dewDivs.set(k, d);
  }

  removeDew(k) {
    if (!this.dewSet.has(k)) return;
    this.dewSet.delete(k);
    const d = this.dewDivs.get(k);
    if (d) { this.dewDivs.delete(k); d.classList.add('out'); setTimeout(() => d.remove(), 300); }
  }

  spreadWeeds() {
    if (this.mode !== 'journal' && this.mode !== 'daily') return;
    if (!this.weedSet.size) return;
    let spread = 0;
    const arr = shuffleArr([...this.weedSet]);
    for (const k of arr) {
      if (spread >= 3) break;
      if (Math.random() > 0.3) continue;
      const [r, c] = k.split(',').map(Number);
      const nbs = shuffleArr([[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([rr, cc]) =>
        rr >= 0 && cc >= 0 && rr < N && cc < N && this.board.grid[rr][cc] && !this.board.grid[rr][cc].stone && this.board.grid[rr][cc].t !== BF));
      for (const [rr, cc] of nbs) {
        const kk = rr + ',' + cc;
        if (!this.weedSet.has(kk) && this.weedSet.size < 22) { this.addWeed(kk, true); spread++; }
        break;
      }
    }
    if (spread && !this.taughtWeed) {
      this.taughtWeed = true;
      this.app.animations.showPhrase('Сорняки расползаются!', true);
    }
  }

  // === Input handling ===

  cellFromEvent(e) {
    const rc = this.board.el.getBoundingClientRect();
    const c = Math.floor((e.clientX - rc.left) / this.board.cell);
    const r = Math.floor((e.clientY - rc.top) / this.board.cell);
    return (r < 0 || c < 0 || r >= N || c >= N) ? null : { r, c };
  }

  select(r, c) {
    this.clearSelection();
    const cl = this.board.grid[r] && this.board.grid[r][c];
    if (!cl || !cl.el) return;
    this.selected = { r, c };
    cl.el.classList.add('selected');
  }

  clearSelection() {
    if (this.selected) {
      const row = this.board.grid[this.selected.r];
      const cl = row && row[this.selected.c];
      if (cl && cl.el) cl.el.classList.remove('selected');
    }
    this.selected = null;
  }

  async handleArmed(p) {
    const cl = this.board.grid[p.r] && this.board.grid[p.r][p.c];
    if (!cl) { this.app.boosters.disarm(); return; }
    if (this.armed === 'can') {
      if (!isFlower(cl)) return;
      this.app.boosters.disarm();
      this.app.store.patch('boost', { can: this.app.store.get('boost').can - 1 });
      this.app.boosters.updateUI();
      this.busy = true;
      this.clearSelection();
      const rect = this.board.el.getBoundingClientRect();
      this.app.particles.spawnSparks(rect.left + (p.c + 0.5) * this.board.cell, rect.top + (p.r + 0.5) * this.board.cell, 8, 0, '#6FA8CE');
      cl.el.classList.add('pop');
      this.app.sound.special();
      setTimeout(() => {
        cl.el.remove();
        if (this.board.grid[p.r][p.c] === cl) this.board.grid[p.r][p.c] = null;
      }, 240);
      await sleep(280);
      await this.resolve();
      this.busy = false;
      this.resetHintTimer();
      this.app.boosters.updateUI();
      this.app.save.write();
    } else if (this.armed === 'glove') {
      if (!isFlower(cl)) return;
      if (!this.gloveA) {
        this.gloveA = { ...p };
        cl.el.classList.add('gloveA');
        this.app.sound.swap();
        return;
      }
      if (this.gloveA.r === p.r && this.gloveA.c === p.c) {
        this.app.boosters.disarm();
        return;
      }
      const first = this.board.grid[this.gloveA.r][this.gloveA.c];
      document.querySelectorAll('.tile.gloveA').forEach((el) => el.classList.remove('gloveA'));
      const ga = { ...this.gloveA };
      this.app.boosters.disarm();
      this.app.store.patch('boost', { glove: this.app.store.get('boost').glove - 1 });
      this.app.boosters.updateUI();
      this.busy = true;
      this.clearSelection();
      this.board.place(first.el, p.r, p.c, 0.2);
      this.board.place(cl.el, ga.r, ga.c, 0.2);
      this.board.grid[ga.r][ga.c] = cl;
      this.board.grid[p.r][p.c] = first;
      await sleep(235);
      await this.resolve();
      this.busy = false;
      this.resetHintTimer();
      this.app.boosters.updateUI();
      this.app.save.write();
    }
  }

  async trySwap(a, b) {
    if (this.busy) return;
    const A = this.board.grid[a.r][a.c], B = this.board.grid[b.r][b.c];
    if (!A || !B || A.stone || B.stone || A.t === BF || B.t === BF) return;
    const my = this.epoch;
    this.busy = true;
    this.clearSelection();
    this.app.boosters.disarm();
    this.resetHintTimer();
    const pending = (this.mode === 'journal' || this.mode === 'daily') ? this.app.save.snapshotState() : null;
    this.app.sound.swap();
    this.board.place(A.el, b.r, b.c, 0.2);
    this.board.place(B.el, a.r, a.c, 0.2);
    this.board.grid[a.r][a.c] = B;
    this.board.grid[b.r][b.c] = A;
    await sleep(235);
    if (my !== this.epoch) return;

    // Wild-своп.
    if (A.t === WILD || B.t === WILD) {
      if (pending) { this.undoSnap = pending; this._teachUndo(); this.app.boosters.updateUI(); }
      if (this.mode === 'journal' || this.mode === 'daily') {
        this.moves--;
        this.app.hud.setMoves(this.moves);
      }
      const oPos = A.t === WILD ? a : b;
      const oCl = this.board.grid[oPos.r][oPos.c];
      if (oCl.t < 0 && oCl.t !== WILD) {
        this.app.sound.fail();
        this.board.place(A.el, a.r, a.c, 0.2);
        this.board.place(B.el, b.r, b.c, 0.2);
        this.board.grid[a.r][a.c] = A;
        this.board.grid[b.r][b.c] = B;
        await sleep(235);
        this.busy = false;
        this.resetHintTimer();
        return;
      }
      const clearMap = oCl.t === WILD
        ? wildGardenClearMap(this.board.grid)
        : wildClearMap(this.board.grid, oCl.t);
      if (oCl.t === WILD) {
        this.app.animations.showPhrase('Цветение сада!');
        this.app.sound.garden();
        this.app.store.patch('stats', { garden: this.app.store.get('stats').garden + 1 });
        this.app.achievements.unlock('garden');
      } else {
        this.app.animations.showPhrase('Дикий цветок!');
        this.app.sound.wild();
      }
      this.lastSwap = null;
      this._tickBulbs();
      await this.resolve(clearMap);
      if (my !== this.epoch) return;
      this.spreadWeeds();
      this.busy = false;
      this.resetHintTimer();
      this.app.boosters.updateUI();
      this.app.save.write();
      return;
    }

    if (!findMatches(this.board.grid).length) {
      this.app.sound.fail();
      this.board.place(A.el, a.r, a.c, 0.2);
      this.board.place(B.el, b.r, b.c, 0.2);
      this.board.grid[a.r][a.c] = A;
      this.board.grid[b.r][b.c] = B;
      await sleep(235);
      if (my !== this.epoch) return;
      this.busy = false;
      this.resetHintTimer();
      this.app.boosters.updateUI();
      return;
    }
    if (pending) { this.undoSnap = pending; this._teachUndo(); this.app.boosters.updateUI(); }
    if (this.mode === 'journal' || this.mode === 'daily') {
      this.moves--;
      this.app.hud.setMoves(this.moves);
    }
    this.lastSwap = [{ ...a }, { ...b }];
    this._tickBulbs();
    await this.resolve();
    if (my !== this.epoch) return;
    this.spreadWeeds();
    this.busy = false;
    this.resetHintTimer();
    this.app.boosters.updateUI();
    this.app.save.write();
  }

  _tickBulbs() {
    const grown = tickBulbs(this.board.grid);
    if (grown.length) {
      const rect = this.board.el.getBoundingClientRect();
      for (const { r, c, newType } of grown) {
        const cl = this.board.grid[r][c];
        cl.paint(this.app.store.get('season'));
        this.app.animations.celebrate(cl.el);
        this.app.particles.spawnSparks(rect.left + (c + 0.5) * this.board.cell, rect.top + (r + 0.5) * this.board.cell, 6, 0, '#C9B271');
        this.app.sound.growl();
        this.app.store.patch('stats', { bulbs: this.app.store.get('stats').bulbs + 1 });
        this.app.achievements.checkAll();
      }
    } else {
      // Обновляем счётчики на DOM.
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cl = this.board.grid[r] && this.board.grid[r][c];
          if (cl && cl.t === BULB) {
            const bn = cl.el.querySelector('.bn');
            if (bn) bn.textContent = cl.bulb;
          }
        }
      }
    }
  }

  // === Cascade/resolve ===

  async resolve(initialClear = null) {
    const my = this.epoch;
    let combo = 0, pending = initialClear;
    while (true) {
      let clearMap, creations = [];
      if (pending) {
        clearMap = pending;
        pending = null;
      } else {
        const groups = findMatches(this.board.grid);
        if (!groups.length) break;
        const plan = planFromGroups(groups, combo === 0 ? this.lastSwap : null);
        this.lastSwap = null;
        clearMap = plan.clearMap;
        creations = plan.creations;
      }
      combo++;
      if (combo > this.statsRun.maxCombo) this.statsRun.maxCombo = combo;
      if (combo > this.app.store.get('stats').maxCombo) {
        this.app.store.patch('stats', { maxCombo: combo });
      }
      const keep = new Set(creations.map((cr) => cr.r + ',' + cr.c));
      keep.forEach((k) => clearMap.delete(k));
      const { specialsHit, maxDepth } = expandSpecials(this.board.grid, clearMap, keep);
      const stonesHit = damageStones(this.board.grid, clearMap);
      if (specialsHit) this.app.buzz(25);
      if (creations.length) this.app.achievements.unlock('special');
      const gain = Math.round(
        (clearMap.size * 10 * combo + specialsHit * 50 + creations.length * 60 + stonesHit * 30) * this.diffMul,
      );
      this.app.score.setScore(this.score + gain);
      let sx = 0, sy = 0;
      clearMap.forEach(({ r, c }) => { sx += c; sy += r; });
      this.app.animations.showGain((sx / clearMap.size + 0.5) * this.board.cell, (sy / clearMap.size + 0.5) * this.board.cell, '+' + gain);
      if (combo >= 2) {
        const words = { 2: 'Чудесно!', 3: 'Восхитительно!', 4: 'Великолепно!', 5: 'Волшебно!', 6: 'Неземной букет!' };
        this.app.animations.showPhrase(words[Math.min(combo, 6)]);
      }
      this.app.sound.pop(combo);
      if (specialsHit || creations.length) setTimeout(() => this.app.sound.special(), 130);
      if (stonesHit) setTimeout(() => this.app.sound.stone(), 90);

      const boardRect = this.board.el.getBoundingClientRect();
      let idx = 0, flowerCount = 0, waveWeeds = 0, waveDew = 0;
      clearMap.forEach(({ r, c, depth }) => {
        const cl = this.board.grid[r][c];
        if (!cl) return;
        const k = r + ',' + c, delay = (depth || 0) * 70;
        const px = boardRect.left + (c + 0.5) * this.board.cell, py = boardRect.top + (r + 0.5) * this.board.cell;
        const b = cl.el.querySelector('.body');
        b.style.transitionDelay = delay + 'ms';
        cl.el.classList.add('pop');
        if (cl.stone) {
          this.app.particles.spawnSparks(px, py, 6, delay, '#98937F');
          return;
        }
        flowerCount++;
        if (cl.sp) {
          this.app.particles.spawnSparks(px, py, 7, delay);
          this.app.particles.spawnPetals(px, py, this.fcolor(cl.t), 9, delay);
        } else {
          this.app.particles.spawnPetals(px, py, this.fcolor(cl.t), 6, delay);
        }
        if (cl.t >= 0 || cl.t === WILD) this.app.particles.scheduleFly(this.sym(cl.t), px, py, delay + (idx % 6) * 24);
        idx++;
        if (cl.t >= 0) this.almCounts[cl.t]++;
        if (this.dewDivs.has(k)) {
          this.removeDew(k);
          this.dewCleared++;
          waveDew++;
          this.app.store.patch('stats', { dew: this.app.store.get('stats').dew + 1 });
          this.app.particles.spawnSparks(px, py, 5, delay + 120, '#6FA8CE');
        }
        if (this.weedDivs.has(k)) {
          this.removeWeed(k);
          this.weedCleared++;
          waveWeeds++;
          this.app.store.patch('stats', { weeds: this.app.store.get('stats').weeds + 1 });
        }
      });
      this.app.hud.updateAlmanac();
      if (waveWeeds) {
        this.app.score.setScore(this.score + Math.round(waveWeeds * 25 * this.diffMul));
        setTimeout(() => this.app.sound.weed(), 120);
      }
      if (waveDew) {
        this.app.score.setScore(this.score + Math.round(waveDew * 40 * this.diffMul));
        setTimeout(() => this.app.sound.dew(), 170);
        if (!this.taughtDew) {
          this.taughtDew = true;
          this.app.animations.showPhrase('Роса стряхнута!', true);
        }
      }
      const oldCharge = this.app.store.get('charge');
      this.app.store.set('charge', Math.min(100, oldCharge + flowerCount * 3));
      if (Math.floor(oldCharge / 100) < Math.floor(this.app.store.get('charge') / 100)) {
        this.app.banner('Лейка полна!');
      }
      this.app.boosters.updateUI();
      this.app.achievements.checkAll();
      await sleep(340 + maxDepth * 70 + (stonesHit ? 90 : 0));
      if (my !== this.epoch) return;
      clearMap.forEach(({ r, c }) => {
        const cl = this.board.grid[r][c];
        if (!cl) return;
        cl.el.remove();
        this.board.grid[r][c] = null;
      });
      creations.forEach((cr) => {
        const cl = this.board.grid[cr.r][cr.c];
        if (!cl) return;
        cl.sp = cr.sp;
        if (cr.sp === 'wild') cl.t = WILD;
        cl.paint(this.app.store.get('season'));
        this.app.animations.celebrate(cl.el);
        this.app.particles.spawnSparks(boardRect.left + (cr.c + 0.5) * this.board.cell, boardRect.top + (cr.r + 0.5) * this.board.cell, 8);
        const teach = { bud: 'Бутон — убирает всё вокруг себя!', line: 'Соцветие — убирает ряд и столбец!' };
        if (!this.taught[cr.sp] && teach[cr.sp]) {
          this.taught[cr.sp] = true;
          this.app.animations.showPhrase(teach[cr.sp], true);
        }
      });
      this.picked += flowerCount;
      this.app.goal.updateProgress();
      await this.collapse();
      await sleep(110);
      if (my !== this.epoch) return;
      // Сбор бабочек.
      const bfCols = collectButterflies(this.board.grid);
      if (bfCols.length) {
        await this._collectButterflies(bfCols);
        if (my !== this.epoch) return;
      }
    }
    if (this.mode === 'zen' || this.mode === 'timed') return;
    if (this.app.goal.won()) {
      await this.app.currentModeObject.win();
      return;
    }
    if (this.moves <= 0) {
      this.app.currentModeObject.lose();
      return;
    }
    if (!findHint(this.board.grid)) await this.reshuffle(my);
  }

  async _collectButterflies(cols) {
    const rect = this.board.el.getBoundingClientRect();
    for (const c of cols) {
      const cl = this.board.grid[N - 1][c];
      if (!cl || cl.t !== BF) continue;
      const px = rect.left + (c + 0.5) * this.board.cell;
      const py = rect.top + (N - 0.5) * this.board.cell;
      this.app.particles.spawnSparks(px, py, 9, 0, '#C97B3D');
      cl.el.remove();
      this.board.grid[N - 1][c] = null;
      this.app.particles.flyToVase('g-butterfly', px, py);
      this.bfCleared++;
      this.app.store.patch('stats', { bfs: this.app.store.get('stats').bfs + 1 });
      this.app.achievements.checkAll();
      this.app.sound.special();
      this.app.buzz(22);
    }
    this.app.goal.updateProgress();
    this.app.save.write();
    await this.collapse();
    await sleep(180);
  }

  async collapse() {
    const { ops, maxDist } = planCollapse(this.board.grid, this.spawner);
    await this.app.boardView.applyCollapse(ops, maxDist);
    return sleep(maxDist * 60 + 430);
  }

  async reshuffle(my) {
    this.app.animations.showPhrase('Пересаживаю грядку…', true);
    await sleep(550);
    if (my !== this.epoch) return;
    const normal = [];
    this.board.forEach((cl) => { if (cl && cl.t >= 0) normal.push(cl); });
    let tries = 0;
    do {
      const types = shuffleArr(normal.map((cl) => cl.t));
      let i = 0;
      normal.forEach((cl) => { cl.t = types[i++]; cl.paint(this.app.store.get('season')); });
      tries++;
    } while ((findMatches(this.board.grid).length || !findHint(this.board.grid)) && tries < 300);
    await sleep(420);
  }

  resetHintTimer() {
    clearTimeout(this.hintT);
    // Кешируем подсказанные тайлы, чтобы не дёргать querySelectorAll на каждый reset.
    if (this._hintTiles) {
      for (const el of this._hintTiles) el.classList.remove('hint');
      this._hintTiles = null;
    }
    this.hintT = setTimeout(() => {
      if (this.busy || !this.board.grid.length) return;
      const h = findHint(this.board.grid);
      if (h) {
        this._hintTiles = h.map((p) => this.board.grid[p.r][p.c].el);
        for (const el of this._hintTiles) el.classList.add('hint');
      }
    }, 7000);
  }

  handleTap(r, c) {
    if (this.busy) return;
    const cl = this.board.grid[r] && this.board.grid[r][c];
    // Пустая ячейка (например, после очистки до респавна) — игнорируем тап.
    if (!cl) { this.clearSelection(); return; }
    if (cl.stone) { this.clearSelection(); return; }
    if (!this.selected) { this.select(r, c); return; }
    if (this.selected.r === r && this.selected.c === c) { this.clearSelection(); return; }
    if (Math.abs(this.selected.r - r) + Math.abs(this.selected.c - c) === 1) {
      const s = this.selected;
      this.clearSelection();
      this.trySwap(s, { r, c });
    } else this.select(r, c);
  }

  useWatering() {
    if (this.busy || this.app.store.get('charge') < 100 || !this.board.grid.length) return;
    let any = false;
    for (let r = 0; r < N && !any; r++) for (let c = 0; c < N && !any; c++) if (isFlower(this.board.grid[r][c])) any = true;
    if (!any) return;
    this.app.store.set('charge', 0);
    this.app.boosters.updateUI();
    const rr = Math.floor(Math.random() * N), cc = Math.floor(Math.random() * N);
    const clearMap = new Map();
    for (let k = 0; k < N; k++) {
      [[rr, k], [k, cc]].forEach(([r, c]) => {
        const cl = this.board.grid[r][c];
        if (isFlower(cl)) clearMap.set(r + ',' + c, { r, c, depth: Math.abs(r - rr) + Math.abs(c - cc) });
      });
    }
    this.app.animations.showPhrase('Полив!', true);
    this.app.sound.special();
    this.app.buzz(30);
    this.busy = true;
    this.clearSelection();
    this.resolve(clearMap).then(() => {
      this.busy = false;
      this.resetHintTimer();
      this.app.boosters.updateUI();
      this.app.save.write();
    });
  }

  doUndo() {
    if (this.busy || !this.undoSnap || (this.mode !== 'journal' && this.mode !== 'daily')) return;
    const s = this.undoSnap;
    this.undoSnap = null;
    this.app.save.rebuildFromSnapshot(s, true);
    this.app.boosters.updateUI();
    this.app.buzz(15);
    this.app.animations.showPhrase('Ход отменён', true);
    this.app.save.write();
  }

  // Показать подсказку про Undo-бонус при первом появлении undoSnap.
  _teachUndo() {
    if (this.taught.undo) return;
    if (this.app.store.get('boost').undo <= 0) return;
    this.taught.undo = true;
    setTimeout(() => {
      this.app.animations.showPhrase('Отменить ход — бонус «Отмена»', true);
    }, 700);
  }
}

export { sleep, shuffleArr, fmt, rand };
export default Game;
