// src/ui/AlbumView.js
// Оверлей альбома букетов: список открыток с прошедших листов.

export class AlbumView {
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
    this.app.progress.renderInto(this.listEl);
    this.el.classList.add('show');
  }
}

export default AlbumView;
