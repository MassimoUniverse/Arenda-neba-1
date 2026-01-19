#!/bin/bash

# Скрипт для исправления проблемы с express в PM2
# Использование: ./fix-pm2-express.sh

echo "🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С EXPRESS В PM2"
echo "======================================="
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Определяем директорию проекта
PROJECT_DIR="/opt/arenda-neba"
cd "$PROJECT_DIR" || exit 1

echo "📂 Рабочая директория: $(pwd)"
echo ""

# 1. Проверяем, что express установлен
echo "1️⃣  Проверяем установку express..."
if [ -d "node_modules/express" ]; then
    echo -e "${GREEN}✅ express найден в node_modules${NC}"
    EXPRESS_PATH=$(readlink -f node_modules/express || realpath node_modules/express || echo "node_modules/express")
    echo "   Путь: $EXPRESS_PATH"
else
    echo -e "${RED}❌ express НЕ найден в node_modules!${NC}"
    echo "   Устанавливаем express..."
    npm install express
    if [ ! -d "node_modules/express" ]; then
        echo -e "${RED}❌ Не удалось установить express${NC}"
        exit 1
    fi
fi
echo ""

# 2. Проверяем, что express доступен из Node.js
echo "2️⃣  Проверяем доступность express из Node.js..."
if node -e "const express = require('express'); console.log('OK:', express);" 2>/dev/null; then
    echo -e "${GREEN}✅ express доступен из Node.js${NC}"
else
    echo -e "${RED}❌ express НЕ доступен из Node.js!${NC}"
    echo "   Проблема с путями или установкой"
    exit 1
fi
echo ""

# 3. Останавливаем и удаляем старое приложение
echo "3️⃣  Удаляем старое приложение из PM2..."
pm2 stop arenda-neba 2>/dev/null || true
pm2 delete arenda-neba 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Старое приложение удалено${NC}"
echo ""

# 4. Проверяем, что server.js существует
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ server.js не найден!${NC}"
    exit 1
fi

# 5. Проверяем рабочую директорию
CURRENT_DIR=$(pwd)
echo "4️⃣  Текущая директория: $CURRENT_DIR"
echo "   Проверяем файлы:"
echo "   - server.js: $([ -f server.js ] && echo '✅' || echo '❌')"
echo "   - package.json: $([ -f package.json ] && echo '✅' || echo '❌')"
echo "   - node_modules: $([ -d node_modules ] && echo '✅' || echo '❌')"
echo "   - node_modules/express: $([ -d node_modules/express ] && echo '✅' || echo '❌')"
echo ""

# 6. Запускаем приложение с явным указанием всех параметров
echo "5️⃣  Запускаем приложение с правильными параметрами..."
echo "   Команда: pm2 start server.js --name arenda-neba --cwd \"$CURRENT_DIR\""

# Удаляем старый процесс, если есть
pm2 delete arenda-neba 2>/dev/null || true

# Запускаем с явным указанием рабочей директории и переменных окружения
pm2 start server.js \
    --name arenda-neba \
    --cwd "$CURRENT_DIR" \
    --interpreter node \
    --merge-logs \
    --log-date-format "YYYY-MM-DD HH:mm:ss Z"

# Сохраняем конфигурацию
pm2 save

sleep 5
echo ""

# 7. Проверяем статус
echo "6️⃣  Проверяем статус приложения..."
pm2 status arenda-neba
echo ""

# 8. Проверяем рабочую директорию PM2
echo "7️⃣  Проверяем рабочую директорию PM2..."
PM2_CWD=$(pm2 jlist 2>/dev/null | grep -A 50 '"name":"arenda-neba"' | grep '"cwd"' | head -1 | cut -d'"' -f4 || echo "")
if [ -n "$PM2_CWD" ]; then
    echo "   Рабочая директория PM2: $PM2_CWD"
    if [ "$PM2_CWD" = "$CURRENT_DIR" ]; then
        echo -e "${GREEN}✅ Рабочая директория правильная${NC}"
    else
        echo -e "${YELLOW}⚠️  Рабочая директория отличается!${NC}"
        echo "   Ожидалось: $CURRENT_DIR"
        echo "   Получено: $PM2_CWD"
    fi
else
    echo -e "${YELLOW}⚠️  Не удалось получить рабочую директорию${NC}"
fi
echo ""

# 9. Проверяем логи на ошибки
echo "8️⃣  Проверяем логи (последние 30 строк)..."
sleep 2
pm2 logs arenda-neba --lines 30 --nostream 2>&1 | tail -30
echo ""

# 10. Проверяем на ошибки модулей
echo "9️⃣  Проверяем на ошибки модулей..."
ERROR_COUNT=$(pm2 logs arenda-neba --lines 100 --nostream 2>&1 | grep -iE "Cannot find module.*express|MODULE_NOT_FOUND.*express" | wc -l)

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ Ошибок express не найдено!${NC}"
    echo ""
    echo -e "${GREEN}✅ ВСЁ ИСПРАВЛЕНО!${NC}"
    echo ""
    echo "💡 Проверьте работу приложения:"
    echo "   curl http://localhost:3000"
    echo "   pm2 logs arenda-neba --lines 50"
else
    echo -e "${RED}❌ Найдено ошибок express: $ERROR_COUNT${NC}"
    echo "   Последние ошибки:"
    pm2 logs arenda-neba --lines 100 --nostream 2>&1 | grep -iE "Cannot find module.*express|MODULE_NOT_FOUND.*express" | tail -5
    echo ""
    echo -e "${YELLOW}💡 Попробуйте альтернативный способ:${NC}"
    echo ""
    echo "   # Вариант 1: Запуск через npm"
    echo "   pm2 delete arenda-neba"
    echo "   pm2 start npm --name arenda-neba -- start"
    echo "   pm2 save"
    echo ""
    echo "   # Вариант 2: Запуск с полным путем"
    echo "   pm2 delete arenda-neba"
    echo "   cd $CURRENT_DIR"
    echo "   NODE_PATH=$CURRENT_DIR/node_modules pm2 start server.js --name arenda-neba"
    echo "   pm2 save"
    echo ""
    echo "   # Вариант 3: Проверка путей"
    echo "   echo \$NODE_PATH"
    echo "   ls -la $CURRENT_DIR/node_modules/express"
    echo "   node -e \"console.log(require.resolve('express'))\""
fi

echo ""
echo "✅ Скрипт завершен"
