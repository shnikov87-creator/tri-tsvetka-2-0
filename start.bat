@echo off
chcp 65001 >nul
title Три цветка — садовая забава

echo.
echo  ============================================================
echo   Три цветка — садовая забава
echo   Запуск проекта (один клик)
echo  ============================================================
echo.

REM Проверяем, есть ли Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo  [X] Node.js не найден!
  echo      Скачайте с https://nodejs.org/ (версия 18+)
  echo.
  pause
  exit /b 1
)

echo  [1/4] Проверка Node.js... OK
node --version

REM Если есть Bun — используем его, иначе npm
where bun >nul 2>nul
if %ERRORLEVEL% equ 0 (
  set PKG=bun
  set INSTALL=bun install
  set DB_PUSH=bun run db:push
  set DEV=bun run dev
) else (
  set PKG=npm
  set INSTALL=npm install
  set DB_PUSH=npx prisma db push --accept-data-loss
  set DEV=npm run dev
)

echo  [2/4] Установка зависимостей (%PKG%)...
echo.
call %INSTALL%
if %ERRORLEVEL% neq 0 (
  echo.
  echo  [X] Ошибка установки зависимостей
  pause
  exit /b 1
)

echo.
echo  [3/4] Инициализация базы данных (SQLite)...
echo.
call %DB_PUSH%
REM db:push может вернуть non-zero, если БД уже есть — это OK

echo.
echo  [4/4] Запуск dev-сервера...
echo.
echo  ============================================================
echo   Сервер запущен на http://localhost:3000
echo   Откройте этот адрес в браузере.
echo   Чтобы остановить — закройте это окно.
echo  ============================================================
echo.

REM Открываем браузер через 5 секунд (когда сервер поднимется)
start "" /b cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:3000"

call %DEV%

pause
