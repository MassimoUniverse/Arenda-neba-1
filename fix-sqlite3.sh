#!/bin/bash

# Скрипт для исправления ошибки sqlite3 "invalid ELF header"
# Использование: ./fix-sqlite3.sh

echo "🔧 Исправление ошибки sqlite3 'invalid ELF header'"
echo "=================================================="
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
echo ""

# Останавливаем приложение
echo "⏸️  Останавливаем приложение..."
pm2 stop arenda-neba 2>/dev/null || true
echo "✅ Приложение остановлено"
echo ""

# Удаляем старый модуль sqlite3 и связанные файлы
echo "🗑️  Удаляем старый модуль sqlite3..."
if [ -d "node_modules/sqlite3" ]; then
    rm -rf node_modules/sqlite3
    echo "✅ Старый модуль удален"
else
    echo "⚠️  Модуль sqlite3 не найден в node_modules"
fi

# Также удаляем из package-lock.json, если есть проблемы
if [ -f "package-lock.json" ]; then
    echo "🗑️  Очищаем package-lock.json от sqlite3..."
    # Создаем резервную копию
    cp package-lock.json package-lock.json.backup 2>/dev/null || true
fi
echo ""

# Пересобираем sqlite3 для текущей архитектуры
echo "🔨 Пересобираем sqlite3 для текущей архитектуры..."
echo "   Архитектура: $(uname -m)"
echo "   ОС: $(uname -s)"
echo "   Node.js версия: $(node --version 2>/dev/null || echo 'не найдена')"
echo "   npm версия: $(npm --version 2>/dev/null || echo 'не найдена')"
echo ""

# Устанавливаем зависимости для сборки нативных модулей
if command -v apt-get &> /dev/null; then
    echo "📦 Проверяем зависимости для сборки..."
    if ! command -v python3 &> /dev/null || ! command -v make &> /dev/null || ! command -v g++ &> /dev/null; then
        echo "   Устанавливаем build-essential и python3..."
        apt-get update -qq
        apt-get install -y -qq build-essential python3 2>/dev/null || true
    else
        echo "   ✅ Все зависимости для сборки установлены"
    fi
fi
echo ""

# Очищаем кэш npm
echo "🧹 Очищаем кэш npm..."
npm cache clean --force 2>/dev/null || true
echo ""

# Устанавливаем sqlite3 заново из исходников
echo "📦 Устанавливаем sqlite3 из исходников..."
echo "   Это может занять несколько минут..."
if npm install sqlite3 --build-from-source 2>&1 | tee /tmp/sqlite3-install.log; then
    echo "✅ Установка sqlite3 завершена"
else
    echo "⚠️  Первая попытка установки не удалась, пробуем альтернативный метод..."
    echo "📦 Переустанавливаем sqlite3 без --build-from-source..."
    npm install sqlite3 2>&1 | tail -10
fi
echo ""

# Проверяем установку sqlite3
echo "🔍 Проверяем установку sqlite3..."
if [ -d "node_modules/sqlite3" ]; then
    echo "✅ Папка node_modules/sqlite3 существует"
    
    if [ -f "node_modules/sqlite3/package.json" ]; then
        echo "✅ package.json найден"
        SQLITE3_VERSION=$(grep '"version"' node_modules/sqlite3/package.json | head -1 | cut -d'"' -f4)
        echo "   Версия: $SQLITE3_VERSION"
    fi
    
    if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
        echo "✅ Нативный модуль найден: node_modules/sqlite3/build/Release/node_sqlite3.node"
        file node_modules/sqlite3/build/Release/node_sqlite3.node
    else
        echo "⚠️  Нативный модуль не найден, но папка существует"
        echo "   Попробуем пересобрать..."
        cd node_modules/sqlite3
        npm run install 2>&1 | tail -10 || npm run rebuild 2>&1 | tail -10 || true
        cd ../..
    fi
else
    echo "❌ Папка node_modules/sqlite3 НЕ существует!"
    echo "📦 Пробуем полную переустановку node_modules..."
    rm -rf node_modules package-lock.json
    npm install
    echo ""
fi
echo ""

# Финальная проверка
if [ ! -d "node_modules/sqlite3" ]; then
    echo "❌ КРИТИЧЕСКАЯ ОШИБКА: sqlite3 не установлен!"
    echo ""
    echo "Попробуйте вручную:"
    echo "  rm -rf node_modules package-lock.json"
    echo "  npm install"
    exit 1
fi

# Проверяем установку
if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
    echo "✅ sqlite3 успешно установлен"
    echo "   Путь: node_modules/sqlite3/build/Release/node_sqlite3.node"
    
    # Проверяем тип файла
    file node_modules/sqlite3/build/Release/node_sqlite3.node
    echo ""
else
    echo "❌ Ошибка: sqlite3 не установлен!"
    exit 1
fi

# Перезапускаем приложение
echo "🔄 Перезапускаем приложение..."
pm2 restart arenda-neba
echo ""

# Ждем немного и проверяем логи
sleep 3
echo "📋 Проверяем логи (последние 20 строк)..."
pm2 logs arenda-neba --lines 20 --nostream | tail -20
echo ""

# Проверяем статус
echo "📊 Статус приложения:"
pm2 status arenda-neba
echo ""

echo "✅ Исправление завершено!"
echo ""
echo "💡 Если ошибка осталась, попробуйте:"
echo "   1. Полностью переустановить node_modules:"
echo "      rm -rf node_modules package-lock.json"
echo "      npm install"
echo "   2. Проверить версию Node.js:"
echo "      node --version"
echo "   3. Убедиться, что архитектура совместима"
