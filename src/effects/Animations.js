// src/effects/Animations.js
// UI-анимации: фразы-подсказки по центру доски, всплывающий +gain, celebrate тайла.

export class Animations {
  constructor(app) {
    this.app = app;
    this.phraseLayer = null;
  }

  mount(phraseLayer) {
    this.phraseLayer = phraseLayer;
  }

  // Крупная фраза по центру доски (показ обучения / комбо).
  showPhrase(text, small = false) {
    if (!this.phraseLayer) return;
    this.phraseLayer.innerHTML = '';
    const d = document.createElement('div');
    d.className = 'phrase' + (small ? ' small' : '');
    d.textContent = text;
    this.phraseLayer.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }

  // Всплывающий «+N» над доской.
  showGain(cx, cy, text) {
    const g = this.app.game;
    if (!g.board || !g.board.el) return;
    const d = document.createElement('div');
    d.className = 'gain';
    d.textContent = text;
    d.style.left = cx + 'px';
    d.style.top = cy + 'px';
    g.board.el.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }

  // Пружинная «подпрыгивающая» анимация для созданных спецтайлов.
  celebrate(el) {
    const body = el.querySelector('.body');
    if (!body) return;
    body.animate(
      [{ transform: 'scale(1.45)' }, { transform: 'scale(1)' }],
      { duration: 340, easing: 'cubic-bezier(.2,1.5,.4,1)' },
    );
  }
}

export default Animations;
