// src/ui/Overlay.js
// Универсальная модалка для win/lose/daily/mode-выбора. Сам рендерит
// заголовок, текст, звёзды, кнопки; опционально — сегменты сложности/режимов.

import { dateNum } from '../levels/daily.js';

export class Overlay {
  constructor(app) {
    this.app = app;
    this.el = null;
    this.isOpenFlag = false;
    this.action = null;
    this.action2 = null;
  }

  mount(el) {
    this.el = el;
    document.getElementById('ovBtn').addEventListener('click', () => {
      this.hide();
      const f = this.action; this.action = null;
      if (f) f();
    });
    document.getElementById('ovBtn2').addEventListener('click', () => {
      this.hide();
      setTimeout(() => this.app.modes.journal.confirmNewDiary(), 320);
    });
    document.getElementById('ovBtn3').addEventListener('click', () => {
      this.hide();
      const f = this.action2; this.action2 = null;
      if (f) f();
    });
  }

  isOpen() {
    return this.isOpenFlag;
  }

  show(o) {
    this.isOpenFlag = true;
    const stars = document.getElementById('ovStars');
    if (stars) stars.style.display = 'none';
    const ovBtn2 = document.getElementById('ovBtn2');
    const ovBtn3 = document.getElementById('ovBtn3');
    ovBtn2.classList.remove('show');
    ovBtn3.classList.remove('show');

    const stats = document.getElementById('ovStats');
    if (o.stats) {
      stats.textContent = o.stats;
      stats.style.display = 'block';
    } else {
      stats.style.display = 'none';
    }

    if (o.extra) {
      ovBtn3.style.display = 'inline-flex';
      ovBtn3.classList.add('show');
      ovBtn3.textContent = o.extra.label;
      this.action2 = o.extra.fn;
    } else {
      this.action2 = null;
    }

    const ovTasks = document.getElementById('ovTasks');
    if (o.tasks && ovTasks) {
      ovTasks.style.display = 'flex';
      this.app.goal.updateProgress();
    } else if (ovTasks) {
      ovTasks.style.display = 'none';
    }

    const ovDiff = document.getElementById('ovDiff');
    const ovModes = document.getElementById('ovModes');
    ovDiff.innerHTML = '';
    ovModes.innerHTML = '';

    if (o.diff) {
      const diff = this.app.store.get('diff');
      ovDiff.innerHTML = '<div class="segcap">Сложность</div><div class="diffseg">' +
        [['walk', 'Прогулка'], ['norm', 'Норма'], ['hard', 'Вызов']].map(([v, l]) =>
          `<button data-v="${v}" class="${v === diff ? 'on' : ''}">${l}</button>`).join('') + '</div>';
      ovDiff.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        const newDiff = b.dataset.v;
        this.app.store.set('diff', newDiff);
        ovDiff.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        // Пересчёт cfg.moves + HUD + prevext через Game.setDifficulty.
        this._recomputeMovesForDiff(newDiff);
      }));
    }

    if (o.modes) {
      const done = this.app.storage.get('daily-' + dateNum(), '0') === '1';
      ovModes.innerHTML = '<div class="segcap">Режимы</div><div class="modeseg">' +
        `<button id="mJournal">Дневник</button><button id="mDaily">Пазл дня${done ? ' ✓' : ''}</button><button id="mZen">Дзен</button><button id="mTimed">На время</button></div>`;
      document.getElementById('mJournal').addEventListener('click', () => { this.hide(); this.app.setMode('journal'); });
      document.getElementById('mDaily').addEventListener('click', () => { this.hide(); this.app.setMode('daily'); });
      document.getElementById('mZen').addEventListener('click', () => { this.hide(); this.app.setMode('zen'); });
      document.getElementById('mTimed').addEventListener('click', () => { this.hide(); this.app.setMode('timed'); });
    }

    document.getElementById('ovTitle').textContent = o.title;
    document.getElementById('ovText').textContent = o.text;
    document.getElementById('ovBtn').textContent = o.btn;
    this.action = o.fn;

    if (o.stars && stars) {
      stars.textContent = '★'.repeat(o.stars) + '☆'.repeat(3 - o.stars);
      stars.style.display = 'block';
    }
    this.el.classList.add('show');
  }

  showBtn2() {
    document.getElementById('ovBtn2').classList.add('show');
  }

  hide() {
    this.isOpenFlag = false;
    if (this.el) this.el.classList.remove('show');
  }

  // Пересчёт cfg.moves, HUD и текста превью под выбранную сложность (до старта уровня).
  _recomputeMovesForDiff(diff) {
    const g = this.app.game;
    if (!g.levelCfg) return;
    g.setDifficulty(diff);
    // Обновить текст превью в overlay (там зашита строка «за N ходов»).
    const ovText = document.getElementById('ovText');
    if (ovText) ovText.textContent = this.app.goal.previewText();
  }
}

export default Overlay;
