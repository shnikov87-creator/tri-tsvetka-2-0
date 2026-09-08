// src/ui/MapView.js
// Оверлей карты сада: сетка уровней с разблокировкой и звёздами.

export class MapView {
  constructor(app) {
    this.app = app;
    this.el = null;
  }

  mount(el, closeBtn) {
    this.el = el;
    closeBtn.addEventListener('click', () => el.classList.remove('show'));
  }

  open() {
    const g = this.app.game;
    const maxShow = Math.min(72, Math.max(this.app.levels.progress + 3, 12));
    let html = '';
    for (let lv = 1; lv <= maxShow; lv++) {
      const unlocked = lv <= this.app.levels.progress;
      const st = this.app.levels.getStars(lv) || 0;
      html += `<button class="lvChip${lv === g.level && g.mode === 'journal' ? ' cur' : ''}${unlocked ? '' : ' lock'}" data-lv="${lv}" ${unlocked ? '' : 'disabled'}><b>${lv}</b><span class="st">${unlocked ? ('★'.repeat(st) + '☆'.repeat(3 - st)) : '· · ·'}</span></button>`;
    }
    const grid = document.getElementById('mapGrid');
    grid.innerHTML = html;
    grid.querySelectorAll('button[data-lv]').forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('lock')) return;
      this.el.classList.remove('show');
      g.level = +b.dataset.lv;
      g.levelStartScore = 0;
      this.app.modes.journal.setupLevel();
    }));
    this.el.classList.add('show');
  }
}

export default MapView;
