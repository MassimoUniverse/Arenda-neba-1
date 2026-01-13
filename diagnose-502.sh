#!/bin/bash

echo "🔍 ДИАГНОСТИКА ОШИБКИ 502 BAD GATEWAY"
echo "======================================"
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Проверка PM2
echo "1️⃣  Проверка PM2..."
echo "-------------------"
pm2 status
echo ""

# Проверка конкретного приложения
if pm2 list | grep -q "arenda-neba"; then
    STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="arenda-neba") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "online" ]; then
        echo -e "${GREEN}✅ Приложение arenda-neba запущено${NC}"
    else
        echo -e "${RED}❌ Приложение arenda-neba НЕ запущено (статус: $STATUS)${NC}"
        echo -e "${YELLOW}💡 Решение: pm2 restart arenda-neba${NC}"
    fi
else
    echo -e "${RED}❌ Приложение arenda-neba не найдено в PM2${NC}"
    echo -e "${YELLOW}💡 Решение: cd /opt/arenda-neba && pm2 start server.js --name arenda-neba${NC}"
fi
echo ""

# 2. Проверка порта 3000
echo "2️⃣  Проверка порта 3000..."
echo "---------------------------"
if sudo ss -tulpn | grep -q ":3000"; then
    echo -e "${GREEN}✅ Порт 3000 слушается${NC}"
    sudo ss -tulpn | grep ":3000"
else
    echo -e "${RED}❌ Порт 3000 НЕ слушается${NC}"
    echo -e "${YELLOW}💡 Решение: Приложение не запущено или упало${NC}"
fi
echo ""

# 3. Проверка локального доступа
echo "3️⃣  Проверка локального доступа..."
echo "-----------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ Приложение отвечает (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Приложение НЕ отвечает (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}💡 Решение: Проверьте логи приложения${NC}"
fi
echo ""

# 4. Проверка последних ошибок в логах PM2
echo "4️⃣  Последние ошибки в логах PM2 (последние 10 строк)..."
echo "--------------------------------------------------------"
pm2 logs arenda-neba --lines 10 --nostream 2>&1 | tail -10
echo ""

# 5. Проверка nginx конфига
echo "5️⃣  Проверка конфигурации nginx..."
echo "-----------------------------------"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✅ Конфигурация nginx корректна${NC}"
else
    echo -e "${RED}❌ Ошибки в конфигурации nginx:${NC}"
    sudo nginx -t
fi
echo ""

# Проверка proxy_pass
if [ -f /etc/nginx/sites-available/arenda-neba ]; then
    if grep -q "proxy_pass.*localhost:3000" /etc/nginx/sites-available/arenda-neba; then
        echo -e "${GREEN}✅ proxy_pass настроен правильно${NC}"
    else
        echo -e "${RED}❌ proxy_pass не найден или неправильный${NC}"
        echo -e "${YELLOW}💡 Решение: Проверьте /etc/nginx/sites-available/arenda-neba${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Файл конфигурации не найден${NC}"
fi
echo ""

# 6. Проверка последних ошибок nginx
echo "6️⃣  Последние ошибки nginx (последние 10 строк)..."
echo "---------------------------------------------------"
if [ -f /var/log/nginx/error.log ]; then
    sudo tail -10 /var/log/nginx/error.log 2>/dev/null | grep -i "502\|error\|failed" || echo "Нет ошибок 502 в последних логах"
else
    echo "Файл логов не найден"
fi
echo ""

# 7. Проверка базы данных
echo "7️⃣  Проверка базы данных..."
echo "-----------------------------"
if [ -f /opt/arenda-neba/database.db ]; then
    echo -e "${GREEN}✅ База данных существует${NC}"
    DB_SIZE=$(du -h /opt/arenda-neba/database.db | cut -f1)
    echo "   Размер: $DB_SIZE"
    
    # Проверка целостности (если sqlite3 установлен)
    if command -v sqlite3 &> /dev/null; then
        INTEGRITY=$(cd /opt/arenda-neba && sqlite3 database.db "PRAGMA integrity_check;" 2>/dev/null)
        if [ "$INTEGRITY" = "ok" ]; then
            echo -e "${GREEN}✅ База данных не повреждена${NC}"
        else
            echo -e "${RED}❌ База данных повреждена!${NC}"
            echo -e "${YELLOW}💡 Решение: Восстановите из бекапа${NC}"
        fi
    fi
else
    echo -e "${RED}❌ База данных не найдена!${NC}"
    echo -e "${YELLOW}💡 Решение: node init-db.js${NC}"
fi
echo ""

# 8. Проверка зависимостей
echo "8️⃣  Проверка зависимостей..."
echo "----------------------------"
if [ -f /opt/arenda-neba/package.json ]; then
    if [ -d /opt/arenda-neba/node_modules ]; then
        echo -e "${GREEN}✅ node_modules существует${NC}"
    else
        echo -e "${RED}❌ node_modules не найден!${NC}"
        echo -e "${YELLOW}💡 Решение: cd /opt/arenda-neba && npm install${NC}"
    fi
else
    echo -e "${RED}❌ package.json не найден!${NC}"
fi
echo ""

# Итоговые рекомендации
echo "📋 РЕКОМЕНДАЦИИ:"
echo "================"
echo ""

if ! pm2 list | grep -q "arenda-neba.*online"; then
    echo "1. Запустите приложение:"
    echo "   cd /opt/arenda-neba"
    echo "   pm2 start server.js --name arenda-neba"
    echo "   pm2 save"
    echo ""
fi

if ! sudo ss -tulpn | grep -q ":3000"; then
    echo "2. Приложение не слушает порт 3000. Проверьте логи:"
    echo "   pm2 logs arenda-neba --lines 50"
    echo ""
fi

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "301" ] && [ "$HTTP_CODE" != "302" ]; then
    echo "3. Приложение не отвечает. Проверьте:"
    echo "   - Логи: pm2 logs arenda-neba"
    echo "   - Базу данных: ls -la /opt/arenda-neba/database.db"
    echo "   - Зависимости: cd /opt/arenda-neba && npm install"
    echo ""
fi

echo "📖 Подробная инструкция: см. FIX_502_ERROR.md"
echo ""
echo "✅ Диагностика завершена!"
