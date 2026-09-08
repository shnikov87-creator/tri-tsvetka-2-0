// src/game/Cascade.js
// Оркестрирует многокаскадный цикл: findMatches → planFromGroups →
// expandSpecials → damageStones → collect → spawn → collapse → повтор.
// Визуальная часть (DOM, частицы, звук) выполняется через BoardView/app.

import { findMatches, isFlower } from './MatchFinder.js';
import {
  planFromGroups, expandSpecials, damageStones,
  tickBulbs, collectButterflies, wildClearMap, wildGardenClearMap,
} from './SpecialTiles.js';
import { planCollapse } from './Gravity.js';
import { N, WILD } from './data/seasons.js';

export class Cascade {
  constructor(app) {
    this.app = app;
    this.combo = 0;
    this.run = null; // Promise последнего запуска
  }

  // Главный метод: запускает цикл от initialClear (если есть) или с findMatches.
  // Возвращает Promise, который резолвится по завершении всех каскадов.
  // Вызывает колбэки для визуальной части.
  async start({ initialClear = null, swapCells = null, onWave = null, onCombo = null } = {}) {
    const my = ++this.app.epoch;
    this.combo = 0;
    let pending = initialClear;
    while (true) {
      let clearMap, creations = [];
      if (pending) {
        clearMap = pending;
        pending = null;
      } else {
        const groups = findMatches(this.app.board.grid);
        if (!groups.length) break;
        const plan = planFromGroups(groups, this.combo === 0 ? swapCells : null);
        clearMap = plan.clearMap;
        creations = plan.creations;
      }
      this.combo++;
      onCombo?.(this.combo);
      // Защитаем creations от очистки.
      const keep = new Set(creations.map((cr) => cr.r + ',' + cr.c));
      keep.forEach((k) => clearMap.delete(k));
      const { specialsHit, maxDepth } = expandSpecials(this.app.board.grid, clearMap, keep);
      const stonesHit = damageStones(this.app.board.grid, clearMap);
      await onWave?.({
        clearMap, creations, specialsHit, maxDepth, stonesHit, combo: this.combo,
      });
      if (my !== this.app.epoch) return false;
      // После волны: убираем DOM тайлы и спавним creations.
      await this.app.boardView.afterWave(clearMap, creations);
      if (my !== this.app.epoch) return false;
      // Collapse + спавн.
      const { ops, maxDist } = planCollapse(this.app.board.grid, this.app.spawner);
      await this.app.boardView.applyCollapse(ops, maxDist);
      if (my !== this.app.epoch) return false;
      await this.app.sleep(110);
      // Сбор бабочек.
      const bfCols = collectButterflies(this.app.board.grid);
      if (bfCols.length) {
        await this.app.boardView.collectButterflies(bfCols);
      }
    }
    return true;
  }

  // Wild-своп: wild + flower → очистка по типу/саду.
  async wildClear(otherType, wildType = WILD) {
    const grid = this.app.board.grid;
    const clearMap = otherType === WILD ? wildGardenClearMap(grid) : wildClearMap(grid, otherType);
    await this.start({ initialClear: clearMap, swapCells: null });
  }
}

export default Cascade;
