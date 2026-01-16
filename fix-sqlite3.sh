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

# Удаляем старый модуль sqlite3
echo "🗑️  Удаляем старый модуль sqlite3..."
if [ -d "node_modules/sqlite3" ]; then
    rm -rf node_modules/sqlite3
    echo "✅ Старый модуль удален"
else
    echo "⚠️  Модуль sqlite3 не найден в node_modules"
fi
echo ""

# Пересобираем sqlite3 для текущей архитектуры
echo "🔨 Пересобираем sqlite3 для текущей архитектуры..."
echo "   Архитектура: $(uname -m)"
echo "   ОС: $(uname -s)"
echo ""

# Устанавливаем зависимости для сборки нативных модулей
if command -v apt-get &> /dev/null; then
    echo "📦 Устанавливаем зависимости для сборки..."
    apt-get update -qq
    apt-get install -y -qq build-essential python3 2>/dev/null || true
fi

# Устанавливаем sqlite3 заново
echo "📦 Устанавливаем sqlite3..."
npm install sqlite3 --build-from-source
echo ""

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
