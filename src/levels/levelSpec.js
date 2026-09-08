// src/levels/levelSpec.js
// Процедурный генератор листов дневника.
// Чистая функция: по номеру листа возвращает конфиг (type, theme, goal, moves, ...).

const STONE_PATTERNS = [
  [[2, 2], [2, 5], [5, 2], [5, 5]],
  [[1, 3], [1, 4], [6, 3], [6, 4], [3, 1], [4, 1], [3, 6], [4, 6]],
  [[2, 2], [3, 3], [4, 4], [5, 5], [2, 5], [5, 2]],
  [[3, 2], [4, 2], [3, 5], [4, 5], [2, 3], [2, 4], [5, 3], [5, 4]],
];

const THEMES = ['луговой', 'полевой', 'садовый', 'медовый', 'травный', 'вечерний'];

const shuffle = (a, rnd = Math.random) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function pickTargets(k, base, cap, rnd = Math.random) {
  return shuffle([0, 1, 2, 3, 4, 5], rnd).slice(0, k)
    .map((i, j) => [i, Math.min(base + (j === 0 ? 0 : 3) + Math.floor(rnd() * 5), cap)]);
}

export function levelSpec(n) {
  const tier = Math.floor((n - 1) / 6), phase = (n - 1) % 6;
  const theme = THEMES[(n - 1) % 6];
  const stonesFor = (k) => (n < 4 ? [] : STONE_PATTERNS[(n + k) % STONE_PATTERNS.length]);
  switch (phase) {
    case 0: return { type: 'bouquet', theme, goal: 70 + 10 * tier, moves: 28, stones: stonesFor(0) };
    case 1: return { type: 'order', theme, targets: pickTargets(2, 13 + 3 * tier, 22), moves: 27, stones: stonesFor(1) };
    case 2: return { type: 'dew', theme, dew: 10 + 2 * Math.min(tier, 3), moves: 25, stones: stonesFor(2) };
    case 3: return { type: 'weeds', theme, weedsInit: 6 + tier, weedsNeed: 14 + 4 * tier, moves: 26, stones: [] };
    case 4: return { type: 'order', theme, targets: pickTargets(3, 11 + 2 * tier, 19), moves: 28, stones: stonesFor(3) };
    case 5: return { type: 'butterfly', theme, bf: 2 + Math.min(tier, 2), moves: 26, stones: tier > 0 ? stonesFor(4) : [] };
  }
  return { type: 'bouquet', theme, goal: 80, moves: 28, stones: [] };
}

export const TYPE_LABEL = {
  bouquet: 'Букет', order: 'Заказ', dew: 'Роса', weeds: 'Сорняки',
  butterfly: 'Бабочки', zen: 'Дзен', timed: 'На время',
};

export default levelSpec;
