'use client';

import { useEffect, useRef } from 'react';
import { SVG_DEFS } from '@/game/svgDefs';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    // Динамически импортируем игровой код — он использует DOM и localStorage,
    // поэтому должен работать только в браузере.
    import('@/main').then(({ startGame }) => {
      if (!mounted) return;
      startGame();
    }).catch((err) => {
      console.error('Game failed to start', err);
      const b = document.getElementById('errBanner');
      if (b) {
        b.style.display = 'block';
        b.textContent = 'Скрипт игры не запустился: ' + (err?.message || err);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <div id="errBanner" />

      {/* SVG-библиотека <symbol> */}
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute' }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: SVG_DEFS }}
      />

      <div className="frame">
        <svg className="corner tl" viewBox="0 0 90 90"><use href="#corner-branch" /></svg>
        <svg className="corner tr" viewBox="0 0 90 90"><use href="#corner-branch" /></svg>
        <svg className="corner br" viewBox="0 0 90 90"><use href="#corner-branch" /></svg>
        <svg className="corner bl" viewBox="0 0 90 90"><use href="#corner-branch" /></svg>

        <header className="masthead">
          <h1>Три <em>цветка</em></h1>
          <div className="mast-top">
            <span id="lvlName">лист первый · луговой</span>
          </div>
        </header>

        <main className="spread">
          <section className="board-side">
            <div className="taskbar" id="taskbar" />
            <div id="phraseLayer" />
            <div className="board-outer">
              <div id="board" ref={containerRef} />
            </div>
            <div className="boostbar">
              <div className="moves-chip" id="movesChip" aria-label="Ходы">
                <svg viewBox="0 0 100 100"><use href="#g-moves" width="100" height="100" /></svg>
                <b id="movesCnt">30</b>
              </div>
              <button className="ctl boost icon-only" id="bCan" aria-label="Лейка">
                <svg viewBox="0 0 100 100"><use href="#g-shovel" width="100" height="100" /></svg>
                <b className="cnt" id="cCan">0</b>
              </button>
              <button className="ctl boost icon-only" id="bGlove" aria-label="Перчатка">
                <svg viewBox="0 0 100 100"><use href="#g-glove" width="100" height="100" /></svg>
                <b className="cnt" id="cGlove">0</b>
              </button>
              <button className="ctl boost icon-only" id="bPlus" aria-label="+5 ходов">
                <svg viewBox="0 0 100 100"><use href="#g-plus" width="100" height="100" /></svg>
                <b className="cnt" id="cPlus">0</b>
              </button>
              <button className="ctl boost icon-only" id="bUndo" aria-label="Отменить">
                <svg viewBox="0 0 100 100"><use href="#g-undo" width="100" height="100" /></svg>
                <b className="cnt" id="cUndo">0</b>
              </button>
              <button className="ctl charge icon-only" id="btnCharge" aria-label="Полив">
                <svg viewBox="0 0 100 100"><use href="#g-can" width="100" height="100" /></svg>
                <span className="cbar"><i id="chargeFill" /></span>
              </button>
            </div>
          </section>

          <aside className="ledger">
            <div className="cap">Дневник садовника</div>
            <div className="stat-row">
              <div>
                <div className="stat-cap">Счёт</div>
                <div className="stat-num" id="score">0</div>
              </div>
              <div>
                <div className="stat-cap" id="movesCap">Ходы</div>
                <div className="stat-num" id="moves">30</div>
              </div>
            </div>
            <div className="best-line">рекорд · <b id="best">0</b><span id="modeBest" /></div>
            <div className="bouquet-cap"><span id="goalType">Букет</span><b id="pickedTxt">0 из 80</b></div>
            <div className="bar"><i id="barFill" /></div>
            <div className="cap alm-cap" style={{ marginTop: '16px' }}>Гербарий листа</div>
            <div className="alm" id="alm">
              <div className="alm-cell"><svg viewBox="0 0 100 100"><use href="#f-daisy" width="100" height="100" /></svg><b>0</b><i>ромашка</i></div>
              <div className="alm-cell"><svg viewBox="0 0 100 100"><use href="#f-poppy" width="100" height="100" /></svg><b>0</b><i>мак</i></div>
              <div className="alm-cell"><svg viewBox="0 0 100 100"><use href="#f-tulip" width="100" height="100" /></svg><b>0</b><i>тюльпан</i></div>
              <div className="alm-cell"><svg viewBox="0 0 100 100"><use href="#f-cornflower" width="100" height="100" /></svg><b>0</b><i>василёк</i></div>
              <div className="alm-cell"><svg viewBox="0 0 100 100"><use href="#f-sun" width="100" height="100" /></svg><b>0</b><i>подсол.</i></div>
              <div className="alm-cell"><svg viewBox="0 0 100 100"><use href="#f-greens" width="100" height="100" /></svg><b>0</b><i>зелень</i></div>
            </div>
            <div className="vase-wrap">
              <svg id="vaseSvg" viewBox="0 80 220 220">
                <circle id="vaseMouth" cx="110" cy="202" r="1" fill="none" />
                <g id="stems" />
                <g id="blooms" />
                <g>
                  <path d="M84 200 C82 216 72 230 72 252 C72 279 90 294 110 294 C130 294 148 279 148 252 C148 230 138 216 136 200 Z" fill="#E7DDC6" stroke="#2E3A2E" strokeWidth="1.6" />
                  <ellipse cx="110" cy="200" rx="26" ry="5.5" fill="#F3ECDA" stroke="#2E3A2E" strokeWidth="1.6" />
                </g>
                <g id="ribbon">
                  <path d="M97 207 L84 238 L94 233 L100 246 L107 215 M123 207 L136 238 L126 233 L120 246 L113 215" fill="#B4522D" stroke="#7E3418" strokeWidth="1" />
                  <path d="M96 205 C102 196 118 196 124 205 C118 212 102 212 96 205Z" fill="#C9663C" stroke="#7E3418" strokeWidth="1" />
                </g>
              </svg>
            </div>
            <div className="vase-note">ваза для сбора</div>
            <div className="controls">
              <button className="ctl" id="btnRestart">Заново</button>
              <button className="ctl" id="btnHome" style={{ display: 'none' }}>В дневник</button>
              <button className="ctl" id="btnMode">Режим игры</button>
              <button className="ctl" id="btnMap">Сад</button>
              <button className="ctl" id="btnAlbum">Альбом</button>
              <button className="ctl" id="btnAch">Награды</button>
              <button className="ctl" id="btnNewDiary">Новый дневник</button>
              <button className="ctl" id="btnGear" aria-label="Настройки">
                <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1.6v2.2M8 12.2v2.2M1.6 8h2.2M12.2 8h2.2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M12.5 3.5 11 5M5 11l-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                Уют
              </button>
            </div>
          </aside>
        </main>

        <footer>Гербарий № 3 · четыре сезона</footer>
      </div>

      {/* Спрятанные кнопки Фон/Звук — остались в DOM, но не видны. Управляются из УЮТа. */}
      <button className="ctl icon-only" id="btnMusicTgl" aria-label="Фоновые звуки вкл/выкл" style={{ display: 'none' }}>
        <svg className="note-on" viewBox="0 0 16 16"><path d="M6 12.5V4l6-1.6v8.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><circle cx="4.6" cy="12.5" r="1.8" fill="currentColor" /><circle cx="10.6" cy="10.8" r="1.8" fill="currentColor" /></svg>
        <svg className="note-off" viewBox="0 0 16 16"><path d="M6 12.5V4l6-1.6v8.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><circle cx="4.6" cy="12.5" r="1.8" fill="currentColor" /><circle cx="10.6" cy="10.8" r="1.8" fill="currentColor" /><path d="M2.5 2.5l11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      <button className="ctl" id="btnSound" aria-label="Звук" style={{ display: 'none' }}>
        <svg className="ic-on" viewBox="0 0 16 16"><path d="M2 6v4h3l4 3.4V2.6L5 6H2Z" fill="currentColor" /><path d="M11.5 5.3a3.8 3.8 0 0 1 0 5.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        <svg className="ic-off" viewBox="0 0 16 16"><path d="M2 6v4h3l4 3.4V2.6L5 6H2Z" fill="currentColor" /><path d="M11 6l4 4M15 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
      </button>

      <div id="fx" />
      <div id="weather" />

      {/* Основной оверлей */}
      <div className="ov" id="overlay">
        <div className="card">
          <div className="cap">Садовая записка</div>
          <h2 id="ovTitle" />
          <div className="starsBig" id="ovStars" />
          <div className="taskbar" id="ovTasks" />
          <p id="ovText" />
          <div className="sumLine" id="ovStats" />
          <div id="ovDiff" />
          <div id="ovModes" />
          <button className="ctl" id="ovBtn" />
          <div className="ovRow">
            <button className="ctl ovBtnHide" id="ovBtn3" />
            <button className="ctl ovBtnHide" id="ovBtn2">С начала дневника</button>
          </div>
        </div>
      </div>

      {/* Карта сада */}
      <div className="ov" id="gardenOv">
        <div className="card wide">
          <div className="cap">Сад-карта</div>
          <h2>Ваш сад</h2>
          <p>Пройденные листья зацветают. Выбирайте любой открытый лист.</p>
          <div className="mapGrid" id="mapGrid" />
          <button className="ctl" id="mapClose">Закрыть</button>
        </div>
      </div>

      {/* Альбом */}
      <div className="ov" id="albumOv">
        <div className="card wide">
          <div className="cap">Альбом букетов</div>
          <h2>Открытки</h2>
          <div className="lst" id="albumList" />
          <button className="ctl" id="albumClose">Закрыть</button>
        </div>
      </div>

      {/* Достижения */}
      <div className="ov" id="achOv">
        <div className="card wide">
          <div className="cap">Награды сада</div>
          <h2>Достижения</h2>
          <div className="lst" id="achList" />
          <button className="ctl" id="achClose">Закрыть</button>
        </div>
      </div>

      {/* Настройки */}
      <div className="ov" id="settingsOv">
        <div className="card setCard">
          <div className="cap">Настройки</div>
          <h2>Уют в саду</h2>
          <div className="set-row"><span>Все звуки</span><button className="tgl" id="setMute">включены</button></div>
          <div className="set-row"><span>Громкость</span><input type="range" id="setVol" min="0" max="100" step="1" /></div>
          <div className="set-row"><span>Фоновые звуки</span><button className="tgl" id="setMusic">включены</button></div>
          <div className="set-row"><span>Атмосфера</span>
            <div className="seg" id="setAmb">
              <button data-v="birds">Птицы</button>
              <button data-v="brook">Ручей</button>
              <button data-v="rain">Дождь</button>
            </div>
          </div>
          <div className="set-row"><span>Частицы</span>
            <div className="seg" id="setFx">
              <button data-v="1">Все</button>
              <button data-v="0.5">Меньше</button>
              <button data-v="0.15">Минимум</button>
            </div>
          </div>
          <div className="set-row"><span>Размер поля</span>
            <div className="seg" id="setSize">
              <button data-v="compact">Компакт</button>
              <button data-v="normal">Обычный</button>
              <button data-v="large">Крупный</button>
              <button data-v="max">Макс</button>
            </div>
          </div>
          <div className="set-row"><span>Меньше движения</span><button className="tgl" id="setMotion">выкл</button></div>
          <div className="set-row"><span>Сезон (тест)</span>
            <div className="seg" id="setSeason">
              <button data-v="summer">Лето</button>
              <button data-v="spring">Весна</button>
              <button data-v="autumn">Осень</button>
              <button data-v="winter">Зима</button>
            </div>
          </div>
          <div className="set-row"><span>Тема</span>
            <div className="seg" id="setTheme">
              <button data-v="light">Светлая</button>
              <button data-v="dark">Тёмная</button>
            </div>
          </div>
          <p className="setNote">Сезоны гербария меняются автоматически каждые несколько листов — от лета к осени, зиме и весне.</p>
          <button className="ctl" id="setReset">Сбросить прогресс</button><br />
          <button className="ctl" id="setClose" style={{ marginTop: '10px' }}>Готово</button>
        </div>
      </div>
    </>
  );
}
