// src/app/GameStore.js
// Единый реактивный стор настроек и мета-прогресса.
// Все значения автосохраняются в LocalStorageAdapter.
// При change — эмитит 'settings:changed' через EventBus.

import { EventBus } from './EventBus.js';

const DEFAULTS = {
  // Звук/музыка
  mute: false,
  music: true,
  vol: 0.8,
  ambStyle: 'birds',
  // Эффекты
  fx: 1,
  motion: false, // reduced motion
  // Игровые настройки
  season: 'summer',
  diff: 'norm',
  boardSize: 'large',
  theme: 'light',
  // Мета-прогресс
  boost: { can: 1, glove: 1, plus5: 0, undo: 1 },
  charge: 0,
  stats: { weeds: 0, dew: 0, bulbs: 0, bfs: 0, garden: 0, maxCombo: 0 },
  album: [],
  ach: {},
  progress: 1,
  stars: {}, // { levelNum: starCount }
  lastlogin: null,
  streak: 0,
  // Автосмена сезонов: на каком уровне последний раз меняли, и шаг до следующей смены.
  seasonLastLevel: 1,
  seasonNextStep: 6,
  // Рекорды по режимам
  best: 0,
  bestzen: 0,
  besttimed: 0,
};

// Карта: ключ store -> localStorage-ключ
const STORAGE_KEYS = {
  mute: 'mute',
  music: 'music',
  vol: 'vol',
  ambStyle: 'ambstyle',
  fx: 'fx',
  motion: 'motion',
  season: 'season',
  diff: 'diff',
  boardSize: 'boardsize',
  theme: 'theme',
  boost: 'boost',
  charge: 'charge',
  stats: 'stats',
  album: 'album',
  ach: 'ach',
  progress: 'progress',
  stars: 'stars',
  lastlogin: 'lastlogin',
  streak: 'streak',
  seasonLastLevel: 'seasonlastlevel',
  seasonNextStep: 'seasonnextstep',
  best: 'best',
  bestzen: 'bestzen',
  besttimed: 'besttimed',
};

// Параметры чтения для типизированных полей.
const READERS = {
  mute: 'bool',
  music: 'bool',
  vol: 'float',
  ambStyle: 'str',
  fx: 'float',
  motion: 'bool',
  season: 'str',
  diff: 'str',
  boardSize: 'str',
  theme: 'str',
  boost: 'json',
  charge: 'float',
  stats: 'json',
  album: 'json',
  ach: 'json',
  progress: 'int',
  stars: 'json',
  lastlogin: 'str',
  streak: 'int',
  seasonLastLevel: 'int',
  seasonNextStep: 'int',
  best: 'int',
  bestzen: 'int',
  besttimed: 'int',
};

export class GameStore {
  constructor(storage, bus) {
    this.storage = storage;
    this.bus = bus || new EventBus();
    this.state = { ...DEFAULTS };
    this._loadAll();
  }

  _loadAll() {
    for (const key of Object.keys(STORAGE_KEYS)) {
      this._load(key);
    }
  }

  _load(key) {
    const lsKey = STORAGE_KEYS[key];
    const reader = READERS[key];
    let v;
    if (reader === 'bool') v = this.storage.getBool(lsKey, DEFAULTS[key]);
    else if (reader === 'int') v = this.storage.getInt(lsKey, DEFAULTS[key]);
    else if (reader === 'float') v = this.storage.getFloat(lsKey, DEFAULTS[key]);
    else if (reader === 'json') v = this.storage.getJSON(lsKey, DEFAULTS[key]);
    else v = this.storage.get(lsKey, DEFAULTS[key]);
    // Валидация значений.
    if (key === 'vol') v = Math.min(1, Math.max(0, v));
    else if (key === 'fx') v = v > 0 && v <= 1 ? v : 1;
    else if (key === 'charge') v = Math.min(100, Math.max(0, v));
    else if (key === 'season' && !['summer', 'spring', 'autumn', 'winter'].includes(v)) v = 'summer';
    else if (key === 'diff' && !['walk', 'norm', 'hard'].includes(v)) v = 'norm';
    else if (key === 'boardSize' && !['compact', 'normal', 'large', 'max'].includes(v)) v = 'large';
    else if (key === 'ambStyle' && !['birds', 'brook', 'rain'].includes(v)) v = 'birds';
    else if (key === 'theme' && !['light', 'dark'].includes(v)) v = 'light';
    else if (key === 'boost') v = Object.assign({ ...DEFAULTS.boost }, v || {});
    else if (key === 'stats') v = Object.assign({ ...DEFAULTS.stats }, v || {});
    else if (key === 'progress') v = Math.max(1, v);
    this.state[key] = v;
  }

  _persist(key) {
    const lsKey = STORAGE_KEYS[key];
    const reader = READERS[key];
    const v = this.state[key];
    if (reader === 'bool') this.storage.set(lsKey, v ? '1' : '0');
    else if (reader === 'int') this.storage.set(lsKey, String(v));
    else if (reader === 'float') this.storage.set(lsKey, String(v));
    else if (reader === 'json') this.storage.setJSON(lsKey, v);
    else this.storage.set(lsKey, v);
  }

  // Получить значение.
  get(key) {
    return this.state[key];
  }

  // Установить значение и сохранить. Эмитит 'settings:changed' с patch.
  set(key, value) {
    if (this.state[key] === value) return;
    this.state[key] = value;
    this._persist(key);
    this.bus.emit('settings:changed', { [key]: value });
  }

  // Запатчить объектное поле (например boost, stats, ach, stars).
  patch(key, patch) {
    const cur = this.state[key];
    if (cur && typeof cur === 'object' && !Array.isArray(cur)) {
      this.state[key] = { ...cur, ...patch };
    } else {
      this.state[key] = patch;
    }
    this._persist(key);
    this.bus.emit('settings:changed', { [key]: this.state[key] });
  }

  // Атомарное приращение числового поля.
  inc(key, delta = 1) {
    this.state[key] = (this.state[key] || 0) + delta;
    this._persist(key);
    this.bus.emit('settings:changed', { [key]: this.state[key] });
  }

  // Сброс прогресса (рекордов/звёзд/прогресса), но не настроек.
  resetProgress() {
    const keep = [
      'mute', 'music', 'vol', 'ambStyle', 'fx', 'motion', 'season',
      'diff', 'boardSize', 'theme', 'boost', 'charge', 'stats', 'album', 'ach',
      'lastlogin', 'streak', 'seasonLastLevel', 'seasonNextStep',
      'best', 'bestzen', 'besttimed',
    ];
    for (const key of Object.keys(DEFAULTS)) {
      if (keep.includes(key)) continue;
      this.state[key] = DEFAULTS[key];
      this._persist(key);
    }
    this.bus.emit('settings:changed', { reset: true });
  }
}

export default GameStore;
