#!/bin/bash

# Скрипт автоматического деплоя
# Использование: ./deploy.sh

echo "🚀 Начинаем деплой..."
echo ""

PROJECT_DIR="/opt/arenda-neba"
cd "$PROJECT_DIR" || exit 1
echo "📂 Рабочая директория: $(pwd)"

# ============================================
# 1. Проверяем что database.db и uploads на месте ДО git операций
# ============================================
# Оба защищены .gitignore (*.db и uploads/) — git clean -fd их НЕ трогает.
# Но на всякий случай делаем бэкап БД.

if [ -f "database.db" ]; then
    BACKUP_DB="database_backup_$(date +%Y%m%d_%H%M%S).db"
    sqlite3 "database.db" ".backup '$BACKUP_DB'" 2>/dev/null || cp "database.db" "$BACKUP_DB" 2>/dev/null
    echo "💾 Бэкап БД: $BACKUP_DB ($(du -h "$BACKUP_DB" 2>/dev/null | cut -f1))"
fi

UPLOADS_BEFORE=$(find uploads -type f 2>/dev/null | wc -l)
echo "📁 Uploads до деплоя: $UPLOADS_BEFORE файлов"

# ============================================
# 2. Git: получаем новый код
# ============================================
echo "📥 Получаем код из Git..."
git merge --abort 2>/dev/null || true
git fetch origin
git reset --hard origin/main

# Удаляем неотслеживаемые файлы (кроме gitignored: database.db, uploads/, *.db и т.д.)
git clean -fd

# ============================================
# 3. Проверяем что БД и uploads выжили
# ============================================
if [ ! -f "database.db" ]; then
    echo "⚠️ БД пропала! Восстанавливаем из бэкапа..."
    [ -f "$BACKUP_DB" ] && cp "$BACKUP_DB" database.db
fi

if [ ! -d "uploads" ]; then
    echo "⚠️ Папка uploads пропала! Создаём..."
    mkdir -p uploads
fi

UPLOADS_AFTER=$(find uploads -type f 2>/dev/null | wc -l)
DB_SIZE=$(du -h database.db 2>/dev/null | cut -f1)
echo "✅ БД: $DB_SIZE | Uploads: $UPLOADS_AFTER файлов"

if [ "$UPLOADS_AFTER" -lt "$UPLOADS_BEFORE" ]; then
    echo "❌ ВНИМАНИЕ: uploads уменьшился с $UPLOADS_BEFORE до $UPLOADS_AFTER файлов!"
fi

# ============================================
# 4. Зависимости — только если package.json изменился
# ============================================
NEED_INSTALL=false

if [ ! -d "node_modules" ]; then
    NEED_INSTALL=true
elif [ "package.json" -nt "node_modules/.package-lock.json" ] 2>/dev/null; then
    NEED_INSTALL=true
fi

if [ "$NEED_INSTALL" = true ]; then
    echo "📦 Устанавливаем зависимости..."
    npm install
    echo "✅ Зависимости установлены"
fi

# Всегда пересобираем sqlite3 под текущую платформу (Windows-бинарник не работает на Linux)
echo "🔧 Пересобираем sqlite3..."
npm rebuild sqlite3 2>/dev/null || npm install sqlite3 --build-from-source 2>/dev/null || true

# ============================================
# 5. Регенерируем страницы техники из БД
# ============================================
echo "🔄 Регенерируем страницы оборудования..."
if [ -f "generate-pages.js" ]; then
    node generate-pages.js
    echo "✅ Страницы обновлены"
fi

# ============================================
# 6. Перезапуск PM2
# ============================================
echo "🔄 Перезапускаем приложение..."
pm2 restart arenda-neba

# Очищаем старые бэкапы (старше 7 дней)
find . -maxdepth 1 -name "database_backup_*.db" -mtime +7 -delete 2>/dev/null || true
find . -maxdepth 1 -name "database_temp_*.db*" -mtime +1 -delete 2>/dev/null || true

echo ""
echo "✅ Деплой завершен!"
pm2 status arenda-neba
