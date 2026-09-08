#!/bin/bash
# Запуск «Три цветка — садовая забава» в один клик (macOS / Linux)
set -e

cd "$(dirname "$0")"

echo ""
echo "  ============================================================="
echo "   Три цветка — садовая забава"
echo "   Запуск проекта (один клик)"
echo "  ============================================================="
echo ""

# Проверяем Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "  [X] Node.js не найден!"
  echo "      Скачайте с https://nodejs.org/ (версия 18+)"
  echo "      Или установите через brew: brew install node"
  exit 1
fi

echo "  [1/4] Проверка Node.js... OK"
node --version

# Выбираем пакетный менеджер
if command -v bun >/dev/null 2>&1; then
  PKG="bun"
  INSTALL="bun install"
  DB_PUSH="bun run db:push"
  DEV="bun run dev"
else
  PKG="npm"
  INSTALL="npm install"
  DB_PUSH="npx prisma db push --accept-data-loss"
  DEV="npm run dev"
fi

echo "  [2/4] Установка зависимостей ($PKG)..."
echo ""
$INSTALL

echo ""
echo "  [3/4] Инициализация базы данных (SQLite)..."
echo ""
$DB_PUSH || true  # БД может уже существовать — это OK

echo ""
echo "  [4/4] Запуск dev-сервера..."
echo ""
echo "  ============================================================="
echo "   Сервер запущен на http://localhost:3000"
echo "   Откройте этот адрес в браузере."
echo "   Чтобы остановить — нажмите Ctrl+C."
echo "  ============================================================="
echo ""

# Открываем браузер через 6 секунд (когда сервер поднимется)
(sleep 6 && (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || true)) &

$DEV
