// src/ui/AchievementView.js
// Оверлей списка достижений.

export class AchievementView {
  constructor(app) {
    this.app = app;
    this.el = null;
  }

  mount(el, closeBtn, listEl) {
    this.el = el;
    this.listEl = listEl;
    closeBtn.addEventListener('click', () => el.classList.remove('show'));
  }

  open() {
    this.app.achievements.renderInto(this.listEl);
    this.el.classList.add('show');
  }
}

export default AchievementView;
