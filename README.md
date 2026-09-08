# Три цветка — садовая забава 🌸

Казуальная match-3 игра в эстетике ботанического гербария. Четыре сезона, живая погода по всей странице, WebAudio-синтез звуков, бустеры, спецтайлы, достижения, ежедневные пазлы.

## Запуск в один клик

### Windows (PowerShell или двойной клик по файлу)
```powershell
.\start.bat
```
Двойной клик по `start.bat` в проводнике — установит зависимости, инициализирует БД, запустит dev-сервер и откроет браузер.

### macOS / Linux (Terminal)
```bash
./start.sh
```
Сделайте скрипт исполняемым: `chmod +x start.sh`, затем запустите.

---

## Ручной запуск (если скрипты не работают)

### Требования
- **Node.js 18+** — [скачать](https://nodejs.org/)
- **Bun** (опционально, быстрее) — [установить](https://bun.sh/)

### Установка зависимостей
```bash
# Вариант 1: Bun (рекомендуется, быстрее)
bun install

# Вариант 2: npm (если нет Bun)
npm install
```

### Инициализация базы данных (SQLite)
```bash
bun run db:push
# или
npx prisma db push --accept-data-loss
```

### Запуск dev-сервера
```bash
bun run dev
# или
npm run dev
```

Откройте http://localhost:3000 в браузере.

### Проверка кода (линт)
```bash
bun run lint
# или
npm run lint
```

---

## Технологии

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 4** + **shadcn/ui** (New York style) + **Lucide icons**
- **Prisma ORM** (SQLite)
- **Zustand** (клиентский state)
- **framer-motion** (анимации)
- **WebAudio API** (синтез звуков без аудиофайлов)
- **next/font** (Cormorant Garamond + Jost из Google Fonts)

## Архитектура

```
src/
├── app/        App.js (координатор), GameStore.js (стор), EventBus.js, page.tsx, layout.tsx
├── game/       Game.js, Board.js, Tile.js, MatchFinder.js, Cascade.js, Gravity.js,
│               Spawner.js, SpecialTiles.js, SeasonsManager.js, data/seasons.js, svgDefs.js
├── levels/     LevelManager.js, levelSpec.js, difficulty.js, daily.js
├── modes/      JournalMode.js, DailyMode.js, ZenMode.js, TimedMode.js
├── systems/    ScoreSystem.js, GoalSystem.js, BoosterSystem.js,
│               AchievementSystem.js, ProgressSystem.js, SaveSystem.js
├── ui/         BoardView.js, HUD.js, Overlay.js, MapView.js, AlbumView.js,
│               AchievementView.js, SettingsView.js
├── audio/      Sound.js, Music.js (WebAudio-синтез)
├── effects/    Weather.js, Particles.js, Animations.js
├── storage/    LocalStorageAdapter.js
├── styles/     game.css (палитра, layout, тёмная тема)
├── components/ shadcn/ui компоненты
├── lib/        db.ts (Prisma), utils.ts
├── hooks/      use-toast.ts, use-mobile.ts
└── main.js     bootstrap (старт App)
```

## Возможности игры

- **4 сезона** (лето/осень/зима/весна) — автосмена каждые 5-6 листов дневника
- **4 режима**: Дневник (история), Пазл дня, Дзен (свободный сбор), На время (120 сек)
- **Бустеры**: Лейка (убрать тайл), Перчатка (поменять местами), +5 ходов, Отмена (откат хода)
- **Спецтайлы**: Бутон (3×3), Соцветие (ряд+столбец), Дикий цветок (по типу/сад), Луковица (прорастает), Бабочка (в нижний ряд)
- **Препятствия**: Камни, Сорняки (расползаются), Роса (стряхивается)
- **Прогрессия**: звёзды по листам, альбом букетов, 13 достижений, ежедневный стрик
- **Атмосфера**: птицы / ручей / дождь (WebAudio-синтез, без аудиофайлов)
- **Погода на странице**: бабочки/снежинки/листья/лепестки по сезонам
- **Тёмная тема** (переключается в УЮТе)
- **Адаптив**: мобильный + десктоп

## Управление

- **Свап**: drag (зажать и потянуть) или тап-тап по двум соседним тайлам
- **Бустеры**: тап по кнопке в boostbar, затем тап по тайлу
- **Настройки**: кнопка «Уют» внизу справа

## Скриншоты

Откройте игру — увидите поле 8×8 с цветами, боковую «Книгу садовника» со счётом/ходами/гербарием/вазой, и панель управления.

## Лицензия

Свободно для личного использования.

## Автор

Сделано с помощью Z.ai Code.
