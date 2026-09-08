// src/game/Tile.js
// Сущность тайла: тип, спец-состояние, DOM-элемент.
// Tile не знает о Board — только про свою ячейку и DOM-отображение.

import { WILD, STONE, BULB, BF, SEASONS, seasonSym } from './data/seasons.js';

export class Tile {
  // type — число (0..TYPES-1 для цветов, WILD/STONE/BULB/BF для особых)
  // special — null | 'bud' | 'line' (для созданных совпадением тайлов)
  constructor(type, special = null) {
    this.t = type;
    this.sp = special;
    this.stone = type === STONE;
    this.bulb = type === BULB ? 3 : 0; // обратный отсчёт для луковицы
    this.el = null; // DOM-узел
  }

  isFlower() {
    return !this.stone && this.t !== BF;
  }

  isSpecial() {
    return !!this.sp;
  }

  // Возвращает имя SVG-символа для текущего типа.
  sym(season) {
    return seasonSym(season, this.t);
  }

  // Внутренний HTML тела тайла.
  bodyHTML() {
    const useDeco = this.sp === 'bud'
      ? '<use class="deco" href="#deco-bud" width="100" height="100"/>'
      : this.sp === 'line'
        ? '<use class="deco" href="#deco-ring" width="100" height="100"/>'
        : '';
    const bn = this.t === BULB ? `<b class="bn">${this.bulb}</b>` : '';
    // Декорация рисуется ПОСЛЕ цветка (поверх), иначе цветок перекрывает её.
    return `<svg viewBox="0 0 100 100"><use href="#${this.sym(this._season())}" width="100" height="100"/>${useDeco}</svg>${bn}`;
  }

  // Создаёт DOM-элемент тайла.
  createElement(season) {
    const el = document.createElement('div');
    el.className = 'tile';
    if (this.t === WILD) el.classList.add('wild');
    if (this.sp === 'bud' || this.sp === 'line') el.classList.add('sp-' + this.sp);
    if (this.stone) {
      el.classList.add('stone');
      el.innerHTML = '<div class="body"><svg viewBox="0 0 100 100"><use href="#g-stone" width="100" height="100"/></svg></div>';
    } else {
      this._curSeason = season;
      el.innerHTML = `<div class="body">${this.bodyHTML()}</div>`;
    }
    this.el = el;
    return el;
  }

  // Перерисовывает внутренности тайла (после смены сезона/типа/спец-состояния).
  paint(season) {
    if (!this.el) return;
    this._curSeason = season;
    this.el.classList.toggle('wild', this.t === WILD);
    this.el.classList.remove('sp-bud', 'sp-line');
    if (this.sp === 'bud' || this.sp === 'line') this.el.classList.add('sp-' + this.sp);
    const body = this.el.querySelector('.body');
    if (body) body.innerHTML = this.bodyHTML();
  }

  _season() {
    return this._curSeason || 'summer';
  }
}

export default Tile;

