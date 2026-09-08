// src/ui/SettingsView.js
// Оверлей настроек: громкость, фоновые звуки, атмосфера, частицы,
// размер поля, меньше движения, тема (светлая/тёмная), сброс прогресса.
// Сезон гербария НЕ настраивается вручную — он меняется автосменой по ходу дневника.

export class SettingsView {
  constructor(app) {
    this.app = app;
    this.el = null;
    this.isOpenFlag = false;
    this.resetArmed = false;
    this.resetTO = null;
  }

  mount(el) {
    this.el = el;
    document.getElementById('setClose').addEventListener('click', () => this.close());
    document.getElementById('setMute').addEventListener('click', () => this._toggleMute());
    document.getElementById('setVol').addEventListener('input', (e) => {
      const vol = e.target.value / 100;
      this.app.store.set('vol', vol);
      this.app.sound.setVolume(vol);
    });
    document.getElementById('setMusic').addEventListener('click', () => this._toggleMusic());
    document.querySelectorAll('#setAmb button').forEach((b) => b.addEventListener('click', () => {
      this.app.music.switchAmb(b.dataset.v);
      document.querySelectorAll('#setAmb button').forEach((x) => x.classList.toggle('on', x === b));
    }));
    document.querySelectorAll('#setFx button').forEach((b) => b.addEventListener('click', () => {
      const fxMul = parseFloat(b.dataset.v);
      this.app.store.set('fx', fxMul);
      document.querySelectorAll('#setFx button').forEach((x) => x.classList.toggle('on', x === b));
      this.app.weather.switchSeason();
    }));
    document.querySelectorAll('#setSize button').forEach((b) => b.addEventListener('click', () => {
      this.app.store.set('boardSize', b.dataset.v);
      document.querySelectorAll('#setSize button').forEach((x) => x.classList.toggle('on', x === b));
      this._applyBoardSize();
    }));
    document.querySelectorAll('#setTheme button').forEach((b) => b.addEventListener('click', () => {
      this.app.store.set('theme', b.dataset.v);
      document.querySelectorAll('#setTheme button').forEach((x) => x.classList.toggle('on', x === b));
      this._applyTheme();
    }));
    // Сезон (тест) — временная мера для проверки цветов
    document.querySelectorAll('#setSeason button').forEach((b) => b.addEventListener('click', () => {
      this.app.store.set('season', b.dataset.v);
      document.querySelectorAll('#setSeason button').forEach((x) => x.classList.toggle('on', x === b));
      this._applySeason();
    }));
    document.getElementById('setMotion').addEventListener('click', (e) => this._toggleMotion(e.target));
    document.getElementById('setReset').addEventListener('click', () => this._handleReset());
  }

  isOpen() {
    return this.isOpenFlag;
  }

  open() {
    this.isOpenFlag = true;
    document.getElementById('setVol').value = Math.round(this.app.store.get('vol') * 100);
    const mu = document.getElementById('setMute');
    const mute = this.app.store.get('mute');
    mu.classList.toggle('on', !mute);
    mu.textContent = mute ? 'выключены' : 'включены';
    const m = document.getElementById('setMusic');
    const music = this.app.store.get('music');
    m.classList.toggle('on', music);
    m.textContent = music ? 'включены' : 'выключены';
    document.querySelectorAll('#setAmb button').forEach((b) => b.classList.toggle('on', b.dataset.v === this.app.store.get('ambStyle')));
    document.querySelectorAll('#setFx button').forEach((b) => b.classList.toggle('on', parseFloat(b.dataset.v) === this.app.store.get('fx')));
    document.querySelectorAll('#setSize button').forEach((b) => b.classList.toggle('on', b.dataset.v === this.app.store.get('boardSize')));
    document.querySelectorAll('#setTheme button').forEach((b) => b.classList.toggle('on', b.dataset.v === this.app.store.get('theme')));
    document.querySelectorAll('#setSeason button').forEach((b) => b.classList.toggle('on', b.dataset.v === this.app.store.get('season')));
    const mo = document.getElementById('setMotion');
    const motion = this.app.store.get('motion');
    mo.classList.toggle('on', motion);
    mo.textContent = motion ? 'вкл' : 'выкл';
    this.resetArmed = false;
    const resetBtn = document.getElementById('setReset');
    resetBtn.textContent = 'Сбросить прогресс';
    resetBtn.classList.remove('warn');
    this.el.classList.add('show');
  }

  close() {
    this.isOpenFlag = false;
    this.el.classList.remove('show');
  }

  _toggleMusic() {
    const on = !this.app.store.get('music');
    this.app.music.setMusicPref(on);
    const tgl = document.getElementById('setMusic');
    tgl.classList.toggle('on', on);
    tgl.textContent = on ? 'включены' : 'выключены';
    const ic = document.getElementById('btnMusicTgl');
    if (ic) ic.classList.toggle('off', !on);
  }

  _toggleMute() {
    const mute = !this.app.store.get('mute');
    this.app.store.set('mute', mute);
    const tgl = document.getElementById('setMute');
    tgl.classList.toggle('on', !mute);
    tgl.textContent = mute ? 'выключены' : 'включены';
    // Синхронизируем скрытую кнопку btnSound (если она используется где-то в коде).
    const bs = document.getElementById('btnSound');
    if (bs) bs.classList.toggle('muted', mute);
    if (mute) this.app.music.stop();
    else if (this.app.store.get('music')) this.app.music.start();
  }

  _toggleMotion(el) {
    const motion = !this.app.store.get('motion');
    this.app.store.set('motion', motion);
    document.body.classList.toggle('reduced', motion);
    el.classList.toggle('on', motion);
    el.textContent = motion ? 'вкл' : 'выкл';
  }

  _applyBoardSize() {
    this.app.game.computeCell();
    if (this.app.game.board && this.app.game.board.grid.length) {
      this.app.game.board.reflowLayout(() => this.app.ui.board.reflowOverlays());
    }
    this.app.banner('Размер поля обновлён');
  }

  _applyTheme() {
    const theme = this.app.store.get('theme');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    const names = { light: 'Светлая тема', dark: 'Тёмная тема' };
    this.app.banner(names[theme]);
  }

  // Сезон (тест) — меняет сезон вручную для проверки цветов.
  _applySeason() {
    const season = this.app.store.get('season');
    this.app.hud.applySeasonUI();
    if (this.app.game.board && this.app.game.board.grid.length) {
      this.app.game.setSeason(season);
    }
    this.app.weather.switchSeason();
    const names = { summer: 'Лето', spring: 'Весна', autumn: 'Осень', winter: 'Зима' };
    this.app.banner('Сезон: ' + names[season] + ' (тест)');
  }

  _handleReset() {
    const resetBtn = document.getElementById('setReset');
    if (!this.resetArmed) {
      this.resetArmed = true;
      resetBtn.textContent = 'Точно сбросить всё?';
      resetBtn.classList.add('warn');
      this.resetTO = setTimeout(() => {
        this.resetArmed = false;
        resetBtn.textContent = 'Сбросить прогресс';
        resetBtn.classList.remove('warn');
      }, 4000);
    } else {
      clearTimeout(this.resetTO);
      this.app.storage.clearAll();
      try {
        location.reload();
      } catch (e) { /* noop */ }
    }
  }
}

export default SettingsView;
