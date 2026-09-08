// src/game/SpecialTiles.js
// Логика особых тайлов: расширение специальных (bud/line/wild),
// урон по камням, тик луковиц, сбор бабочек.

import { N, WILD, STONE, BULB, BF, TYPES } from './data/seasons.js';

// Расширяет clearMap за счёт активации bud (3×3 вокруг) и line (ряд+столбец).
// Возвращает { specialsHit, maxDepth }.
export function expandSpecials(grid, clearMap, keep) {
  const queue = [...clearMap.values()];
  let specialsHit = 0, maxDepth = 0;
  const push = (r, c, depth) => {
    if (r < 0 || c < 0 || r >= N || c >= N) return;
    const g = grid[r][c];
    if (!g || g.stone || g.t === BF || g.t === BULB) return;
    const k = r + ',' + c;
    if (clearMap.has(k) || keep.has(k)) return;
    clearMap.set(k, { r, c, depth });
    if (depth > maxDepth) maxDepth = depth;
    queue.push({ r, c, depth });
  };
  while (queue.length) {
    const n = queue.shift();
    const cl = grid[n.r][n.c];
    if (!cl) continue;
    if (cl.sp === 'bud') {
      specialsHit++;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) push(n.r + dr, n.c + dc, n.depth + 1);
    } else if (cl.sp === 'line') {
      specialsHit++;
      for (let k = 0; k < N; k++) {
        push(n.r, k, n.depth + 1);
        push(k, n.c, n.depth + 1);
      }
    }
  }
  return { specialsHit, maxDepth };
}

// Добавляет камни, соседствующие с clearMap, в clearMap (для разрушения).
export function damageStones(grid, clearMap) {
  let stonesHit = 0;
  const toAdd = [];
  clearMap.forEach(({ r, c, depth }) => {
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
      if (rr < 0 || cc < 0 || rr >= N || cc >= N) return;
      const cl = grid[rr][cc];
      if (cl && cl.stone) {
        const k = rr + ',' + cc;
        if (!clearMap.has(k)) toAdd.push([k, rr, cc, (depth || 0) + 1]);
      }
    });
  });
  toAdd.forEach(([k, rr, cc, d]) => {
    clearMap.set(k, { r: rr, c: cc, depth: d });
    stonesHit++;
  });
  return stonesHit;
}

// Из групп 3+ выбирает, какие тайлы станут bud/line/wild.
// Возвращает { clearMap, creations }.
export function planFromGroups(groups, swapCells = null) {
  const cellsMap = new Map();
  groups.forEach((g) => g.forEach(([r, c]) => {
    const k = r + ',' + c;
    if (!cellsMap.has(k)) cellsMap.set(k, { r, c, depth: 0 });
  }));
  const infos = groups.map((g) => ({ g, len: g.length }));
  const cellGroups = new Map();
  infos.forEach((inf, i) => inf.g.forEach(([r, c]) => {
    const k = r + ',' + c;
    if (!cellGroups.has(k)) cellGroups.set(k, []);
    cellGroups.get(k).push(i);
  }));
  const used = new Set(), creations = [];
  // L/T (пересечение двух групп) → line (соцветие)
  cellGroups.forEach((gi, k) => {
    if (gi.length >= 2) {
      const { r, c } = cellsMap.get(k);
      creations.push({ r, c, sp: 'line' });
      gi.forEach((i) => used.add(i));
    }
  });
  // 5+ в линию → wild
  infos.forEach((inf, i) => {
    if (used.has(i) || inf.len < 5) return;
    const m = inf.g[Math.floor(inf.len / 2)];
    creations.push({ r: m[0], c: m[1], sp: 'wild' });
    used.add(i);
  });
  // ровно 4 в линию → bud (бутон)
  infos.forEach((inf, i) => {
    if (used.has(i) || inf.len !== 4) return;
    let pos = inf.g[1];
    if (swapCells) {
      const hit = inf.g.find(([r, c]) => swapCells.some((s) => s.r === r && s.c === c));
      if (hit) pos = hit;
    }
    creations.push({ r: pos[0], c: pos[1], sp: 'bud' });
    used.add(i);
  });
  const uniq = new Map();
  creations.forEach((cr) => uniq.set(cr.r + ',' + cr.c, cr));
  return { clearMap: cellsMap, creations: [...uniq.values()] };
}

// Тик луковиц: уменьшает счётчик, прорастает при 0.
// Возвращает массив { r, c, newType } проросших луковиц.
export function tickBulbs(grid) {
  const grown = [];
  grid.forEach((row, r) => row.forEach((cl, c) => {
    if (cl && cl.t === BULB) {
      cl.bulb--;
      if (cl.bulb <= 0) {
        const t = Math.floor(Math.random() * TYPES);
        cl.t = t;
        grown.push({ r, c, newType: t });
      }
    }
  }));
  return grown;
}

// Сбор бабочек в нижнем ряду. Возвращает массив колонок c, где бабочка улетела.
export function collectButterflies(grid) {
  const cols = [];
  for (let c = 0; c < N; c++) {
    const cl = grid[N - 1][c];
    if (cl && cl.t === BF) {
      cols.push(c);
    }
  }
  return cols;
}

// Применяет wild-обмен: какие ячейки очистить.
export function wildClearMap(grid, otherType) {
  const map = new Map();
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cl = grid[r][c];
      if (cl && (cl.t === otherType || cl.t === WILD)) {
        map.set(r + ',' + c, { r, c, depth: 0 });
      }
    }
  }
  return map;
}

// «Дикий сад» — очистка всех цветов.
export function wildGardenClearMap(grid) {
  const map = new Map();
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cl = grid[r][c];
      if (cl && !cl.stone && cl.t !== BF) {
        map.set(r + ',' + c, { r, c, depth: 0 });
      }
    }
  }
  return map;
}

export default {
  expandSpecials, damageStones, planFromGroups,
  tickBulbs, collectButterflies, wildClearMap, wildGardenClearMap,
};
