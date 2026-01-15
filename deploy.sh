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
if [ -d "uploads" ] && [ "$(ls -A uploads 2>/dev/null)" ]; then
    echo "💾 Создаем резервную копию uploads перед деплоем..."
    BACKUP_UPLOADS_DIR="uploads_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r uploads "$BACKUP_UPLOADS_DIR" 2>/dev/null || true
    echo "✅ Резервная копия создана: $BACKUP_UPLOADS_DIR"
fi

# Очищаем неотслеживаемые файлы (кроме uploads/ и database.db)
git clean -fd --exclude=uploads/ --exclude=database.db --exclude=database.db.backup

# Получаем последние изменения с удаленного репозитория
git fetch origin

# Принудительно синхронизируемся с удаленной веткой
git reset --hard origin/main

# Очищаем неотслеживаемые файлы еще раз (кроме uploads/ и database.db)
git clean -fd --exclude=uploads/ --exclude=database.db --exclude=database.db.backup

# ВАЖНО: Убеждаемся, что папка uploads существует и имеет правильные права
if [ ! -d "uploads" ]; then
    echo "📁 Создаем папку uploads..."
    mkdir -p uploads
    chmod 755 uploads
    echo "✅ Папка uploads создана"
else
    echo "✅ Папка uploads существует"
    # Восстанавливаем файлы из резервной копии, если они были удалены
    if [ -d "$BACKUP_UPLOADS_DIR" ] && [ "$(ls -A uploads 2>/dev/null | wc -l)" -eq 0 ]; then
        echo "🔄 Восстанавливаем файлы из резервной копии..."
        cp -r "$BACKUP_UPLOADS_DIR"/* uploads/ 2>/dev/null || true
        echo "✅ Файлы восстановлены"
    fi
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
npm rebuild sqlite3 2>/dev/null || true

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


