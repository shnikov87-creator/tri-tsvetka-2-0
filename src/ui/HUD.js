// src/ui/HUD.js
// Боковая «Книга садовника»: счёт, ходы, рекорд, прогресс-бар, гербарий, ваза.
// Не управляет взаимодействиями — только отображает состояние.
// Подписывается на store:changed — обновляет alm/тему автоматически.

import { SEASONS, seasonSym } from '../game/data/seasons.js';

const fmt = (n) => n.toLocaleString('ru-RU');
const ORD = ['первый', 'второй', 'третий', 'четвёртый', 'пятый', 'шестой', 'седьмой', 'восьмой', 'девятый', 'десятый', 'одиннадцатый', 'двенадцатый'];

export class HUD {
  constructor(app) {
    this.app = app;
    this.almCells = null;
    this.stemsG = null;
    this.bloomsG = null;
    this.ribbon = null;
    this._storeUnsub = null;
  }

  mount(almSel, stemsG, bloomsG, ribbon) {
    this.almCells = document.querySelectorAll(almSel);
    this.stemsG = stemsG;
    this.bloomsG = bloomsG;
    this.ribbon = ribbon;
    this.applySeasonUI();
    this.setBest(this.app.store.get('best'));
    // Подписка на store: реагируем на смену сезона/темы автоматически.
    this._storeUnsub = this.app.bus.on('settings:changed', (patch) => {
      if (Object.prototype.hasOwnProperty.call(patch, 'season')) {
        this.applySeasonUI();
      }
    });
  }

  // === Score/Moves ===
  setScore(v) {
    document.getElementById('score').textContent = fmt(v);
  }
  setMoves(v) {
    document.getElementById('moves').textContent = v;
    // Чип ходов в boostbar — обновляем счётчик и подсветку «мало ходов».
    const chip = document.getElementById('movesChip');
    if (chip) {
      const b = document.getElementById('movesCnt');
      if (b) b.textContent = v;
      // Подсветка terra когда ходов <= 5 (не в дзене/таймере).
      const mode = this.app.game ? this.app.game.mode : 'journal';
      const low = (mode === 'journal' || mode === 'daily') && v <= 5;
      chip.classList.toggle('low', low);
    }
  }
  setBest(v) {
    document.getElementById('best').textContent = fmt(v);
  }

  setModeBest(text) {
    document.getElementById('modeBest').textContent = text || '';
  }

  // === Progress / Goal ===
  setProgress(label, txt, pct) {
    document.getElementById('goalType').textContent = label;
    document.getElementById('pickedTxt').textContent = txt;
    document.getElementById('barFill').style.width = pct + '%';
  }

  // === Almanac ===
  updateAlmanac() {
    const g = this.app.game;
    if (!this.almCells) return;
    this.almCells.forEach((el, i) => {
      let txt = String(g.almCounts[i]);
      let want = false;
      if (g.levelCfg && g.levelCfg.type === 'order') {
        const t = g.levelCfg.targets.find(([j]) => j === i);
        if (t) { want = true; txt = `${g.almCounts[i]} / ${t[1]}`; }
      }
      el.querySelector('b').textContent = txt;
      el.classList.toggle('want', want);
    });
  }

  // Обновляет подписи И SVG-иконки alm-ячеек под текущий сезон.
  applySeasonUI() {
    if (!this.almCells) return;
    const season = this.app.store.get('season');
    const data = SEASONS[season];
    if (!data) return;
    this.almCells.forEach((el, i) => {
      const useEl = el.querySelector('use');
      if (useEl) useEl.setAttribute('href', '#' + data.syms[i]);
      const iEl = el.querySelector('i');
      if (iEl) iEl.textContent = data.ru_alm[i];
    });
  }

  // === Header / mode HUD ===
  updateLevelHeader() {
    const g = this.app.game;
    const lvlEl = document.getElementById('lvlName');
    if (g.mode === 'zen') { lvlEl.textContent = 'дзен · свободный сбор'; return; }
    if (g.mode === 'timed') { lvlEl.textContent = 'на время · 120 секунд'; return; }
    if (g.mode === 'daily') { lvlEl.textContent = 'пазл дня'; return; }
    const themes = ['луговой', 'полевой', 'садовый', 'медовый', 'травный', 'вечерний'];
    const theme = themes[(g.level - 1) % 6];
    const st = this.app.levels.getStars(g.level) || 0;
    lvlEl.textContent = `лист ${ORD[g.level - 1] || g.level} · ${theme}` + (st ? ' ' + '★'.repeat(st) + '☆'.repeat(3 - st) : '');
  }

  updateModeHUD() {
    const g = this.app.game;
    const movesCap = document.getElementById('movesCap');
    const movesEl = document.getElementById('moves');
    const chip = document.getElementById('movesChip');
    if (g.mode === 'zen') {
      movesCap.textContent = 'Ходы';
      movesEl.textContent = '∞';
      // В дзене чип ходов скрываем (бесконечные ходы).
      if (chip) chip.style.display = 'none';
      this.setModeBest('');
    } else if (g.mode === 'timed') {
      movesCap.textContent = 'Время';
      movesEl.textContent = g.timeLeft;
      // На время — чип показывает секунды.
      if (chip) {
        chip.style.display = '';
        const b = document.getElementById('movesCnt');
        if (b) b.textContent = g.timeLeft;
        chip.classList.toggle('low', g.timeLeft <= 10);
      }
      const bt = this.app.store.get('besttimed') || 0;
      this.setModeBest(bt ? ` · лучшее ${fmt(bt)}` : '');
    } else {
      movesCap.textContent = 'Ходы';
      if (chip) chip.style.display = '';
      this.setModeBest('');
    }
  }

  applyDaytime(level) {
    const tier = Math.floor((level - 1) / 6);
    document.body.dataset.time = ['morning', 'day', 'sunset', 'dusk'][Math.min(tier, 3)];
  }

  // === Task chips ===
  renderTask() {
    const el = document.getElementById('taskbar');
    if (!el) return;
    const g = this.app.game;
    if (!g.levelCfg) { el.innerHTML = ''; return; }
    const s = g.levelCfg;
    let chips = '';
    const chipHTML = (icon, cur, need, done, label) =>
      `<span class="chip${done ? ' done' : ''}">${icon}<span class="chip-num"><b>${cur}</b><i>/${need}</i></span>${label ? `<span class="chip-lbl">${label}</span>` : ''}</span>`;
    const chipIcon = (i) => `<svg viewBox="0 0 100 100"><use href="#${this._sym(i)}" width="100" height="100"/></svg>`;

    if (s.type === 'order') {
      chips = s.targets.map(([i, n]) =>
        chipHTML(chipIcon(i), Math.min(g.almCounts[i], n), n, g.almCounts[i] >= n, this._sing(i))).join('');
    } else if (s.type === 'dew') {
      chips = chipHTML('<svg viewBox="0 0 100 100"><use href="#g-dew" width="100" height="100"/></svg>', Math.min(g.dewCleared, s.dew), s.dew, g.dewCleared >= s.dew, 'роса');
    } else if (s.type === 'weeds') {
      chips = chipHTML('<svg viewBox="0 0 100 100"><use href="#g-weed" width="100" height="100"/></svg>', Math.min(g.weedCleared, s.weedsNeed), s.weedsNeed, g.weedCleared >= s.weedsNeed, 'сорняки');
    } else if (s.type === 'butterfly') {
      chips = chipHTML('<svg viewBox="0 0 100 100"><use href="#g-butterfly" width="100" height="100"/></svg>', Math.min(g.bfCleared, s.bf), s.bf, g.bfCleared >= s.bf, 'бабочки');
    } else if (s.type === 'zen') {
      chips = `<span class="chip"><svg viewBox="0 0 100 100"><use href="#g-bouquet" width="100" height="100"/></svg><span class="chip-num"><b>${g.picked}</b></span><span class="chip-lbl">дзен</span></span>`;
    } else if (s.type === 'timed') {
      chips = `<span class="chip"><svg viewBox="0 0 100 100"><use href="#g-plus" width="100" height="100"/></svg><span class="chip-num"><b>${g.timeLeft}</b><i>сек</i></span><span class="chip-lbl">время</span></span>`;
    } else {
      chips = chipHTML('<svg viewBox="0 0 100 100"><use href="#g-bouquet" width="100" height="100"/></svg>', Math.min(g.picked, g.goal), g.goal, g.picked >= g.goal, 'букет');
    }
    const html = `<span class="tb-cap">Задание листа</span><div class="tb-chips">${chips}</div>`;
    if (html !== g.lastTaskHTML) {
      g.lastTaskHTML = html;
      el.innerHTML = html;
    }
  }

  _sym(t) {
    return seasonSym(this.app.store.get('season'), t);
  }

  _sing(i) {
    return SEASONS[this.app.store.get('season')].ru_sing[i];
  }

  // === Vase ===
  resetVase() {
    this.app.particles.reset();
    if (this.ribbon) this.ribbon.classList.remove('show');
  }
  showRibbon() {
    if (this.ribbon) this.ribbon.classList.add('show');
  }
}

export default HUD;
