// src/levels/daily.js
// Генератор пазла дня. Детерминированный по seed (дата в формате YYYYMMDD).
// Использует mulberry32 PRNG для воспроизводимости.

import { pickTargets } from './levelSpec.js';

export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function dateNum(d = new Date()) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function dailySpec(seed) {
  const rnd = mulberry32(seed);
  const pool = ['bouquet', 'order', 'dew', 'weeds', 'butterfly'];
  const type = pool[Math.floor(rnd() * pool.length)];
  const base = { type, theme: 'дневной', stones: [] };
  switch (type) {
    case 'bouquet': return Object.assign(base, { goal: 70 + Math.floor(rnd() * 30), moves: 26 });
    case 'order': return Object.assign(base, { targets: pickTargets(2, 13, 20, rnd), moves: 26 });
    case 'dew': return Object.assign(base, { dew: 10 + Math.floor(rnd() * 5), moves: 25 });
    case 'weeds': return Object.assign(base, { weedsInit: 6, weedsNeed: 14 + Math.floor(rnd() * 5), moves: 26 });
    case 'butterfly': return Object.assign(base, { bf: 2, moves: 25 });
  }
  return base;
}

export default dailySpec;
