// src/game/Gravity.js
// Сброс тайлов вниз с учётом камней (как пол). Спавн новых на пустые места.
// Анимации делаются через CSS-транзишен, тайминги — через BoardView.

import { N, BULB } from './data/seasons.js';
import { Tile } from './Tile.js';

const fallDur = (d) => Math.min(0.62, 0.2 + d * 0.05);

// Возвращает { maxDist, ops } — список операций (move / spawn) для BoardView.
export function planCollapse(grid, spawner) {
  const ops = [];
  let maxDist = 0;
  for (let c = 0; c < N; c++) {
    let r = 0;
    while (r < N) {
      if (grid[r][c] && grid[r][c].stone) {
        r++;
        continue;
      }
      let e = r;
      while (e < N && !(grid[e][c] && grid[e][c].stone)) e++;
      const segTop = r, segBot = e - 1;
      let write = segBot;
      // Двигаем существующие тайлы вниз.
      for (let rr = segBot; rr >= segTop; rr--) {
        const cl = grid[rr][c];
        if (cl) {
          if (write !== rr) {
            grid[write][c] = cl;
            grid[rr][c] = null;
            const d = write - rr;
            if (d > maxDist) maxDist = d;
            ops.push({ kind: 'move', from: { r: rr, c }, to: { r: write, c }, dur: fallDur(d) });
          }
          write--;
        }
      }
      // Спавним новые тайлы сверху на пустые позиции.
      const empt = write - segTop + 1;
      let bulbs = 0;
      grid.forEach((row) => row.forEach((x) => { if (x && x.t === BULB) bulbs++; }));
      for (let rr = segTop; rr <= write; rr++) {
        let cl;
        if (bulbs < 3 && Math.random() < 0.045) {
          cl = new Tile(BULB, null);
          bulbs++;
        } else {
          const t = Math.floor(Math.random() * 6);
          cl = new Tile(t, null);
        }
        grid[rr][c] = cl;
        if (segTop === 0) {
          if (empt + 0.6 > maxDist) maxDist = empt + 0.6;
          ops.push({ kind: 'spawn-top', tile: cl, to: { r: rr, c }, dur: fallDur(empt + 0.6) });
        } else {
          if (3.4 > maxDist) maxDist = 3.4;
          ops.push({ kind: 'spawn-mid', tile: cl, to: { r: rr, c } });
        }
      }
      r = e;
    }
  }
  return { maxDist, ops };
}

export { fallDur };
export default { planCollapse };
