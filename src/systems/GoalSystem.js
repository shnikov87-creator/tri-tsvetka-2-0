// src/systems/GoalSystem.js
// Отслеживание прогресса цели уровня (букет/заказ/роса/сорняки/бабочки/дзен/тайм).
// Хранит состояние в Game (g.picked, g.dewCleared, g.weedCleared, g.bfCleared, g.almCounts).

import { TYPE_LABEL } from '../levels/levelSpec.js';
import { DIFF_NAMES } from '../levels/difficulty.js';

const joinRu = (a) => (a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1]);

export class GoalSystem {
  constructor(app) {
    this.app = app;
  }

  _cfg() {
    return this.app.game.levelCfg;
  }

  won() {
    const g = this.app.game;
    const s = this._cfg();
    if (!s) return false;
    if (s.type === 'order') return s.targets.every(([i, n]) => g.almCounts[i] >= n);
    if (s.type === 'dew') return g.dewCleared >= s.dew;
    if (s.type === 'weeds') return g.weedCleared >= s.weedsNeed;
    if (s.type === 'butterfly') return g.bfCleared >= s.bf;
    return g.picked >= g.goal;
  }

  typeLabel(t) {
    return TYPE_LABEL[t] || 'Лист';
  }

  diffName(d) {
    return DIFF_NAMES[d] || '';
  }

  startTag() {
    const s = this._cfg();
    const g = this.app.game;
    if (s.type === 'order') return 'Заказ: ' + joinRu(s.targets.map(([i, n]) => `${n} ${this._rug(i)}`));
    if (s.type === 'dew') return `Роса: ${s.dew} капель`;
    if (s.type === 'weeds') return `Вырвите ${s.weedsNeed} сорняков`;
    if (s.type === 'butterfly') return `Бабочки: ${s.bf}`;
    if (s.type === 'zen') return 'Свободный сбор';
    if (s.type === 'timed') return '120 секунд!';
    return `Букет: ${g.goal} цветов`;
  }

  previewText() {
    const s = this._cfg();
    const g = this.app.game;
    const parts = [];
    switch (s.type) {
      case 'bouquet': parts.push(`Составьте букет из ${s.goal} цветов за ${s.moves} ходов.`); break;
      case 'order': parts.push(`Заказ: ${joinRu(s.targets.map(([i, n]) => `${n} ${this._rug(i)}`))} — за ${s.moves} ходов. Нужные виды подсвечены в гербарии.`); break;
      case 'dew': parts.push(`Стряхните ${s.dew} капель росы: собирайте цветы прямо под капельками. Ходов: ${s.moves}.`); break;
      case 'weeds': parts.push(`Вырвите ${s.weedsNeed} сорняков за ${s.moves} ходов. Каждый ход они расползаются!`); break;
      case 'butterfly': parts.push(`Доставьте в нижний ряд ${s.bf} бабочек за ${s.moves} ходов.`); break;
      case 'zen': parts.push('Свободный сбор без ходов и цели.'); break;
      case 'timed': parts.push('У вас 120 секунд — соберите как можно больше!'); break;
    }
    if (s.weedsInit && s.type !== 'weeds') parts.push('Мешают сорняки — выдёргивайте их сборами (+25).');
    if (s.stones && s.stones.length) parts.push('Камни разбиваются сборами рядом или особыми цветами.');
    return parts.join(' ');
  }

  updateProgress() {
    const g = this.app.game;
    const s = this._cfg() || {};
    let label = 'Букет', txt = '', frac = 0;
    if (s.type === 'order') {
      label = 'Заказ';
      let need = 0, got = 0;
      s.targets.forEach(([i, n]) => { need += n; got += Math.min(g.almCounts[i], n); });
      txt = `${got} из ${need}`;
      frac = need ? got / need : 0;
    } else if (s.type === 'dew') {
      label = 'Роса';
      txt = `${g.dewCleared} из ${s.dew} капель`;
      frac = s.dew ? g.dewCleared / s.dew : 0;
    } else if (s.type === 'weeds') {
      label = 'Сорняки';
      txt = `${g.weedCleared} из ${s.weedsNeed}`;
      frac = s.weedsNeed ? g.weedCleared / s.weedsNeed : 0;
    } else if (s.type === 'butterfly') {
      label = 'Бабочки';
      txt = `${g.bfCleared} из ${s.bf}`;
      frac = s.bf ? g.bfCleared / s.bf : 0;
    } else if (s.type === 'zen') {
      label = 'Дзен';
      txt = `${g.picked} цветов`;
      frac = (g.picked % 120) / 120;
    } else if (s.type === 'timed') {
      label = 'На время';
      txt = `${g.picked} цветов`;
      frac = (g.picked % 120) / 120;
    } else {
      txt = `${g.picked} из ${g.goal}`;
      frac = g.goal ? g.picked / g.goal : 0;
    }
    this.app.hud.setProgress(label, txt, Math.min(100, frac * 100));
    this.app.hud.renderTask();
  }

  _rug(i) {
    const season = this.app.store.get('season');
    const G = {
      summer: ['ромашек', 'маков', 'тюльпанов', 'васильков', 'подсолнухов', 'веточек зелени'],
      spring: ['подснежников', 'крокусов', 'нарциссов', 'ландышей', 'гиацинтов', 'одуванчиков'],
      autumn: ['астр', 'георгинов', 'физалиса', 'георгинов медных', 'лунника', 'морозника алого'],
      winter: ['морозников светлых', 'зимних роз', 'анютиных глазок', 'снежноягодника', 'морозников тёмных', 'падуба'],
    };
    return G[season][i];
  }
}

export default GoalSystem;
