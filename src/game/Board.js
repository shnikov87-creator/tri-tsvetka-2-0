// src/game/Board.js
// Хранит сетку N×N тайлов и DOM-элементы слотов/тайлов.
// Управляет операциями: place, swap, remove, setTile.

import { N, STONE } from './data/seasons.js';

export class Board {
  constructor(el) {
    this.el = el; // корневой div#board
    this.grid = []; // grid[r][c] = Tile | null
    this.cell = 56;
    this.slots = []; // массив slot-элементов
    this._initGrid();
  }

  _initGrid() {
    this.grid = Array.from({ length: N }, () => Array(N).fill(null));
  }

  // Создаёт фоновые слоты (шахматный паттерн).
  buildSlots() {
    const frag = document.createDocumentFragment();
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const s = document.createElement('div');
        s.className = 'slot ' + ((r + c) % 2 ? 'b' : 'a');
        s.style.transform = `translate(${c * this.cell}px, ${r * this.cell}px)`;
        frag.appendChild(s);
      }
    }
    this.el.appendChild(frag);
  }

  // Установить размер ячейки (px) и обновить layout всех тайлов/слотов.
  setCell(cell) {
    this.cell = cell;
  }

  reflowLayout(moveOverlays = null) {
    this.el.querySelectorAll('.slot').forEach((s) => s.remove());
    this.buildSlots();
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (this.grid[r][c]) this.place(this.grid[r][c].el, r, c, 0);
      }
    }
    if (moveOverlays) moveOverlays();
  }

  // Установка DOM-тайла в координаты с анимацией.
  place(el, r, c, dur = 0.22) {
    el.style.transitionDuration = dur + 's';
    el.style.transform = `translate(${c * this.cell}px, ${r * this.cell}px)`;
  }

  // Обмен тайлов (логически и визуально).
  swap(a, b) {
    const A = this.grid[a.r][a.c], B = this.grid[b.r][b.c];
    this.grid[a.r][a.c] = B;
    this.grid[b.r][b.c] = A;
    this.place(A.el, b.r, b.c, 0.2);
    this.place(B.el, a.r, a.c, 0.2);
  }

  get(r, c) {
    return this.grid[r] && this.grid[r][c];
  }

  set(r, c, tile) {
    this.grid[r][c] = tile;
  }

  remove(r, c) {
    const cl = this.grid[r][c];
    if (cl && cl.el) cl.el.remove();
    this.grid[r][c] = null;
  }

  clear() {
    this.el.innerHTML = '';
    this._initGrid();
  }

  // Итератор по всем тайлам.
  forEach(cb) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (this.grid[r][c]) cb(this.grid[r][c], r, c);
      }
    }
  }

  // Список всех свободных ячеек (не камень, не бабочка).
  freeCells() {
    const out = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cl = this.grid[r][c];
        if (!cl || (!cl.stone && cl.t !== -4)) out.push([r, c]);
      }
    }
    return out;
  }

  countType(t) {
    let n = 0;
    this.forEach((cl) => {
      if (cl && cl.t === t) n++;
    });
    return n;
  }
}

export default Board;
