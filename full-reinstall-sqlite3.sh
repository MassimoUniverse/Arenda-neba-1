#!/bin/bash

# Полная переустановка sqlite3 с очисткой всего
# Использование: ./full-reinstall-sqlite3.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔧 ПОЛНАЯ ПЕРЕУСТАНОВКА SQLITE3${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd /opt/arenda-neba || exit 1

# 1. Остановка приложения
echo -e "${YELLOW}1️⃣  ОСТАНОВКА ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
pm2 stop arenda-neba 2>/dev/null || true
pm2 stop webhook-handler 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Приложения остановлены${NC}"
echo ""

# 2. Удаление всех модулей
echo -e "${YELLOW}2️⃣  УДАЛЕНИЕ ВСЕХ МОДУЛЕЙ${NC}"
echo "----------------------------------------"
echo "🗑️  Удаляем node_modules и package-lock.json..."
rm -rf node_modules
rm -f package-lock.json
echo -e "${GREEN}✅ Все модули удалены${NC}"
echo ""

# 3. Очистка кэша
echo -e "${YELLOW}3️⃣  ОЧИСТКА КЭША${NC}"
echo "----------------------------------------"
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}✅ Кэш очищен${NC}"
echo ""

# 4. Проверка зависимостей для сборки
echo -e "${YELLOW}4️⃣  ПРОВЕРКА ЗАВИСИМОСТЕЙ ДЛЯ СБОРКИ${NC}"
echo "----------------------------------------"
if command -v apt-get &> /dev/null; then
    echo "Проверяем build-essential и python3..."
    if ! dpkg -l | grep -q build-essential || ! command -v python3 &> /dev/null; then
        echo "Устанавливаем build-essential и python3..."
        apt-get update -qq
        apt-get install -y -qq build-essential python3 2>/dev/null || true
    else
        echo -e "${GREEN}✅ Все зависимости установлены${NC}"
    fi
fi
echo ""

# 5. Установка всех зависимостей
echo -e "${YELLOW}5️⃣  УСТАНОВКА ВСЕХ ЗАВИСИМОСТЕЙ${NC}"
echo "----------------------------------------"
echo "📦 Устанавливаем все зависимости из package.json..."
echo "   Это может занять 3-5 минут..."
echo ""
npm install 2>&1 | tee /tmp/npm-install.log
echo ""

# Проверка установки
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ ОШИБКА: node_modules не создан!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Все зависимости установлены${NC}"
echo ""

# 6. Проверка sqlite3
echo -e "${YELLOW}6️⃣  ПРОВЕРКА SQLITE3${NC}"
echo "----------------------------------------"
if [ -d "node_modules/sqlite3" ]; then
    echo -e "${GREEN}✅ sqlite3 найден в node_modules${NC}"
    
    if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
        echo -e "${GREEN}✅ Нативный модуль sqlite3 найден${NC}"
        file node_modules/sqlite3/build/Release/node_sqlite3.node
    else
        echo -e "${YELLOW}⚠️  Нативный модуль не найден, пересобираем...${NC}"
        cd node_modules/sqlite3
        npm run install 2>&1 | tail -20 || npm run rebuild 2>&1 | tail -20 || true
        cd ../..
    fi
else
    echo -e "${RED}❌ sqlite3 не найден! Устанавливаем отдельно...${NC}"
    npm install sqlite3 --build-from-source 2>&1 | tail -20
fi
echo ""

# 7. Финальная проверка sqlite3
echo -e "${YELLOW}7️⃣  ФИНАЛЬНАЯ ПРОВЕРКА SQLITE3${NC}"
echo "----------------------------------------"
if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
    echo -e "${GREEN}✅ Нативный модуль sqlite3 существует${NC}"
    file node_modules/sqlite3/build/Release/node_sqlite3.node
    echo ""
    
    # Тест загрузки модуля
    echo "Тестируем загрузку модуля..."
    if node -e "require('sqlite3'); console.log('✅ sqlite3 загружен успешно');" 2>&1; then
        echo -e "${GREEN}✅ Модуль sqlite3 загружается без ошибок!${NC}"
    else
        echo -e "${RED}❌ Ошибка при загрузке модуля sqlite3!${NC}"
        echo "Пробуем пересобрать..."
        cd node_modules/sqlite3
        npm run rebuild 2>&1 | tail -20
        cd ../..
    fi
else
    echo -e "${RED}❌ КРИТИЧЕСКАЯ ОШИБКА: Нативный модуль sqlite3 не найден!${NC}"
    echo ""
    echo "Пробуем принудительную пересборку..."
    rm -rf node_modules/sqlite3
    npm install sqlite3 --build-from-source 2>&1 | tail -30
fi
echo ""

# 8. Перезапуск приложения
echo -e "${YELLOW}8️⃣  ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
pm2 restart arenda-neba 2>/dev/null || pm2 start ecosystem.config.js
pm2 restart webhook-handler 2>/dev/null || true
pm2 save
sleep 5
echo ""

# 9. Проверка логов
echo -e "${YELLOW}9️⃣  ПРОВЕРКА ЛОГОВ${NC}"
echo "----------------------------------------"
echo "Последние 30 строк логов:"
pm2 logs arenda-neba --lines 30 --nostream 2>&1 | tail -30
echo ""

# Проверка на ошибки sqlite3
ERRORS=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -i "sqlite3\|Cannot find module.*sqlite3" | wc -l)
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ Ошибок sqlite3 не найдено!${NC}"
else
    echo -e "${RED}❌ Найдено ошибок: $ERRORS${NC}"
    echo "   Последние ошибки:"
    pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -i "sqlite3\|Cannot find module.*sqlite3" | tail -3
fi
echo ""

# 10. Проверка статуса
echo -e "${YELLOW}🔟 СТАТУС ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
pm2 status
echo ""

# 11. Проверка HTTP
echo -e "${YELLOW}1️⃣1️⃣  ПРОВЕРКА HTTP${NC}"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ Приложение отвечает на http://localhost:3000 (код: $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Приложение не отвечает (код: $HTTP_CODE)${NC}"
fi
echo ""

# Итог
echo -e "${BLUE}========================================${NC}"
if [ "$ERRORS" -eq 0 ] && [ "$HTTP_CODE" != "000" ]; then
    echo -e "${GREEN}✅ ВСЁ ИСПРАВЛЕНО!${NC}"
    echo ""
    echo "Приложение должно работать корректно."
else
    echo -e "${RED}❌ ПРОБЛЕМА ОСТАЛАСЬ${NC}"
    echo ""
    echo "Попробуйте:"
    echo "  1. Проверить версию Node.js: node --version"
    echo "  2. Проверить архитектуру: uname -m"
    echo "  3. Проверить логи: pm2 logs arenda-neba --lines 50"
    echo ""
    echo "Если проблема осталась, возможно нужна переустановка Node.js"
fi
echo -e "${BLUE}========================================${NC}"
