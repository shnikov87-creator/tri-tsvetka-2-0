// src/systems/AchievementSystem.js
// Достижения. Хранит список и состояние (открыто/нет) в GameStore.

const ACH = [
  { id: 'first', n: 'Первый букет', d: 'Пройдите первый лист дневника' },
  { id: 'cascade4', n: 'Каскадёр', d: 'Каскад ×4 за один ход' },
  { id: 'cascade5', n: 'Магистр каскадов', d: 'Каскад ×5 и выше' },
  { id: 'special', n: 'Селекционер', d: 'Вырастите особый цветок' },
  { id: 'garden', n: 'Дикий сад', d: 'Соедините два диких цветка' },
  { id: 'weeds30', n: 'Прополщик', d: 'Вырвите 30 сорняков (суммарно)' },
  { id: 'dew30', n: 'Росинка', d: 'Стряхните 30 капель росы (суммарно)' },
  { id: 'bulbs10', n: 'Луковичный барон', d: 'Дождитесь 10 прорастаний луковиц' },
  { id: 'bf10', n: 'Бабочеколов', d: 'Доставьте в вазу 10 бабочек' },
  { id: 'stars3', n: 'Три звезды', d: 'Получите 3 звезды на любом листе' },
  { id: 'ten', n: 'Опытный садовник', d: 'Пройдите 10 разных листов' },
  { id: 'daily', n: 'Дневная смена', d: 'Решите пазл дня' },
  { id: 'streak7', n: 'Верность саду', d: 'Заходите в сад 7 дней подряд' },
];

export class AchievementSystem {
  constructor(app) {
    this.app = app;
    this.list = ACH;
  }

  unlocked(id) {
    return !!this.app.store.get('ach')[id];
  }

  unlock(id) {
    const ach = { ...this.app.store.get('ach') };
    if (ach[id]) return;
    ach[id] = Date.now();
    this.app.store.set('ach', ach);
    const a = ACH.find((x) => x.id === id);
    this.app.banner('Достижение: ' + a.n);
    this.app.sound.tone(784, { dur: 0.2, g: 0.03 });
    this.app.sound.tone(1046.5, { t: 0.1, dur: 0.3, g: 0.026 });
  }

  // Проверить все условия по stats/starsMap.
  checkAll() {
    const stats = this.app.store.get('stats');
    const stars = this.app.store.get('stars');
    if (stats.maxCombo >= 4) this.unlock('cascade4');
    if (stats.maxCombo >= 5) this.unlock('cascade5');
    if (stats.weeds >= 30) this.unlock('weeds30');
    if (stats.dew >= 30) this.unlock('dew30');
    if (stats.bulbs >= 10) this.unlock('bulbs10');
    if (stats.bfs >= 10) this.unlock('bf10');
    if (Object.values(stars).some((s) => s >= 3)) this.unlock('stars3');
    if (Object.keys(stars).length >= 10) this.unlock('ten');
  }

  renderInto(el) {
    const ach = this.app.store.get('ach');
    el.innerHTML = ACH.map((a) => {
      const got = !!ach[a.id];
      return `<div class="row${got ? '' : ' off'}"><span><b>${a.n}</b> · ${a.d}</span><span>${got ? '✓' : '—'}</span></div>`;
    }).join('');
  }
}

export default AchievementSystem;
