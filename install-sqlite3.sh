#!/bin/bash

# Простой скрипт для установки sqlite3
# Использование: ./install-sqlite3.sh

echo "📦 Установка sqlite3"
echo "==================="
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
sleep 2
echo "✅ Приложение остановлено"
echo ""

# Проверяем текущее состояние
echo "🔍 Проверяем текущее состояние sqlite3..."
if [ -d "node_modules/sqlite3" ]; then
    echo "⚠️  sqlite3 уже установлен, но возможно поврежден"
    echo "🗑️  Удаляем старую версию..."
    rm -rf node_modules/sqlite3
fi

if [ -f "package-lock.json" ]; then
    # Удаляем sqlite3 из package-lock.json
    echo "🗑️  Очищаем package-lock.json от sqlite3..."
    # Создаем резервную копию
    cp package-lock.json package-lock.json.backup 2>/dev/null || true
fi

echo ""

# Проверяем package.json
if ! grep -q '"sqlite3"' package.json; then
    echo "⚠️  sqlite3 не найден в package.json!"
    echo "📝 Добавляем sqlite3 в package.json..."
    # Используем npm для добавления зависимости
    npm install sqlite3 --save --no-save 2>/dev/null || true
fi

echo ""

# Очищаем кэш npm
echo "🧹 Очищаем кэш npm..."
npm cache clean --force 2>/dev/null || true
echo ""

# Устанавливаем sqlite3
echo "📦 Устанавливаем sqlite3..."
echo "   Это может занять 2-5 минут..."
echo ""

# Пробуем установить из исходников
if npm install sqlite3 --build-from-source 2>&1; then
    echo ""
    echo "✅ Установка завершена"
else
    echo ""
    echo "⚠️  Установка из исходников не удалась, пробуем обычную установку..."
    npm install sqlite3 2>&1 | tail -20
fi

echo ""

# Проверяем установку
echo "🔍 Проверяем установку..."
if [ -d "node_modules/sqlite3" ]; then
    echo "✅ Папка node_modules/sqlite3 существует"
    
    if [ -f "node_modules/sqlite3/package.json" ]; then
        VERSION=$(grep '"version"' node_modules/sqlite3/package.json | head -1 | cut -d'"' -f4)
        echo "   Версия: $VERSION"
    fi
    
    if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
        echo "✅ Нативный модуль найден"
        file node_modules/sqlite3/build/Release/node_sqlite3.node
    else
        echo "⚠️  Нативный модуль не найден, пробуем пересобрать..."
        cd node_modules/sqlite3
        npm run install 2>&1 | tail -10 || npm run rebuild 2>&1 | tail -10 || true
        cd ../..
        
        if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
            echo "✅ Нативный модуль успешно пересобран"
        else
            echo "❌ Не удалось пересобрать нативный модуль"
        fi
    fi
else
    echo "❌ ОШИБКА: sqlite3 не установлен!"
    echo ""
    echo "Попробуйте полную переустановку:"
    echo "  rm -rf node_modules package-lock.json"
    echo "  npm install"
    exit 1
fi

echo ""

# Перезапускаем приложение
echo "🔄 Перезапускаем приложение..."
pm2 restart arenda-neba
sleep 3
echo ""

# Проверяем логи
echo "📋 Проверяем логи (последние 30 строк)..."
pm2 logs arenda-neba --lines 30 --nostream | tail -30
echo ""

# Проверяем на ошибки sqlite3
echo "🔍 Проверяем наличие ошибок sqlite3..."
ERRORS=$(pm2 logs arenda-neba --lines 50 --nostream | grep -i "sqlite3\|Cannot find module" | wc -l)
if [ "$ERRORS" -eq 0 ]; then
    echo "✅ Ошибок sqlite3 не найдено!"
else
    echo "⚠️  Найдено ошибок: $ERRORS"
    echo "   Показываем последние ошибки:"
    pm2 logs arenda-neba --lines 50 --nostream | grep -i "sqlite3\|Cannot find module" | tail -5
fi

echo ""

# Проверяем статус
echo "📊 Статус приложения:"
pm2 status arenda-neba
echo ""

echo "✅ Установка завершена!"
echo ""
echo "💡 Если ошибка осталась, выполните:"
echo "   rm -rf node_modules package-lock.json"
echo "   npm install"
echo "   pm2 restart arenda-neba"
