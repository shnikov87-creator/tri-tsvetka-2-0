// src/game/Spawner.js
// Генерация новых тайлов (случайные цвета, редкие луковицы).
// Также — первичная раздача поля с учётом камней и бабочек.

import { Tile } from './Tile.js';
import { N, TYPES, BF, BULB } from './data/seasons.js';

const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = (a, rnd = Math.random) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export class Spawner {
  constructor(season) {
    this.season = season;
    this.bulbChance = 0.045;
    this.maxBulbs = 3;
  }

  setSeason(s) {
    this.season = s;
  }

  // Случайный цвет (0..TYPES-1) без совпадений 3+ в строке/столбце с соседями.
  _randomColor(grid, r, c) {
    let t;
    do {
      t = Math.floor(Math.random() * TYPES);
    } while (
      (c >= 2 && grid[r][c - 1] && grid[r][c - 1].t === t && grid[r][c - 2] && grid[r][c - 2].t === t) ||
      (r >= 2 && grid[r - 1][c] && grid[r - 1][c].t === t && grid[r - 2][c] && grid[r - 2][c].t === t)
    );
    return t;
  }

  // Новый обычный тайл (или редкая луковица, если bulbs < maxBulbs).
  newTile(grid, r, c) {
    let bulbs = 0;
    if (grid) {
      for (const row of grid) for (const x of row) if (x && x.t === BULB) bulbs++;
    }
    if (bulbs < this.maxBulbs && Math.random() < this.bulbChance) {
      return new Tile(BULB, null);
    }
    return new Tile(this._randomColor(grid || this._blankGrid(), r, c), null);
  }

  _blankGrid() {
    return Array.from({ length: N }, () => Array(N).fill(null));
  }

  // Первичная раздача: stones + butterflies + обычные цветы.
  deal(levelCfg, grid, rnd = Math.random) {
    const stoneSet = new Set((levelCfg.stones || []).map(([r, c]) => r + ',' + c));
    const bfCols = levelCfg.bf ? shuffle([0, 1, 2, 3, 4, 5, 6, 7], rnd).slice(0, levelCfg.bf) : [];
    const bfSet = new Set(bfCols);
    const tiles = []; // массив {r, c, tile}
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        let cl;
        if (stoneSet.has(r + ',' + c)) {
          cl = new Tile(-2, null);
        } else if (r === 0 && bfSet.has(c)) {
          cl = new Tile(BF, null);
        } else {
          let t;
          do {
            t = Math.floor(rnd() * TYPES);
          } while (
            (c >= 2 && grid[r][c - 1] && grid[r][c - 1].t === t && grid[r][c - 2] && grid[r][c - 2].t === t) ||
            (r >= 2 && grid[r - 1][c] && grid[r - 1][c].t === t && grid[r - 2][c] && grid[r - 2][c].t === t)
          );
          cl = new Tile(t, null);
        }
        grid[r][c] = cl;
        tiles.push({ r, c, tile: cl });
      }
    }
    return tiles;
  }

  // Список свободных от камней/BF ячеек (для размещения росы/сорняков).
  freeForOverlays(grid) {
    const free = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cl = grid[r][c];
        if (!cl || (!cl.stone && cl.t !== BF)) free.push(r + ',' + c);
      }
    }
    return shuffle(free);
  }
}

export { shuffle, rand };
export default Spawner;
