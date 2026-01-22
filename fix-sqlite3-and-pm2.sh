#!/bin/bash

# Скрипт для исправления sqlite3 и запуска приложения через PM2
# Использование: ./fix-sqlite3-and-pm2.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔧 ИСПРАВЛЕНИЕ SQLITE3 И PM2${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

PROJECT_DIR="/opt/arenda-neba"
cd "$PROJECT_DIR" || exit 1

# ============================================
# 1. ПРОВЕРКА PM2 СТАТУСА
# ============================================
echo -e "${CYAN}1️⃣  ПРОВЕРКА PM2${NC}"
echo "----------------------------------------"

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 не установлен!${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Текущий статус PM2:${NC}"
pm2 list
echo ""

# Проверка, существует ли процесс
if pm2 list | grep -q "arenda-neba"; then
    echo -e "${GREEN}✅ Процесс arenda-neba найден в PM2${NC}"
    pm2 delete arenda-neba 2>/dev/null
    echo "   Процесс удален для пересоздания"
else
    echo -e "${YELLOW}⚠️  Процесс arenda-neba не найден в PM2${NC}"
    echo "   Будет создан новый процесс"
fi
echo ""

# ============================================
# 2. ОЧИСТКА ПРОБЛЕМНЫХ МОДУЛЕЙ
# ============================================
echo -e "${CYAN}2️⃣  ОЧИСТКА ПРОБЛЕМНЫХ МОДУЛЕЙ${NC}"
echo "----------------------------------------"

# Остановка всех процессов PM2 для освобождения файлов
pm2 stop all 2>/dev/null
sleep 2

# Удаление sqlite3
if [ -d "node_modules/sqlite3" ]; then
    echo -e "${YELLOW}🗑️  Удаление sqlite3...${NC}"
    rm -rf node_modules/sqlite3
    echo "   ✅ sqlite3 удален"
fi

# Удаление проблемного node-gyp
if [ -d "node_modules/node-gyp" ]; then
    echo -e "${YELLOW}🗑️  Удаление проблемного node-gyp...${NC}"
    rm -rf node_modules/node-gyp
    echo "   ✅ node-gyp удален"
fi

# Очистка временных файлов npm
if [ -d "node_modules/.node-gyp-"* ]; then
    echo -e "${YELLOW}🗑️  Удаление временных файлов npm...${NC}"
    rm -rf node_modules/.node-gyp-*
    echo "   ✅ Временные файлы удалены"
fi

# Очистка npm кэша
echo -e "${YELLOW}🧹 Очистка npm кэша...${NC}"
npm cache clean --force 2>/dev/null
echo "   ✅ Кэш очищен"
echo ""

# ============================================
# 3. ПРОВЕРКА ДИСКОВОГО ПРОСТРАНСТВА
# ============================================
echo -e "${CYAN}3️⃣  ПРОВЕРКА ДИСКОВОГО ПРОСТРАНСТВА${NC}"
echo "----------------------------------------"
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "   Использование диска: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -gt 95 ]; then
    echo -e "${RED}⚠️  Диск заполнен критически!${NC}"
    echo "   Выполните очистку перед установкой:"
    echo "   journalctl --vacuum-time=1d"
    echo "   find /var/log -type f -name '*.log' -mtime +3 -delete"
    exit 1
fi
echo ""

# ============================================
# 4. УСТАНОВКА SQLITE3
# ============================================
echo -e "${CYAN}4️⃣  УСТАНОВКА SQLITE3${NC}"
echo "----------------------------------------"

echo -e "${YELLOW}📦 Установка sqlite3 из исходников...${NC}"
echo "   Это может занять несколько минут..."

# Установка с подробным выводом
if npm install sqlite3 --build-from-source --verbose 2>&1 | tee /tmp/sqlite3-install.log; then
    echo -e "${GREEN}✅ sqlite3 успешно установлен${NC}"
else
    echo -e "${RED}❌ Ошибка установки sqlite3${NC}"
    echo "   Проверьте логи: cat /tmp/sqlite3-install.log"
    
    # Попытка альтернативного метода
    echo ""
    echo -e "${YELLOW}🔄 Попытка альтернативного метода установки...${NC}"
    npm install sqlite3 --no-save --build-from-source 2>&1 | tail -20
    
    if [ ! -d "node_modules/sqlite3" ]; then
        echo -e "${RED}❌ Установка не удалась${NC}"
        exit 1
    fi
fi
echo ""

# ============================================
# 5. ПРОВЕРКА SQLITE3
# ============================================
echo -e "${CYAN}5️⃣  ПРОВЕРКА SQLITE3${NC}"
echo "----------------------------------------"

if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
    echo -e "${GREEN}✅ Нативный модуль sqlite3 найден${NC}"
    ls -lh node_modules/sqlite3/build/Release/node_sqlite3.node
else
    echo -e "${RED}❌ Нативный модуль sqlite3 не найден!${NC}"
    echo "   Попытка пересборки..."
    cd node_modules/sqlite3
    npm run install 2>&1 | tail -10
    cd "$PROJECT_DIR"
fi
echo ""

# ============================================
# 6. ЗАПУСК ПРИЛОЖЕНИЯ ЧЕРЕЗ PM2
# ============================================
echo -e "${CYAN}6️⃣  ЗАПУСК ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"

# Проверка наличия server.js
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ server.js не найден!${NC}"
    exit 1
fi

# Проверка наличия ecosystem.config.js
if [ -f "ecosystem.config.js" ]; then
    echo -e "${YELLOW}📋 Использование ecosystem.config.js${NC}"
    pm2 start ecosystem.config.js
else
    echo -e "${YELLOW}📋 Запуск через server.js${NC}"
    pm2 start server.js --name arenda-neba --cwd "$PROJECT_DIR"
fi

sleep 3

# Проверка статуса
if pm2 list | grep -q "arenda-neba.*online"; then
    echo -e "${GREEN}✅ Приложение успешно запущено!${NC}"
    pm2 list | grep arenda-neba
else
    echo -e "${RED}❌ Приложение не запустилось${NC}"
    echo "   Проверьте логи:"
    pm2 logs arenda-neba --lines 20 --nostream
    exit 1
fi
echo ""

# ============================================
# 7. ПРОВЕРКА ЛОГОВ
# ============================================
echo -e "${CYAN}7️⃣  ПРОВЕРКА ЛОГОВ${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📋 Последние 10 строк логов:${NC}"
pm2 logs arenda-neba --lines 10 --nostream | tail -10
echo ""

# Проверка на ошибки
ERROR_COUNT=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "error|Cannot find module|sqlite3" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  Найдено ошибок в логах: $ERROR_COUNT${NC}"
    pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "error|Cannot find module|sqlite3" | tail -5
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
