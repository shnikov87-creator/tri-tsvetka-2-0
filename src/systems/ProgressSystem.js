// src/systems/ProgressSystem.js
// Логика ежедневного входа, стрика и альбома букетов. Сохраняет в GameStore.

import { dateNum } from '../levels/daily.js';

export class ProgressSystem {
  constructor(app) {
    this.app = app;
  }

  // Обработка ежедневного входа: инкремент стрика, подарок-бустер.
  dailyLogin() {
    const tk = String(dateNum());
    const last = this.app.storage.get('lastlogin', null);
    if (last === tk) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    let streak = this.app.store.get('streak') || 0;
    streak = last === String(dateNum(y)) ? streak + 1 : 1;
    this.app.storage.set('lastlogin', tk);
    this.app.store.set('streak', streak);
    const gift = this.app.boosters.awardRandom();
    setTimeout(() => this.app.banner(`День ${streak} в саду · подарок: ${gift}`), 1400);
    if (streak >= 7) this.app.achievements.unlock('streak7');
  }

  // === Альбом букетов ===

  add(entry) {
    const album = [entry, ...this.app.store.get('album')].slice(0, 40);
    this.app.store.set('album', album);
  }

  list() {
    return this.app.store.get('album') || [];
  }

  renderInto(el) {
    const fmt = (n) => n.toLocaleString('ru-RU');
    const album = this.list();
    el.innerHTML = album.length
      ? album.map((a) =>
        `<div class="row"><span><b>Лист ${a.lv}</b> · ${a.type}</span><span class="st">${'★'.repeat(a.stars)}${'☆'.repeat(3 - a.stars)}</span></div><div class="row"><span>${a.comp || '—'}</span><span>${fmt(a.score)} · ${a.date}</span></div>`,
      ).join('')
      : '<div class="row">Пока пусто — пройдите первый лист, и открытка появится здесь.</div>';
  }
}

export default ProgressSystem;
