// src/app/EventBus.js
// Минимальная шина событий: on / off / once / emit. Без зависимостей.
// Используется модулями для слабосвязанных уведомлений:
//  - 'app:ready'
//  - 'mode:changed' (name)
//  - 'score:changed' (v)
//  - 'progress:changed' (frac, label, txt)
//  - 'level:won' (st)
//  - 'level:lost'
//  - 'achievement:unlocked' (id)
//  - 'settings:changed' (patch)
//  - 'board:swap' (a, b)
//  - 'tile:removed' (r, c)
//  - 'phrase' (text, small)
//  - 'banner' (text)

export class EventBus {
  constructor() {
    this._h = new Map();
  }

  on(event, handler) {
    if (!this._h.has(event)) this._h.set(event, new Set());
    this._h.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this._h.get(event);
    if (set) set.delete(handler);
  }

  once(event, handler) {
    const wrap = (...args) => {
      this.off(event, wrap);
      handler(...args);
    };
    return this.on(event, wrap);
  }

  emit(event, ...args) {
    const set = this._h.get(event);
    if (!set) return;
    // Копируем, чтобы хендлеры могли отписаться во время emit.
    [...set].forEach((h) => {
      try {
        h(...args);
      } catch (e) {
        // Не роняем шину из-за одного обработчика.
        console.error('[EventBus]', event, e);
      }
    });
  }

  clear() {
    this._h.clear();
  }
}

export default EventBus;
