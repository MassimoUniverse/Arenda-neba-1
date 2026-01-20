#!/bin/bash

# Скрипт проверки системы после перезагрузки
# Использование: ./check-after-reboot.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 ПРОВЕРКА СИСТЕМЫ ПОСЛЕ ПЕРЕЗАГРУЗКИ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd /opt/arenda-neba || exit 1

# 1. Проверка общей нагрузки системы
echo -e "${YELLOW}1️⃣  ОБЩАЯ НАГРУЗКА СИСТЕМЫ${NC}"
echo "----------------------------------------"
uptime
echo ""

# 2. Проверка процессов по CPU
echo -e "${YELLOW}2️⃣  ТОП-10 ПРОЦЕССОВ ПО CPU${NC}"
echo "----------------------------------------"
ps aux --sort=-%cpu | head -11
echo ""

# 3. Проверка PM2 и приложения
echo -e "${YELLOW}3️⃣  ПРОВЕРКА PM2 И ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 установлен: ✅"
    pm2 list
    echo ""
    
    if pm2 list | grep -q "arenda-neba"; then
        echo -e "${GREEN}✅ Приложение arenda-neba найдено${NC}"
        PM2_STATUS=$(pm2 jlist | grep -o '"name":"arenda-neba"[^}]*"pm2_env"[^}]*"status":"[^"]*' | grep -o '"status":"[^"]*' | cut -d'"' -f4)
        echo "   Статус: $PM2_STATUS"
        
        if [ "$PM2_STATUS" = "online" ]; then
            echo -e "${GREEN}✅ Приложение работает${NC}"
        else
            echo -e "${RED}❌ Приложение не работает! Статус: $PM2_STATUS${NC}"
            echo "   Перезапустите: pm2 restart arenda-neba"
        fi
    else
        echo -e "${RED}❌ Приложение arenda-neba не найдено в PM2!${NC}"
        echo "   Запустите: pm2 start ecosystem.config.js"
    fi
else
    echo -e "${RED}❌ PM2 не установлен!${NC}"
fi
echo ""

# 4. Проверка Node.js процессов
echo -e "${YELLOW}4️⃣  ПРОЦЕССЫ NODE.JS${NC}"
echo "----------------------------------------"
NODE_PROCESSES=$(ps aux | grep -E "[n]ode|[p]m2" | grep -v grep | wc -l)
if [ "$NODE_PROCESSES" -gt 0 ]; then
    echo -e "${GREEN}✅ Найдено процессов Node.js/PM2: $NODE_PROCESSES${NC}"
    ps aux | grep -E "[n]ode|[p]m2" | grep -v grep | head -5
else
    echo -e "${RED}❌ Процессы Node.js не найдены!${NC}"
fi
echo ""

# 5. Проверка базы данных
echo -e "${YELLOW}5️⃣  ПРОВЕРКА БАЗЫ ДАННЫХ${NC}"
echo "----------------------------------------"
if [ -f "database.db" ]; then
    DB_SIZE=$(du -h database.db 2>/dev/null | cut -f1)
    echo -e "${GREEN}✅ База данных существует ($DB_SIZE)${NC}"
    
    # Проверка доступности через sqlite3
    if command -v sqlite3 >/dev/null 2>&1; then
        if sqlite3 database.db "SELECT COUNT(*) FROM services;" 2>/dev/null >/dev/null; then
            SERVICE_COUNT=$(sqlite3 database.db "SELECT COUNT(*) FROM services;" 2>/dev/null)
            echo -e "${GREEN}✅ База данных доступна (сервисов: $SERVICE_COUNT)${NC}"
        else
            echo -e "${YELLOW}⚠️  База данных существует, но есть проблемы с доступом${NC}"
        fi
    fi
else
    echo -e "${RED}❌ База данных не найдена!${NC}"
fi
echo ""

# 6. Проверка папки uploads
echo -e "${YELLOW}6️⃣  ПРОВЕРКА ПАПКИ UPLOADS${NC}"
echo "----------------------------------------"
if [ -d "uploads" ]; then
    UPLOADS_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
    UPLOADS_SIZE=$(du -sh uploads 2>/dev/null | cut -f1 || echo "unknown")
    echo -e "${GREEN}✅ Папка uploads существует${NC}"
    echo "   Файлов: $UPLOADS_COUNT"
    echo "   Размер: $UPLOADS_SIZE"
else
    echo -e "${RED}❌ Папка uploads не найдена!${NC}"
fi
echo ""

# 7. Проверка HTTP доступности
echo -e "${YELLOW}7️⃣  ПРОВЕРКА HTTP ДОСТУПНОСТИ${NC}"
echo "----------------------------------------"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Приложение отвечает на http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Приложение не отвечает на http://localhost:3000${NC}"
    echo "   Проверьте логи: pm2 logs arenda-neba --lines 20"
fi
echo ""

# 8. Проверка логов на ошибки
echo -e "${YELLOW}8️⃣  ПРОВЕРКА ЛОГОВ НА ОШИБКИ${NC}"
echo "----------------------------------------"
if pm2 list | grep -q "arenda-neba"; then
    ERROR_COUNT=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "error|❌|ошибка|failed|fail|Cannot find module" | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✅ Ошибок в последних 50 строках логов не найдено${NC}"
    else
        echo -e "${RED}❌ Найдено ошибок в логах: $ERROR_COUNT${NC}"
        echo "   Последние ошибки:"
        pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "error|❌|ошибка|failed|fail|Cannot find module" | tail -3 | sed 's/^/     /'
    fi
else
    echo -e "${YELLOW}⚠️  Приложение не запущено, логи недоступны${NC}"
fi
echo ""

# 9. Проверка apport (была проблема с нагрузкой)
echo -e "${YELLOW}9️⃣  ПРОВЕРКА APPORT${NC}"
echo "----------------------------------------"
if ps aux | grep -q "[a]pport"; then
    echo -e "${RED}⚠️  Apport работает (может вызывать высокую нагрузку)${NC}"
    echo "   Отключите: sudo systemctl stop apport && sudo systemctl disable apport"
else
    echo -e "${GREEN}✅ Apport не запущен${NC}"
fi
echo ""

# 10. Проверка использования ресурсов
echo -e "${YELLOW}🔟 ИСПОЛЬЗОВАНИЕ РЕСУРСОВ${NC}"
echo "----------------------------------------"
echo "Память:"
free -h | grep -E "Mem|Swap"
echo ""
echo "Диск:"
df -h / | tail -1
echo ""

# 11. Проверка критичных файлов
echo -e "${YELLOW}1️⃣1️⃣  ПРОВЕРКА КРИТИЧНЫХ ФАЙЛОВ${NC}"
echo "----------------------------------------"
CRITICAL_FILES=("server.js" "package.json" "ecosystem.config.js")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file существует${NC}"
    else
        echo -e "${RED}❌ $file не найден!${NC}"
    fi
done
echo ""

# 12. Итоговая рекомендация
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📋 ИТОГОВАЯ РЕКОМЕНДАЦИЯ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if ! pm2 list | grep -q "arenda-neba.*online"; then
    echo -e "${RED}❌ ПРИЛОЖЕНИЕ НЕ РАБОТАЕТ!${NC}"
    echo ""
    echo "Выполните:"
    echo "  cd /opt/arenda-neba"
    echo "  pm2 start ecosystem.config.js"
    echo "  pm2 save"
    echo ""
elif [ ! -f "database.db" ]; then
    echo -e "${RED}❌ БАЗА ДАННЫХ НЕ НАЙДЕНА!${NC}"
    echo ""
    echo "Проверьте бэкапы:"
    echo "  ls -lh database_backup_*.db"
    echo ""
elif ps aux | grep -q "[a]pport"; then
    echo -e "${YELLOW}⚠️  APPORT РАБОТАЕТ (может вызывать нагрузку)${NC}"
    echo ""
    echo "Отключите:"
    echo "  sudo systemctl stop apport"
    echo "  sudo systemctl disable apport"
    echo ""
else
    echo -e "${GREEN}✅ ВСЁ РАБОТАЕТ НОРМАЛЬНО!${NC}"
    echo ""
    echo "Проверьте сайт в браузере и убедитесь, что всё работает."
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Проверка завершена${NC}"
echo -e "${BLUE}========================================${NC}"
