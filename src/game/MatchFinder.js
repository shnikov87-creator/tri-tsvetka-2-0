// src/game/MatchFinder.js
// Чистые функции поиска совпадений. Не трогает DOM.
// Возвращает массивы координат групп из 3+ одинаковых тайлов.

import { N, WILD, STONE, BF, BULB } from './data/seasons.js';

// Найти все группы 3+ в строках и столбцах. groups: массив массивов [r,c].
export function findMatches(grid) {
  const groups = [];
  for (let r = 0; r < N; r++) {
    let c = 0;
    while (c < N) {
      const t = grid[r][c] ? grid[r][c].t : null;
      if (t === null || t < 0) {
        c++;
        continue;
      }
      let e = c + 1;
      while (e < N && grid[r][e] && grid[r][e].t === t) e++;
      if (e - c >= 3) {
        const g = [];
        for (let k = c; k < e; k++) g.push([r, k]);
        groups.push(g);
      }
      c = e;
    }
  }
  for (let c = 0; c < N; c++) {
    let r = 0;
    while (r < N) {
      const t = grid[r][c] ? grid[r][c].t : null;
      if (t === null || t < 0) {
        r++;
        continue;
      }
      let e = r + 1;
      while (e < N && grid[e][c] && grid[e][c].t === t) e++;
      if (e - r >= 3) {
        const g = [];
        for (let k = r; k < e; k++) g.push([k, c]);
        groups.push(g);
      }
      r = e;
    }
  }
  return groups;
}

// Проверяет, есть ли совпадение в конкретной ячейке.
export function matchAt(grid, r, c) {
  const cl = grid[r][c];
  if (!cl || cl.t < 0) return false;
  const t = cl.t;
  let h = 1, v = 1;
  for (let k = c - 1; k >= 0 && grid[r][k] && grid[r][k].t === t; k--) h++;
  for (let k = c + 1; k < N && grid[r][k] && grid[r][k].t === t; k++) h++;
  for (let k = r - 1; k >= 0 && grid[k][c] && grid[k][c].t === t; k--) v++;
  for (let k = r + 1; k < N && grid[k][c] && grid[k][c].t === t; k++) v++;
  return h >= 3 || v >= 3;
}

// Эмулирует обмен (r1,c1)<->(r2,c2) и проверяет, возникнет ли совпадение.
export function matchAfterSwap(grid, r1, c1, r2, c2) {
  const A = grid[r1][c1], B = grid[r2][c2];
  if (!A || !B || A.stone || B.stone || A.t === BF || B.t === BF) return false;
  const tA = A.t, tB = B.t;
  A.t = tB; B.t = tA;
  const ok = matchAt(grid, r1, c1) || matchAt(grid, r2, c2);
  A.t = tA; B.t = tB;
  return ok;
}

// Ищет подсказку: пару ячеек для обмена, который создаст совпадение.
// Возвращает [{r,c},{r,c}] или null.
export function findHint(grid) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cl = grid[r][c];
      if (cl && cl.t === WILD) {
        const nb = [[r, c + 1], [r + 1, c], [r, c - 1], [r - 1, c]].find(
          ([rr, cc]) => rr >= 0 && cc >= 0 && rr < N && cc < N && grid[rr][cc] && !grid[rr][cc].stone && grid[rr][cc].t !== BF,
        );
        if (nb) return [{ r, c }, { r: nb[0], c: nb[1] }];
      }
    }
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (c < N - 1 && matchAfterSwap(grid, r, c, r, c + 1)) return [{ r, c }, { r, c: c + 1 }];
      if (r < N - 1 && matchAfterSwap(grid, r, c, r + 1, c)) return [{ r, c }, { r: r + 1, c }];
    }
  }
  return null;
}

// Проверяет, является ли ячейка «цветком» (можно убирать сборами).
export function isFlower(cl) {
  return cl && !cl.stone && cl.t !== BF;
}

// Проверяет, что в сетке нет совпадений (для процедурной генерации).
export function hasAnyMatch(grid) {
  return findMatches(grid).length > 0;
}

export default { findMatches, matchAt, matchAfterSwap, findHint, isFlower, hasAnyMatch };
