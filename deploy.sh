#!/bin/bash

# Скрипт автоматического деплоя
# Использование: ./deploy.sh

echo "🚀 Начинаем деплой..."
echo ""

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/opt/arenda-neba"

# Переход в директорию проекта
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    cd "$SCRIPT_DIR"
fi

echo "📂 Рабочая директория: $(pwd)"

# Получение последних изменений из Git
echo "📥 Получаем последние изменения из Git..."

# Отменяем любые незавершенные операции merge/rebase
git merge --abort 2>/dev/null || true
git rebase --abort 2>/dev/null || true

# Удаляем конфликтующие тестовые файлы
rm -f test.txt
git rm --cached test.txt 2>/dev/null || true

# Сохраняем локальные изменения (если есть) перед сбросом
git stash 2>/dev/null || true

# Сбрасываем все локальные изменения
git reset --hard HEAD 2>/dev/null || true

# ============================================
# КРИТИЧЕСКИ ВАЖНО: Защита базы данных и uploads
# ============================================

# 1. Создаем резервную копию базы данных ПЕРЕД любыми операциями git
BACKUP_DB_FILE=""
if [ -f "database.db" ]; then
    echo "💾 Создаем резервную копию базы данных перед деплоем..."
    BACKUP_DB_FILE="database_backup_$(date +%Y%m%d_%H%M%S).db"
    # Используем безопасное копирование SQLite
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "database.db" ".backup '$BACKUP_DB_FILE'" 2>/dev/null || cp "database.db" "$BACKUP_DB_FILE"
    else
        cp "database.db" "$BACKUP_DB_FILE" 2>/dev/null || true
    fi
    if [ -f "$BACKUP_DB_FILE" ]; then
        DB_SIZE=$(du -h "$BACKUP_DB_FILE" 2>/dev/null | cut -f1 || echo "unknown")
        echo "✅ Резервная копия БД создана: $BACKUP_DB_FILE ($DB_SIZE)"
    else
        echo "⚠️  Не удалось создать резервную копию БД"
    fi
fi

# 2. Временно переименовываем базу данных, чтобы git не удалил её
DEPLOY_TS=$(date +%s)
if [ -f "database.db" ]; then
    echo "🔒 Защищаем базу данных от удаления..."
    DB_TEMP_NAME="database_temp_${DEPLOY_TS}.db"
    mv database.db "$DB_TEMP_NAME" 2>/dev/null || true
    [ -f "database.db-shm" ] && mv database.db-shm "database_temp_${DEPLOY_TS}.db-shm" 2>/dev/null || true
    [ -f "database.db-wal" ] && mv database.db-wal "database_temp_${DEPLOY_TS}.db-wal" 2>/dev/null || true
fi

# 3. uploads/ в .gitignore — git clean -fd его НЕ трогает.
#    Просто проверяем что папка на месте, без переименования.
if [ -d "uploads" ]; then
    UPLOADS_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
    echo "✅ Папка uploads на месте ($UPLOADS_COUNT файлов), пропускаем — защищена .gitignore"
fi

# Получаем последние изменения с удаленного репозитория
git fetch origin

# Принудительно синхронизируемся с удаленной веткой
git reset --hard origin/main

# Очищаем неотслеживаемые файлы (база и uploads уже защищены переименованием)
echo "🧹 Очищаем неотслеживаемые файлы..."
git clean -fd

# ============================================
# Восстановление базы данных и uploads
# ============================================

# 1. Восстанавливаем базу данных
if [ -n "$DB_TEMP_NAME" ] && [ -f "$DB_TEMP_NAME" ]; then
    echo "📊 Восстанавливаем базу данных..."
    mv "$DB_TEMP_NAME" database.db 2>/dev/null || true
    # Восстанавливаем файлы журнала SQLite
    ls database_temp_*.db-shm 2>/dev/null | head -1 | xargs -I {} mv {} database.db-shm 2>/dev/null || true
    ls database_temp_*.db-wal 2>/dev/null | head -1 | xargs -I {} mv {} database.db-wal 2>/dev/null || true
    
    if [ -f "database.db" ]; then
        DB_SIZE=$(du -h database.db 2>/dev/null | cut -f1 || echo "unknown")
        echo "✅ База данных восстановлена ($DB_SIZE)"
    else
        echo "⚠️  База данных не найдена после восстановления"
    fi
elif [ ! -f "database.db" ]; then
    echo "📊 База данных не найдена, восстанавливаем из резервной копии..."
    if [ -n "$BACKUP_DB_FILE" ] && [ -f "$BACKUP_DB_FILE" ]; then
        cp "$BACKUP_DB_FILE" database.db 2>/dev/null || true
        if [ -f "database.db" ]; then
            echo "✅ База данных восстановлена из резервной копии: $BACKUP_DB_FILE"
        else
            echo "❌ ОШИБКА: Не удалось восстановить базу данных!"
        fi
    else
        echo "⚠️  Резервная копия базы данных не найдена. Создаем новую базу..."
        # База будет создана автоматически при первом запуске сервера
    fi
else
    echo "✅ База данных существует"
fi

# 2. Проверяем uploads после git операций
if [ ! -d "uploads" ]; then
    echo "📁 Создаем папку uploads..."
    mkdir -p uploads
fi
UPLOADS_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
echo "✅ Папка uploads: $UPLOADS_COUNT файлов"
chmod 755 uploads

# Очищаем старые резервные копии (старше 7 дней)
echo "🧹 Очищаем старые резервные копии..."
find . -maxdepth 1 -name "database_backup_*.db" -mtime +7 -delete 2>/dev/null || true
find . -maxdepth 1 -name "database_temp_*.db*" -mtime +1 -delete 2>/dev/null || true

# Установка зависимостей
echo "📦 Устанавливаем зависимости..."

# Если node_modules существует, удаляем его для пересборки нативных модулей
# Это важно для модулей типа sqlite3, которые должны быть скомпилированы для Linux
if [ -d "node_modules" ]; then
    echo "🗑️  Удаляем старые node_modules для пересборки нативных модулей..."
    rm -rf node_modules
fi

# Устанавливаем зависимости (нативные модули скомпилируются для Linux)
npm install

# Пересобираем sqlite3 на всякий случай
echo "🔨 Пересобираем нативные модули..."
# Удаляем старый sqlite3 перед пересборкой, чтобы избежать ошибки "invalid ELF header"
if [ -d "node_modules/sqlite3" ]; then
    echo "   Удаляем старый sqlite3..."
    rm -rf node_modules/sqlite3
fi
# Пересобираем sqlite3 из исходников для текущей архитектуры
npm install sqlite3 --build-from-source 2>/dev/null || npm rebuild sqlite3 2>/dev/null || true

# Оптимизируем PNG файлы в uploads (конвертируем в WebP)
echo "🖼️  Оптимизируем изображения в uploads..."
if [ -f "optimize-uploads.js" ]; then
    node optimize-uploads.js
    echo "✅ Изображения оптимизированы"
fi

# Исправляем пути к изображениям в базе данных
echo "📝 Исправляем пути к изображениям в БД..."
if [ -f "fix-image-paths.js" ]; then
    node fix-image-paths.js
    echo "✅ Пути исправлены"
fi

# Регенерируем страницы оборудования
echo "🔄 Регенерируем страницы оборудования..."
if [ -f "generate-pages.js" ]; then
    node generate-pages.js
    echo "✅ Страницы обновлены"
fi

# Обновление характеристик (если скрипт существует)
if [ -f "update-specs.js" ]; then
    echo "🔧 Обновляем технические характеристики..."
    node update-specs.js
fi

# Перезапуск приложения через PM2
echo "🔄 Перезапускаем приложение..."
pm2 restart arenda-neba

# Проверка статуса
echo ""
echo "✅ Деплой завершен!"
echo ""
echo "Статус приложения:"
pm2 status arenda-neba

echo ""
echo "Последние логи:"
pm2 logs arenda-neba --lines 10 --nostream


