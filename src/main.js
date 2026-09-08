// src/main.js
// Точка входа. Создаёт App, монтирует в DOM.
// Запускается только в браузере — Next.js импортирует его через useEffect.

import { App } from './app/App.js';

let _app = null;

export function startGame(rootEl) {
  if (_app) return _app;
  if (typeof window === 'undefined') return null;
  _app = new App();
  _app.mount();
  return _app;
}

export function getApp() {
  return _app;
}

export default startGame;
