#!/usr/bin/env bash
# Подключает /opt/arenda-neba к origin и синхронизирует с main.
# Не трогает неотслеживаемое: database.db, uploads/, node_modules/ (см. .gitignore).
set -euo pipefail

PROJECT_DIR="${1:-/opt/arenda-neba}"
ORIGIN="${GIT_ORIGIN:-https://github.com/MassimoUniverse/Arenda-neba-1.git}"
BRANCH="${GIT_BRANCH:-main}"

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true

if [ ! -d .git ]; then
  echo ">>> git init в $PROJECT_DIR"
  git init
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$ORIGIN"
else
  git remote set-url origin "$ORIGIN"
fi

echo ">>> git fetch origin $BRANCH"
GIT_TERMINAL_PROMPT=0 git fetch origin "$BRANCH"

echo ">>> синхронизация с origin/$BRANCH"
git reset --hard "origin/$BRANCH" 2>/dev/null || git checkout -f -B "$BRANCH" "origin/$BRANCH"

echo ">>> готово:"
git log -1 --oneline
git status -sb

# Проверяем, что sqlite3 нативный модуль рабочий (не Windows-бинарник)
echo ">>> проверка sqlite3..."
if ! node -e "require('sqlite3')" 2>/dev/null; then
  echo ">>> sqlite3 сломан, переустанавливаем..."
  rm -rf node_modules/sqlite3
  npm install sqlite3 --no-audit --no-fund
fi
