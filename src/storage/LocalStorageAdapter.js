// src/storage/LocalStorageAdapter.js
// Безопасная обёртка над localStorage: никогда не бросает, поддерживает
// дефолтные значения и префиксную очистку. Используется всеми системами.

export class LocalStorageAdapter {
  constructor(prefix = 'flor3-') {
    this.prefix = prefix;
  }

  _key(k) {
    return this.prefix + k;
  }

  get(k, d = null) {
    try {
      const v = localStorage.getItem(this._key(k));
      return v === null ? d : v;
    } catch (e) {
      return d;
    }
  }

  set(k, v) {
    try {
      localStorage.setItem(this._key(k), v);
    } catch (e) {
      /* noop */
    }
  }

  del(k) {
    try {
      localStorage.removeItem(this._key(k));
    } catch (e) {
      /* noop */
    }
  }

  // Очистка всех ключей с текущим префиксом.
  clearAll() {
    try {
      const st = window.localStorage;
      if (!st) return;
      const kill = [];
      for (let i = 0; i < st.length; i++) {
        const key = st.key(i);
        if (key && key.indexOf(this.prefix) === 0) kill.push(key);
      }
      kill.forEach((key) => {
        try {
          st.removeItem(key);
        } catch (e) {
          /* noop */
        }
      });
    } catch (e) {
      /* noop */
    }
  }

  // Удобные типизированные акцессоры.
  getJSON(k, d = null) {
    try {
      const v = this.get(k, null);
      return v === null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  }

  setJSON(k, v) {
    this.set(k, JSON.stringify(v));
  }

  getInt(k, d = 0) {
    const v = parseInt(this.get(k, ''), 10);
    return Number.isFinite(v) ? v : d;
  }

  getFloat(k, d = 0) {
    const v = parseFloat(this.get(k, ''));
    return Number.isFinite(v) ? v : d;
  }

  getBool(k, d = false) {
    const v = this.get(k, null);
    if (v === null) return d;
    return v === '1' || v === 'true';
  }
}

export default LocalStorageAdapter;
