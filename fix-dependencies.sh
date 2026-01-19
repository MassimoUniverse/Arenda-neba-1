#!/bin/bash

# Скрипт для исправления проблем с зависимостями
# Использование: ./fix-dependencies.sh

echo "🔧 ИСПРАВЛЕНИЕ ЗАВИСИМОСТЕЙ"
echo "============================"
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/opt/arenda-neba"

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

# Проверяем package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json не найден!${NC}"
    exit 1
fi

echo "📦 Проверяем зависимости..."
echo ""

# Удаляем node_modules и package-lock.json для чистой переустановки
echo "🗑️  Удаляем старые зависимости..."
rm -rf node_modules
rm -f package-lock.json
echo "✅ Старые зависимости удалены"
echo ""

# Очищаем кэш npm
echo "🧹 Очищаем кэш npm..."
npm cache clean --force 2>/dev/null || true
echo "✅ Кэш очищен"
echo ""

# Устанавливаем зависимости заново
echo "📦 Устанавливаем зависимости..."
echo "   Это может занять 2-5 минут..."
echo ""

if npm install 2>&1 | tee /tmp/npm-install.log; then
    echo ""
    echo -e "${GREEN}✅ Зависимости установлены${NC}"
else
    echo ""
    echo -e "${RED}❌ Ошибка при установке зависимостей${NC}"
    echo "   Проверьте логи: cat /tmp/npm-install.log"
    exit 1
fi

echo ""

# Проверяем критичные модули
echo "🔍 Проверяем критичные модули..."
CRITICAL_MODULES=("express" "sqlite3" "multer" "sharp" "bcryptjs")
ALL_OK=true

for module in "${CRITICAL_MODULES[@]}"; do
    if [ -d "node_modules/$module" ]; then
        echo -e "   ${GREEN}✅ $module${NC}"
        
        # Для sqlite3 проверяем нативный модуль
        if [ "$module" = "sqlite3" ]; then
            if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
                echo -e "      ${GREEN}✅ Нативный модуль скомпилирован${NC}"
            else
                echo -e "      ${YELLOW}⚠️  Нативный модуль не найден, пересобираем...${NC}"
                cd node_modules/sqlite3
                npm run install 2>/dev/null || npm run rebuild 2>/dev/null || true
                cd ../..
                
                if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
                    echo -e "      ${GREEN}✅ Нативный модуль успешно пересобран${NC}"
                else
                    echo -e "      ${RED}❌ Не удалось пересобрать нативный модуль${NC}"
                    ALL_OK=false
                fi
            fi
        fi
    else
        echo -e "   ${RED}❌ $module НЕ установлен${NC}"
        ALL_OK=false
    fi
done

echo ""

if [ "$ALL_OK" = false ]; then
    echo -e "${RED}❌ Не все модули установлены корректно${NC}"
    echo "   Попробуйте: npm install --force"
    exit 1
fi

# Проверяем, что express доступен
echo "🔍 Проверяем доступность express..."
if node -e "require('express')" 2>/dev/null; then
    echo -e "${GREEN}✅ Express доступен из Node.js${NC}"
else
    echo -e "${RED}❌ Express НЕ доступен из Node.js${NC}"
    echo "   Проблема с путями или установкой"
    exit 1
fi

echo ""

# Удаляем старое приложение из PM2 (если есть)
echo "🗑️  Удаляем старое приложение из PM2..."
pm2 delete arenda-neba 2>/dev/null || true
sleep 2
echo "✅ Старое приложение удалено"
echo ""

# Убеждаемся, что мы в правильной директории
CURRENT_DIR=$(pwd)
echo "📂 Текущая директория: $CURRENT_DIR"

# Проверяем, что server.js существует
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ server.js не найден в текущей директории!${NC}"
    exit 1
fi

# Проверяем, что node_modules существует
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules не найден!${NC}"
    exit 1
fi

# Проверяем, что express установлен
if [ ! -d "node_modules/express" ]; then
    echo -e "${RED}❌ express не найден в node_modules!${NC}"
    echo "   Попробуйте: npm install express"
    exit 1
fi

echo -e "${GREEN}✅ Все файлы на месте${NC}"
echo ""

# Запускаем приложение с правильной рабочей директорией
echo "🔄 Запускаем приложение с правильной рабочей директорией..."
pm2 start server.js --name arenda-neba --cwd "$CURRENT_DIR"
pm2 save
sleep 5
echo ""

# Проверяем статус
echo "📊 Статус приложения:"
pm2 status arenda-neba
echo ""

# Проверяем рабочую директорию PM2
echo "📂 Рабочая директория PM2:"
pm2 info arenda-neba 2>/dev/null | grep "cwd" || echo "   (не удалось получить)"
echo ""

# Проверяем логи на ошибки
echo "📋 Проверяем логи (последние 30 строк)..."
pm2 logs arenda-neba --lines 30 --nostream | tail -30
echo ""

# Проверяем на ошибки модулей
ERROR_COUNT=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "Cannot find module|MODULE_NOT_FOUND" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ Ошибок модулей не найдено!${NC}"
    echo ""
    echo -e "${GREEN}✅ ВСЁ ИСПРАВЛЕНО!${NC}"
    echo ""
    echo "💡 Проверьте работу приложения:"
    echo "   curl http://localhost:3000"
    echo "   pm2 logs arenda-neba --lines 50"
else
    echo -e "${RED}❌ Найдено ошибок модулей: $ERROR_COUNT${NC}"
    echo "   Последние ошибки:"
    pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "Cannot find module|MODULE_NOT_FOUND" | tail -5
    echo ""
    echo -e "${YELLOW}💡 Проблема может быть в рабочей директории PM2${NC}"
    echo "   Попробуйте вручную:"
    echo "   1. pm2 delete arenda-neba"
    echo "   2. cd /opt/arenda-neba"
    echo "   3. pm2 start server.js --name arenda-neba --cwd /opt/arenda-neba"
    echo "   4. pm2 save"
    echo ""
    echo "   Или проверьте:"
    echo "   - pm2 info arenda-neba | grep cwd"
    echo "   - ls -la /opt/arenda-neba/node_modules/express"
fi

echo ""
echo "✅ Скрипт завершен"
