// src/levels/LevelManager.js
// Управляет прогрессом по листам и звёздами. Хранит в GameStore.

import { levelSpec } from './levelSpec.js';
import { applyDifficulty } from './difficulty.js';

const ORD = ['первый', 'второй', 'третий', 'четвёртый', 'пятый', 'шестой',
  'седьмой', 'восьмой', 'девятый', 'десятый', 'одиннадцатый', 'двенадцатый'];
const THEMES = ['луговой', 'полевой', 'садовый', 'медовый', 'травный', 'вечерний'];

export class LevelManager {
  constructor(app) {
    this.app = app;
  }

  get progress() {
    return this.app.store.get('progress');
  }

  setProgress(p) {
    this.app.store.set('progress', Math.max(1, p));
  }

  getStars(level) {
    return this.app.store.get('stars')[level] || 0;
  }

  setStars(level, count) {
    const stars = { ...this.app.store.get('stars') };
    if ((stars[level] || 0) < count) {
      stars[level] = count;
      this.app.store.set('stars', stars);
    }
  }

  // Базовый порог очков для звёзд.
  starBase(level) {
    return 1200 + 300 * Math.floor((level - 1) / 6);
  }

  // Считает звёзды по очкам.
  countStars(level, score) {
    const base = this.starBase(level);
    if (score >= base * 1.55) return 3;
    if (score >= base) return 2;
    return 1;
  }

  // Возвращает конфиг уровня с применённой сложностью.
  configFor(level) {
    const raw = levelSpec(level);
    const diff = this.app.store.get('diff');
    return applyDifficulty(raw, diff);
  }

  // Чистый levelSpec (без применения сложности).
  levelSpec(level) {
    return levelSpec(level);
  }

  // Применить сложность к любому конфигу.
  applyDifficultyTo(cfg, diff) {
    return applyDifficulty(cfg, diff);
  }

  header(level, mode) {
    if (mode === 'zen') return 'дзен · свободный сбор';
    if (mode === 'timed') return 'на время · 120 секунд';
    if (mode === 'daily') return 'пазл дня';
    const theme = THEMES[(level - 1) % 6];
    const st = this.getStars(level) || 0;
    return `лист ${ORD[level - 1] || level} · ${theme}` + (st ? ' ' + '★'.repeat(st) + '☆'.repeat(3 - st) : '');
  }
}

export default LevelManager;
