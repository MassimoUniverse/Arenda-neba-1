#!/bin/bash

# Скрипт для исправления проблем с sharp и sqlite3
# Использование: ./fix-sharp-and-sqlite3.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔧 ИСПРАВЛЕНИЕ SHARP И SQLITE3${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

PROJECT_DIR="/opt/arenda-neba"
cd "$PROJECT_DIR" || exit 1

# ============================================
# 1. ОСТАНОВКА ПРИЛОЖЕНИЯ
# ============================================
echo -e "${CYAN}1️⃣  ОСТАНОВКА ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
sleep 2
echo -e "${GREEN}✅ Все процессы остановлены${NC}"
echo ""

# ============================================
# 2. ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С SHARP
# ============================================
echo -e "${CYAN}2️⃣  ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С SHARP${NC}"
echo "----------------------------------------"

# Удаление проблемного модуля sharp
if [ -d "node_modules/@img" ]; then
    echo -e "${YELLOW}🗑️  Удаление проблемного модуля sharp...${NC}"
    rm -rf node_modules/@img
    echo -e "${GREEN}✅ Sharp удален${NC}"
fi

# Удаление sharp из node_modules
if [ -d "node_modules/sharp" ]; then
    echo -e "${YELLOW}🗑️  Удаление sharp...${NC}"
    rm -rf node_modules/sharp
    echo -e "${GREEN}✅ Sharp удален${NC}"
fi

# Очистка временных файлов npm
echo -e "${YELLOW}🧹 Очистка временных файлов npm...${NC}"
rm -rf node_modules/.sharp-* 2>/dev/null
rm -rf node_modules/.node-gyp-* 2>/dev/null
npm cache clean --force 2>/dev/null
echo -e "${GREEN}✅ Кэш очищен${NC}"
echo ""

# ============================================
# 3. УДАЛЕНИЕ SQLITE3
# ============================================
echo -e "${CYAN}3️⃣  УДАЛЕНИЕ SQLITE3${NC}"
echo "----------------------------------------"

if [ -d "node_modules/sqlite3" ]; then
    echo -e "${YELLOW}🗑️  Удаление sqlite3...${NC}"
    rm -rf node_modules/sqlite3
    echo -e "${GREEN}✅ sqlite3 удален${NC}"
fi

if [ -d "node_modules/node-gyp" ]; then
    echo -e "${YELLOW}🗑️  Удаление node-gyp...${NC}"
    rm -rf node_modules/node-gyp
    echo -e "${GREEN}✅ node-gyp удален${NC}"
fi
echo ""

# ============================================
# 4. ПРОВЕРКА ДИСКОВОГО ПРОСТРАНСТВА
# ============================================
echo -e "${CYAN}4️⃣  ПРОВЕРКА ДИСКОВОГО ПРОСТРАНСТВА${NC}"
echo "----------------------------------------"
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "   Использование диска: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -gt 95 ]; then
    echo -e "${RED}⚠️  Диск заполнен критически!${NC}"
    exit 1
fi
echo ""

# ============================================
# 5. УСТАНОВКА SHARP
# ============================================
echo -e "${CYAN}5️⃣  УСТАНОВКА SHARP${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📦 Установка sharp...${NC}"

if npm install sharp --no-save 2>&1 | tee /tmp/sharp-install.log; then
    echo -e "${GREEN}✅ Sharp успешно установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Ошибка установки sharp, продолжаем...${NC}"
    cat /tmp/sharp-install.log | tail -10
fi
echo ""

# ============================================
# 6. УСТАНОВКА SQLITE3
# ============================================
echo -e "${CYAN}6️⃣  УСТАНОВКА SQLITE3${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📦 Установка sqlite3 из исходников...${NC}"
echo "   Это может занять несколько минут..."

# Установка с подробным выводом
if npm install sqlite3 --build-from-source --no-save 2>&1 | tee /tmp/sqlite3-install.log; then
    echo -e "${GREEN}✅ sqlite3 успешно установлен${NC}"
else
    echo -e "${RED}❌ Ошибка установки sqlite3${NC}"
    echo "   Последние строки лога:"
    tail -20 /tmp/sqlite3-install.log
    
    # Попытка альтернативного метода
    echo ""
    echo -e "${YELLOW}🔄 Попытка альтернативного метода...${NC}"
    cd node_modules/sqlite3 2>/dev/null && npm run install 2>&1 | tail -10
    cd "$PROJECT_DIR"
fi
echo ""

# ============================================
# 7. ПРОВЕРКА УСТАНОВКИ
# ============================================
echo -e "${CYAN}7️⃣  ПРОВЕРКА УСТАНОВКИ${NC}"
echo "----------------------------------------"

# Проверка sqlite3
if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
    echo -e "${GREEN}✅ Нативный модуль sqlite3 найден${NC}"
    ls -lh node_modules/sqlite3/build/Release/node_sqlite3.node
    
    # Проверка архитектуры
    if command -v file &> /dev/null; then
        ARCH=$(file node_modules/sqlite3/build/Release/node_sqlite3.node 2>/dev/null)
        echo "   Архитектура: $ARCH"
    fi
else
    echo -e "${RED}❌ Нативный модуль sqlite3 не найден!${NC}"
    echo "   Попытка пересборки..."
    
    if [ -d "node_modules/sqlite3" ]; then
        cd node_modules/sqlite3
        npm run install 2>&1 | tail -20
        cd "$PROJECT_DIR"
        
        if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
            echo -e "${GREEN}✅ Модуль успешно пересобран${NC}"
        else
            echo -e "${RED}❌ Пересборка не удалась${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Директория sqlite3 не найдена${NC}"
        exit 1
    fi
fi
echo ""

# Проверка sharp
if [ -d "node_modules/sharp" ]; then
    echo -e "${GREEN}✅ Sharp установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Sharp не установлен (не критично)${NC}"
fi
echo ""

# ============================================
# 8. ТЕСТОВАЯ ЗАГРУЗКА МОДУЛЯ
# ============================================
echo -e "${CYAN}8️⃣  ТЕСТОВАЯ ЗАГРУЗКА SQLITE3${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}🧪 Тестирование загрузки модуля...${NC}"

if node -e "require('sqlite3'); console.log('✅ sqlite3 загружен успешно');" 2>&1; then
    echo -e "${GREEN}✅ Модуль sqlite3 загружается корректно${NC}"
else
    echo -e "${RED}❌ Ошибка загрузки модуля sqlite3${NC}"
    exit 1
fi
echo ""

# ============================================
# 9. ЗАПУСК ПРИЛОЖЕНИЯ
# ============================================
echo -e "${CYAN}9️⃣  ЗАПУСК ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"

# Проверка наличия server.js
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ server.js не найден!${NC}"
    exit 1
fi

# Запуск через PM2
if [ -f "ecosystem.config.js" ]; then
    echo -e "${YELLOW}📋 Использование ecosystem.config.js${NC}"
    pm2 start ecosystem.config.js
else
    echo -e "${YELLOW}📋 Запуск через server.js${NC}"
    pm2 start server.js --name arenda-neba --cwd "$PROJECT_DIR"
fi

sleep 5

# Проверка статуса
if pm2 list | grep -q "arenda-neba.*online"; then
    UPTIME=$(pm2 jlist 2>/dev/null | grep -o '"name":"arenda-neba"[^}]*"pm_uptime":[0-9]*' | grep -o '"pm_uptime":[0-9]*' | cut -d':' -f2 || echo "0")
    if [ "$UPTIME" -gt 5000 ]; then
        echo -e "${GREEN}✅ Приложение успешно запущено и работает!${NC}"
        pm2 list | grep arenda-neba
    else
        echo -e "${YELLOW}⚠️  Приложение запущено, но недавно (uptime: ${UPTIME}ms)${NC}"
        pm2 list | grep arenda-neba
    fi
else
    echo -e "${RED}❌ Приложение не запустилось${NC}"
    echo "   Проверьте логи:"
    pm2 logs arenda-neba --lines 20 --nostream 2>&1 | tail -20
    exit 1
fi
echo ""

# ============================================
# 10. ПРОВЕРКА ЛОГОВ
# ============================================
echo -e "${CYAN}🔟 ПРОВЕРКА ЛОГОВ${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📋 Последние 10 строк логов:${NC}"
pm2 logs arenda-neba --lines 10 --nostream 2>&1 | tail -10
echo ""

# Проверка на ошибки
ERROR_COUNT=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "error|Cannot find module|sqlite3|invalid ELF" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  Найдено ошибок в логах: $ERROR_COUNT${NC}"
    pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "error|Cannot find module|sqlite3|invalid ELF" | tail -5
else
    echo -e "${GREEN}✅ Ошибок в логах не найдено${NC}"
fi
echo ""

# ============================================
# ИТОГ
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Процесс завершен${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "📊 Статус PM2:"
pm2 list
echo ""
echo "💡 Полезные команды:"
echo "   pm2 logs arenda-neba          - просмотр логов"
echo "   pm2 monit                     - мониторинг"
echo "   pm2 restart arenda-neba        - перезапуск"
echo "   pm2 stop arenda-neba          - остановка"
