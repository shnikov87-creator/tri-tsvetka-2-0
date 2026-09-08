// src/systems/BoosterSystem.js
// Управление бустерами (лейка/перчатка/+5/отмена) и зарядом полива.

const BOOST_NAMES = { can: 'лейка', glove: 'перчатка', plus5: '+5 ходов', undo: 'отмена' };

export class BoosterSystem {
  constructor(app) {
    this.app = app;
  }

  updateUI() {
    const boost = this.app.store.get('boost');
    const g = this.app.game;
    document.getElementById('cCan').textContent = boost.can;
    document.getElementById('cGlove').textContent = boost.glove;
    document.getElementById('cPlus').textContent = boost.plus5;
    document.getElementById('cUndo').textContent = boost.undo;
    document.getElementById('bCan').disabled = !boost.can || g.busy;
    document.getElementById('bGlove').disabled = !boost.glove || g.busy;
    document.getElementById('bPlus').disabled = !boost.plus5 || g.mode === 'zen' || g.mode === 'timed';
    // Undo-бонус: доступен только в journal/daily и если есть заряд и есть что отменять.
    const undoAvailable = (g.mode === 'journal' || g.mode === 'daily') && !!g.undoSnap && !g.busy;
    document.getElementById('bUndo').disabled = !boost.undo || !undoAvailable;
    document.getElementById('bCan').classList.toggle('armed', g.armed === 'can');
    document.getElementById('bGlove').classList.toggle('armed', g.armed === 'glove');
    this.updateChargeUI();
  }

  updateChargeUI() {
    const charge = this.app.store.get('charge');
    document.getElementById('chargeFill').style.width = charge + '%';
    document.getElementById('btnCharge').classList.toggle('ready', charge >= 100);
  }

  // Случайный бустер в награду. Возвращает его русское название.
  awardRandom() {
    const ks = ['can', 'glove', 'plus5', 'undo'];
    const k = ks[Math.floor(Math.random() * ks.length)];
    const boost = { ...this.app.store.get('boost') };
    boost[k]++;
    this.app.store.set('boost', boost);
    this.updateUI();
    return BOOST_NAMES[k];
  }

  // Активировать лейку.
  armCan() {
    const g = this.app.game;
    if (g.busy) return;
    const boost = this.app.store.get('boost');
    if (!boost.can) return;
    if (g.armed === 'can') { this.disarm(); return; }
    this.disarm();
    g.armed = 'can';
    document.body.classList.add('arming');
    this.updateUI();
    this.app.banner('Лейка: выберите цветок — уберу без хода');
  }

  // Активировать перчатку.
  armGlove() {
    const g = this.app.game;
    if (g.busy) return;
    const boost = this.app.store.get('boost');
    if (!boost.glove) return;
    if (g.armed === 'glove') { this.disarm(); return; }
    this.disarm();
    g.armed = 'glove';
    document.body.classList.add('arming');
    this.updateUI();
    this.app.banner('Перчатка: выберите две любые фишки — поменяю без хода');
  }

  disarm() {
    const g = this.app.game;
    g.armed = null;
    g.gloveA = null;
    document.body.classList.remove('arming');
    document.querySelectorAll('.tile.gloveA').forEach((el) => el.classList.remove('gloveA'));
    this.updateUI();
  }

  // +5 ходов.
  usePlus5() {
    const g = this.app.game;
    if (g.busy) return;
    const boost = this.app.store.get('boost');
    if (!boost.plus5 || g.mode === 'zen' || g.mode === 'timed') return;
    const next = { ...boost, plus5: boost.plus5 - 1 };
    this.app.store.set('boost', next);
    this.updateUI();
    g.moves += 5;
    this.app.hud.setMoves(g.moves);
    this.app.sound.special();
    this.app.buzz(20);
    this.app.banner('+5 ходов');
    this.app.save.write();
  }

  // Бонус отмены — тратит один заряд boost.undo и откатывает последний ход.
  useUndo() {
    const g = this.app.game;
    if (g.busy) return;
    if (g.mode !== 'journal' && g.mode !== 'daily') return;
    const boost = this.app.store.get('boost');
    // Проверяем все условия doUndo заранее, чтобы не тратить заряд впустую.
    if (!boost.undo || !g.undoSnap) return;
    const next = { ...boost, undo: boost.undo - 1 };
    this.app.store.set('boost', next);
    g.doUndo();
    this.updateUI();
  }

  updateUndoBtn() {
    // Обновляем только состояние кнопки через общий updateUI.
    this.updateUI();
  }
}

export default BoosterSystem;
