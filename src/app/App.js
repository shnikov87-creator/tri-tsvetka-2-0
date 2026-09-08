// src/app/App.js
// Центральный координатор: создаёт и связывает все подсистемы.
// Хранит ссылки на них, обеспечивает API, который используют модули.

import { EventBus } from './EventBus.js';
import { GameStore } from './GameStore.js';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter.js';

import { Sound } from '../audio/Sound.js';
import { Music } from '../audio/Music.js';

import { Weather } from '../effects/Weather.js';
import { Particles } from '../effects/Particles.js';
import { Animations } from '../effects/Animations.js';

import { Game } from '../game/Game.js';
import { SeasonsManager } from '../game/SeasonsManager.js';

import { LevelManager } from '../levels/LevelManager.js';
import { JournalMode } from '../modes/JournalMode.js';
import { DailyMode } from '../modes/DailyMode.js';
import { ZenMode } from '../modes/ZenMode.js';
import { TimedMode } from '../modes/TimedMode.js';

import { ScoreSystem } from '../systems/ScoreSystem.js';
import { GoalSystem } from '../systems/GoalSystem.js';
import { BoosterSystem } from '../systems/BoosterSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { ProgressSystem } from '../systems/ProgressSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';

import { BoardView } from '../ui/BoardView.js';
import { HUD } from '../ui/HUD.js';
import { Overlay } from '../ui/Overlay.js';
import { MapView } from '../ui/MapView.js';
import { AlbumView } from '../ui/AlbumView.js';
import { AchievementView } from '../ui/AchievementView.js';
import { SettingsView } from '../ui/SettingsView.js';

export class App {
  constructor() {
    // Foundation.
    this.bus = new EventBus();
    this.storage = new LocalStorageAdapter('flor3-');
    this.store = new GameStore(this.storage, this.bus);

    // Reduced motion flag on body.
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('reduced', this.store.get('motion'));
      document.body.classList.toggle('theme-dark', this.store.get('theme') === 'dark');
    }

    // Audio.
    this.sound = new Sound(this);
    this.music = new Music(this);

    // Effects.
    this.weather = new Weather(this);
    this.particles = new Particles(this);
    this.animations = new Animations(this);

    // Game.
    this.game = new Game(this);

    // Seasons (autoseason по прогрессу).
    this.seasons = new SeasonsManager(this);

    // Levels.
    this.levels = new LevelManager(this);

    // Modes.
    this.modes = {
      journal: new JournalMode(this),
      daily: new DailyMode(this),
      zen: new ZenMode(this),
      timed: new TimedMode(this),
    };
    this.currentMode = null;

    // Systems.
    this.score = new ScoreSystem(this);
    this.goal = new GoalSystem(this);
    this.boosters = new BoosterSystem(this);
    this.achievements = new AchievementSystem(this);
    this.progress = new ProgressSystem(this);
    this.save = new SaveSystem(this);

    // UI.
    this.ui = {
      board: new BoardView(this),
      hud: new HUD(this),
      overlay: new Overlay(this),
      map: new MapView(this),
      album: new AlbumView(this),
      ach: new AchievementView(this),
      settings: new SettingsView(this),
    };
  }

  // Удобные акцессоры для текущего режима.
  get currentModeObject() {
    return this.modes[this.currentMode];
  }

  // Shortcut getters для UI — чтобы в модулях писать this.app.hud.setMoves(...)
  // вместо this.app.ui.hud.setMoves(...).
  get hud() { return this.ui.hud; }
  get overlay() { return this.ui.overlay; }
  get boardView() { return this.ui.board; }
  get map() { return this.ui.map; }
  get album() { return this.ui.album; }
  get ach() { return this.ui.ach; }
  get settings() { return this.ui.settings; }

  // Утилита сна для модулей.
  sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Вибрация (если поддерживается).
  buzz(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) { /* noop */ }
  }

  // Транзиентный баннер вверху.
  banner(text) {
    const d = document.createElement('div');
    d.className = 'banner';
    d.textContent = text;
    document.body.appendChild(d);
    setTimeout(() => {
      d.classList.add('out');
      setTimeout(() => d.remove(), 320);
    }, 2800);
  }

  // Запуск приложения: монтируем все UI-элементы, инициализируем игру.
  mount() {
    if (typeof document === 'undefined') return;

    // Mount UI elements to specific DOM IDs.
    this.game.init(document.getElementById('board'));
    this.ui.board.mount(document.getElementById('board'));
    this.ui.hud.mount('#alm .alm-cell', document.getElementById('stems'), document.getElementById('blooms'), document.getElementById('ribbon'));
    this.ui.overlay.mount(document.getElementById('overlay'));
    this.ui.map.mount(document.getElementById('gardenOv'), document.getElementById('mapClose'));
    this.ui.album.mount(document.getElementById('albumOv'), document.getElementById('albumClose'), document.getElementById('albumList'));
    this.ui.ach.mount(document.getElementById('achOv'), document.getElementById('achClose'), document.getElementById('achList'));
    this.ui.settings.mount(document.getElementById('settingsOv'));
    this.weather.mount(document.getElementById('weather'));
    this.particles.mount(document.getElementById('fx'), document.getElementById('vaseMouth'), document.getElementById('stems'), document.getElementById('blooms'));
    this.animations.mount(document.getElementById('phraseLayer'));

    // Wire global buttons.
    this._wireButtons();

    // Audio: запускаем фоновую атмосферу при первом взаимодействии.
    window.addEventListener('pointerdown', () => {
      if (this.store.get('music') && !this.store.get('mute')) this.music.start();
    }, { once: true });

    // Если звук уже мьют — показываем иконку.
    if (this.store.get('mute')) {
      document.getElementById('btnSound').classList.add('muted');
    }
    if (!this.store.get('music')) {
      const ic = document.getElementById('btnMusicTgl');
      if (ic) ic.classList.add('off');
    }

    // Compute cell size.
    this.game.computeCell();
    requestAnimationFrame(() => {
      this.game.computeCell();
      if (this.game.board && this.game.board.grid.length) {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
          if (this.game.board.grid[r][c]) this.game.board.place(this.game.board.grid[r][c].el, r, c, 0);
        }
      }
    });

    // Daily login (streak, booster reward).
    this.progress.dailyLogin();

    // Apply daytime by current progress.
    this.game.level = this.levels.progress;
    this.modes.journal.applyDaytime(this.game.level);

    // Initial UI update.
    this.boosters.updateUI();
    this.boosters.updateChargeUI();

    // Apply season UI (almanac labels).
    this.ui.hud.applySeasonUI();

    // Start journal mode (will show overlay).
    this.setMode('journal');

    this.bus.emit('app:ready');
    window.__flor3ok = true;
  }

  _wireButtons() {
    const $ = (id) => document.getElementById(id);
    $('bUndo').addEventListener('click', () => this.boosters.useUndo());
    $('bCan').addEventListener('click', () => this.boosters.armCan());
    $('bGlove').addEventListener('click', () => this.boosters.armGlove());
    $('bPlus').addEventListener('click', () => this.boosters.usePlus5());
    $('btnCharge').addEventListener('click', () => this.game.useWatering());
    $('btnRestart').addEventListener('click', () => {
      const g = this.game;
      if (g.mode === 'zen') { this.setMode('zen'); return; }
      if (g.mode === 'timed') { this.setMode('timed'); return; }
      if (g.mode === 'daily') { this.setMode('daily'); return; }
      g.score = g.levelStartScore;
      this.modes.journal.setupLevel();
    });
    $('btnHome').addEventListener('click', () => this.setMode('journal'));
    $('btnMode').addEventListener('click', () => {
      this.ui.overlay.hide();
      this.ui.overlay.show({
        title: 'Режим игры',
        text: 'Дневник — основная история с листами и наградами. Пазл дня — одна раскладка для всех, раз в сутки. Дзен — спокойный сбор без ходов. На время — 120 секунд азарта.',
        btn: 'Закрыть',
        fn: () => {},
        modes: true,
      });
    });
    $('btnMap').addEventListener('click', () => this.ui.map.open());
    $('btnAlbum').addEventListener('click', () => this.ui.album.open());
    $('btnAch').addEventListener('click', () => this.ui.ach.open());
    $('btnNewDiary').addEventListener('click', () => {
      const g = this.game;
      if (g.mode === 'zen' || g.mode === 'timed') {
        g.mode = 'journal';
        clearInterval(g.timerIv);
        g.timerIv = null;
        document.getElementById('btnHome').style.display = 'none';
      }
      this.modes.journal.confirmNewDiary();
    });
    $('btnMusicTgl').addEventListener('click', () => {
      const on = !this.store.get('music');
      this.music.setMusicPref(on);
      const ic = document.getElementById('btnMusicTgl');
      if (ic) ic.classList.toggle('off', !on);
    });
    $('btnSound').addEventListener('click', () => {
      const mute = !this.store.get('mute');
      this.store.set('mute', mute);
      document.getElementById('btnSound').classList.toggle('muted', mute);
      if (mute) this.music.stop();
      else if (this.store.get('music')) this.music.start();
    });
    $('btnGear').addEventListener('click', () => this.ui.settings.open());

    // Window resize — пересчёт размера ячейки.
    window.addEventListener('resize', () => {
      const old = this.game.board.cell;
      this.game.computeCell();
      if (this.game.board && this.game.board.grid.length && this.game.board.cell !== old) {
        this.game.board.reflowLayout(() => this.ui.board.reflowOverlays());
      }
    });
  }

  setMode(name) {
    this.currentMode = name;
    this.modes[name].start();
    this.bus.emit('mode:changed', name);
  }
}

export default App;
