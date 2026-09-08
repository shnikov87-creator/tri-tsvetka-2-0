// src/game/SeasonsManager.js
// Автосмена сезонов гербария по мере прохождения листов дневника.
// Каждые 5-6 листов (рандомный шаг) сезон меняется по циклу:
// summer → autumn → winter → spring → summer → ...
// Сезон не выбирается вручную в настройках — только автосмена.
// Состояние (последний уровень смены, шаг до следующей) хранится в GameStore —
// переживает перезагрузку страницы.

import { SEASON_ORDER } from './data/seasons.js';

const SEASON_NAMES = {
  summer: 'Летний', spring: 'Весенний', autumn: 'Осенний', winter: 'Зимний',
};
const STEP_MIN = 5;
const STEP_MAX = 6;

export class SeasonsManager {
  constructor(app) {
    this.app = app;
  }

  _rollStep() {
    return STEP_MIN + Math.floor(Math.random() * (STEP_MAX - STEP_MIN + 1));
  }

  // Сбросить при новом дневнике.
  reset() {
    this.app.store.set('seasonLastLevel', 1);
    this.app.store.set('seasonNextStep', this._rollStep());
  }

  // Применить сезон для текущего уровня. Если достигли порога — сменить.
  // Вызывается в JournalMode.setupLevel после установки g.level.
  applyForLevel(level, opts = {}) {
    if (level <= 1) {
      // Первый лист — стартуем с лета.
      this.app.store.set('season', 'summer');
      this.app.store.set('seasonLastLevel', 1);
      this.app.store.set('seasonNextStep', this._rollStep());
      this._notifySeasonChanged(opts);
      return;
    }
    const lastChange = this.app.store.get('seasonLastLevel');
    const nextStep = this.app.store.get('seasonNextStep');
    const diff = level - lastChange;
    if (diff >= nextStep) {
      // Сменить сезон на следующий по циклу.
      const cur = this.app.store.get('season');
      const idx = SEASON_ORDER.indexOf(cur);
      const next = SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
      this.app.store.set('season', next);
      this.app.store.set('seasonLastLevel', level);
      this.app.store.set('seasonNextStep', this._rollStep());
      this._notifySeasonChanged(opts);
    }
  }

  _notifySeasonChanged(opts) {
    const season = this.app.store.get('season');
    // Перерисовать тайлы доски под новый сезон.
    if (this.app.game.board && this.app.game.board.grid.length) {
      this.app.game.setSeason(season);
    }
    // Перезапустить погоду под новый сезон.
    this.app.weather.switchSeason();
    // HUD.applySeasonUI вызовется автоматически через подписку на store:changed.
    if (opts.silent) return;
    this.app.banner('Сезон сменился: ' + SEASON_NAMES[season]);
  }

  static get SEASON_NAMES() {
    return SEASON_NAMES;
  }
}

export default SeasonsManager;
