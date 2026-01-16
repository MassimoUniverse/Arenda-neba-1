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

# ВАЖНО: Создаем резервную копию uploads перед деплоем
BACKUP_UPLOADS_DIR=""
if [ -d "uploads" ] && [ "$(ls -A uploads 2>/dev/null)" ]; then
    echo "💾 Создаем резервную копию uploads перед деплоем..."
    BACKUP_UPLOADS_DIR="uploads_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r uploads "$BACKUP_UPLOADS_DIR" 2>/dev/null || true
    echo "✅ Резервная копия создана: $BACKUP_UPLOADS_DIR"
    echo "   Файлов в резервной копии: $(find "$BACKUP_UPLOADS_DIR" -type f | wc -l)"
fi

# ВАЖНО: Временно переименовываем uploads, чтобы git clean не удалил его
if [ -d "uploads" ]; then
    echo "🔒 Защищаем папку uploads от удаления..."
    mv uploads "uploads_temp_$(date +%s)" 2>/dev/null || true
    UPLOADS_TEMP_NAME=$(ls -d uploads_temp_* 2>/dev/null | head -1)
fi

# Получаем последние изменения с удаленного репозитория
git fetch origin

# Принудительно синхронизируемся с удаленной веткой
git reset --hard origin/main

# Очищаем неотслеживаемые файлы (uploads уже защищен переименованием)
echo "🧹 Очищаем неотслеживаемые файлы..."
git clean -fd

# ВАЖНО: Восстанавливаем папку uploads
if [ -n "$UPLOADS_TEMP_NAME" ] && [ -d "$UPLOADS_TEMP_NAME" ]; then
    echo "📁 Восстанавливаем папку uploads..."
    mv "$UPLOADS_TEMP_NAME" uploads 2>/dev/null || true
    echo "✅ Папка uploads восстановлена"
    echo "   Файлов в uploads: $(find uploads -type f 2>/dev/null | wc -l)"
elif [ ! -d "uploads" ]; then
    echo "📁 Создаем папку uploads..."
    mkdir -p uploads
    echo "✅ Папка uploads создана"
    
    # Восстанавливаем файлы из резервной копии, если она есть
    if [ -n "$BACKUP_UPLOADS_DIR" ] && [ -d "$BACKUP_UPLOADS_DIR" ]; then
        echo "🔄 Восстанавливаем файлы из резервной копии..."
        cp -r "$BACKUP_UPLOADS_DIR"/* uploads/ 2>/dev/null || true
        echo "✅ Файлы восстановлены из резервной копии"
        echo "   Файлов восстановлено: $(find uploads -type f 2>/dev/null | wc -l)"
    fi
else
    echo "✅ Папка uploads существует"
    echo "   Файлов в uploads: $(find uploads -type f 2>/dev/null | wc -l)"
fi

# Устанавливаем правильные права на папку uploads
chmod 755 uploads
echo "✅ Права доступа установлены для uploads"

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


