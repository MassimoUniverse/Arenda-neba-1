#!/bin/bash

# Скрипт для диагностики высокой нагрузки на сервер
# Использование: ./diagnose-server-load.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 ДИАГНОСТИКА НАГРУЗКИ СЕРВЕРА${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Переходим в директорию проекта
PROJECT_DIR="/opt/arenda-neba"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    echo -e "${RED}❌ Директория проекта не найдена: $PROJECT_DIR${NC}"
    exit 1
fi

# ============================================
# 1. ОБЩАЯ НАГРУЗКА СИСТЕМЫ
# ============================================
echo -e "${CYAN}1️⃣  ОБЩАЯ НАГРУЗКА СИСТЕМЫ${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📊 Uptime и средняя нагрузка:${NC}"
uptime
echo ""

# Загрузка CPU
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_LOAD_INT=$(echo "$CPU_LOAD" | cut -d. -f1)

if [ -n "$CPU_LOAD_INT" ] && [ "$CPU_LOAD_INT" -gt 2 ]; then
    echo -e "${RED}⚠️  ВЫСОКАЯ НАГРУЗКА CPU: $CPU_LOAD${NC}"
else
    echo -e "${GREEN}✅ Нагрузка CPU: $CPU_LOAD${NC}"
fi
echo ""

# ============================================
# 2. ТОП ПРОЦЕССОВ ПО CPU
# ============================================
echo -e "${CYAN}2️⃣  ТОП-20 ПРОЦЕССОВ ПО CPU${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}🔥 Процессы, потребляющие больше всего CPU:${NC}"
ps aux --sort=-%cpu --no-headers | head -20 | awk '{printf "%-8s %-6s %-6s %-10s %s\n", $1, $2, $3"%", $4"%", $11" "$12" "$13" "$14" "$15" "$16" "$17" "$18" "$19" "$20" "$21}'
echo ""

# Находим процессы с CPU > 10%
HIGH_CPU=$(ps aux --sort=-%cpu --no-headers | awk '$3 > 10.0 {print $2" "$3"% "$11" "$12" "$13" "$14" "$15}')
if [ -n "$HIGH_CPU" ]; then
    echo -e "${RED}⚠️  ПРОЦЕССЫ С CPU > 10%:${NC}"
    echo "$HIGH_CPU" | while read line; do
        echo "   $line"
    done
    echo ""
fi

# ============================================
# 3. ТОП ПРОЦЕССОВ ПО ПАМЯТИ
# ============================================
echo -e "${CYAN}3️⃣  ТОП-20 ПРОЦЕССОВ ПО ПАМЯТИ${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}💾 Процессы, потребляющие больше всего памяти:${NC}"
ps aux --sort=-%mem --no-headers | head -20 | awk '{printf "%-8s %-6s %-6s %-10s %s\n", $1, $2, $3"%", $4"%", $11" "$12" "$13" "$14" "$15" "$16" "$17" "$18" "$19" "$20" "$21}'
echo ""

# ============================================
# 4. ПРОВЕРКА ПРОЦЕССОВ NODE.JS И PM2
# ============================================
echo -e "${CYAN}4️⃣  ПРОЦЕССЫ NODE.JS И PM2${NC}"
echo "----------------------------------------"
NODE_PROCESSES=$(ps aux | grep -E "[n]ode|[p]m2" | grep -v grep)
if [ -n "$NODE_PROCESSES" ]; then
    echo -e "${YELLOW}📋 Все процессы Node.js/PM2:${NC}"
    echo "$NODE_PROCESSES" | while read line; do
        PID=$(echo "$line" | awk '{print $2}')
        CPU=$(echo "$line" | awk '{print $3}')
        MEM=$(echo "$line" | awk '{print $4}')
        CMD=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')
        
        if (( $(echo "$CPU > 10.0" | bc -l 2>/dev/null || echo "0") )); then
            echo -e "   ${RED}⚠️  PID: $PID | CPU: ${CPU}% | MEM: ${MEM}% | $CMD${NC}"
        else
            echo -e "   ${GREEN}✅ PID: $PID | CPU: ${CPU}% | MEM: ${MEM}% | $CMD${NC}"
        fi
    done
    echo ""
    
    # Подсчет процессов
    NODE_COUNT=$(echo "$NODE_PROCESSES" | wc -l)
    echo "   Всего процессов Node.js/PM2: $NODE_COUNT"
    
    # Проверка на зомби-процессы
    ZOMBIE_COUNT=$(ps aux | grep -E "[n]ode|[p]m2" | grep -v grep | awk '$8 ~ /Z/ {print}' | wc -l)
    if [ "$ZOMBIE_COUNT" -gt 0 ]; then
        echo -e "   ${RED}⚠️  Найдено зомби-процессов: $ZOMBIE_COUNT${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Процессы Node.js/PM2 не найдены${NC}"
fi
echo ""

# ============================================
# 5. ПРОВЕРКА PM2 СТАТУСА
# ============================================
echo -e "${CYAN}5️⃣  СТАТУС PM2${NC}"
echo "----------------------------------------"
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📊 Статус всех процессов PM2:${NC}"
    pm2 list
    echo ""
    
    # Проверка приложения arenda-neba
    if pm2 list | grep -q "arenda-neba"; then
        echo -e "${YELLOW}📋 Детальная информация о arenda-neba:${NC}"
        pm2 describe arenda-neba 2>/dev/null | head -20
        echo ""
        
        # Проверка перезапусков
        RESTARTS=$(pm2 jlist 2>/dev/null | grep -o '"name":"arenda-neba"[^}]*"restart_time":[0-9]*' | grep -o '"restart_time":[0-9]*' | cut -d':' -f2 || echo "0")
        if [ "$RESTARTS" -gt 10 ]; then
            echo -e "${RED}⚠️  КРИТИЧНО: Приложение перезапускалось $RESTARTS раз!${NC}"
            echo "   Это может указывать на постоянные ошибки или зависания."
        fi
    else
        echo -e "${RED}❌ Приложение arenda-neba не найдено в PM2${NC}"
    fi
else
    echo -e "${RED}❌ PM2 не установлен${NC}"
fi
echo ""

# ============================================
# 6. ПРОВЕРКА ЛОГОВ PM2 НА ОШИБКИ
# ============================================
echo -e "${CYAN}6️⃣  АНАЛИЗ ЛОГОВ PM2${NC}"
echo "----------------------------------------"
if pm2 list | grep -q "arenda-neba"; then
    echo -e "${YELLOW}📋 Последние 50 строк логов (ошибки и предупреждения):${NC}"
    ERROR_LOGS=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "error|❌|ошибка|failed|fail|Cannot find module|timeout|ECONNRESET|ETIMEDOUT|EMFILE|ENFILE" || echo "")
    
    if [ -n "$ERROR_LOGS" ]; then
        echo -e "${RED}$ERROR_LOGS${NC}"
        echo ""
        
        # Подсчет ошибок
        ERROR_COUNT=$(echo "$ERROR_LOGS" | wc -l)
        echo -e "${RED}⚠️  Найдено ошибок в последних 50 строках: $ERROR_COUNT${NC}"
    else
        echo -e "${GREEN}✅ Ошибок в последних 50 строках не найдено${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}📋 Последние 20 строк логов (все):${NC}"
    pm2 logs arenda-neba --lines 20 --nostream 2>&1 | tail -20
else
    echo -e "${YELLOW}⚠️  Приложение не запущено, логи недоступны${NC}"
fi
echo ""

# ============================================
# 7. ПРОВЕРКА СЕТЕВОЙ АКТИВНОСТИ
# ============================================
echo -e "${CYAN}7️⃣  СЕТЕВАЯ АКТИВНОСТЬ${NC}"
echo "----------------------------------------"
if command -v ss &> /dev/null; then
    echo -e "${YELLOW}🌐 Активные соединения на порту 3000:${NC}"
    CONNECTIONS=$(ss -tn | grep ":3000" | wc -l)
    echo "   Всего соединений: $CONNECTIONS"
    
    if [ "$CONNECTIONS" -gt 50 ]; then
        echo -e "${RED}⚠️  ВЫСОКОЕ КОЛИЧЕСТВО СОЕДИНЕНИЙ: $CONNECTIONS${NC}"
        echo "   Это может указывать на проблему с закрытием соединений."
    fi
    
    echo ""
    echo -e "${YELLOW}🌐 Детали соединений:${NC}"
    ss -tn | grep ":3000" | head -10
else
    echo -e "${YELLOW}⚠️  ss не установлен, проверка сетевой активности пропущена${NC}"
fi
echo ""

# ============================================
# 8. ПРОВЕРКА ИСПОЛЬЗОВАНИЯ ПАМЯТИ
# ============================================
echo -e "${CYAN}8️⃣  ИСПОЛЬЗОВАНИЕ ПАМЯТИ${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}💾 Статус памяти:${NC}"
free -h
echo ""

# Проверка swap
SWAP_USAGE=$(free | grep Swap | awk '{if ($2 > 0) print ($3/$2)*100; else print 0}')
if [ -n "$SWAP_USAGE" ] && (( $(echo "$SWAP_USAGE > 50" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${RED}⚠️  ВЫСОКОЕ ИСПОЛЬЗОВАНИЕ SWAP: ${SWAP_USAGE}%${NC}"
    echo "   Это может замедлять работу сервера."
fi
echo ""

# ============================================
# 9. ПРОВЕРКА ИСПОЛЬЗОВАНИЯ ДИСКА
# ============================================
echo -e "${CYAN}9️⃣  ИСПОЛЬЗОВАНИЕ ДИСКА${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📁 Использование диска:${NC}"
df -h / | tail -1
echo ""

# Проверка на заполненность
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠️  КРИТИЧНО: Диск заполнен на ${DISK_USAGE}%${NC}"
    echo "   Это может вызывать проблемы с записью логов и файлов."
fi

# Проверка размера логов
if [ -d "/var/log" ]; then
    LOG_SIZE=$(du -sh /var/log 2>/dev/null | cut -f1)
    echo "   Размер /var/log: $LOG_SIZE"
fi

# Проверка размера uploads
if [ -d "uploads" ]; then
    UPLOADS_SIZE=$(du -sh uploads 2>/dev/null | cut -f1)
    UPLOADS_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
    echo "   Размер uploads: $UPLOADS_SIZE ($UPLOADS_COUNT файлов)"
fi
echo ""

# ============================================
# 10. ПРОВЕРКА СИСТЕМНЫХ ПРОЦЕССОВ
# ============================================
echo -e "${CYAN}🔟 СИСТЕМНЫЕ ПРОЦЕССЫ${NC}"
echo "----------------------------------------"

# Проверка apport
APPORT_PID=$(ps aux | grep "[a]pport" | awk '{print $2}')
if [ -n "$APPORT_PID" ]; then
    APPORT_CPU=$(ps aux | grep "[a]pport" | awk '{print $3}')
    echo -e "${RED}⚠️  Apport работает (PID: $APPORT_PID, CPU: ${APPORT_CPU}%)${NC}"
    echo "   Apport может вызывать высокую нагрузку. Рекомендуется отключить."
else
    echo -e "${GREEN}✅ Apport не запущен${NC}"
fi

# Проверка rsyslogd
RSYSLOG_PID=$(ps aux | grep "[r]syslogd" | awk '{print $2}')
if [ -n "$RSYSLOG_PID" ]; then
    RSYSLOG_CPU=$(ps aux | grep "[r]syslogd" | awk '{print $3}')
    if (( $(echo "$RSYSLOG_CPU > 5.0" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${RED}⚠️  Rsyslogd использует много CPU (PID: $RSYSLOG_PID, CPU: ${RSYSLOG_CPU}%)${NC}"
        echo "   Возможно, логи слишком большие."
    else
        echo -e "${GREEN}✅ Rsyslogd работает нормально (CPU: ${RSYSLOG_CPU}%)${NC}"
    fi
else
    echo -e "${GREEN}✅ Rsyslogd не запущен${NC}"
fi
echo ""

# ============================================
# 11. ПРОВЕРКА НА ЗАВИСШИЕ ПРОЦЕССЫ
# ============================================
echo -e "${CYAN}1️⃣1️⃣  ЗАВИСШИЕ ПРОЦЕССЫ${NC}"
echo "----------------------------------------"
# Процессы в состоянии D (uninterruptible sleep)
D_PROCESSES=$(ps aux | awk '$8 ~ /D/ {print $2" "$3"% "$11" "$12" "$13" "$14" "$15}')
if [ -n "$D_PROCESSES" ]; then
    D_COUNT=$(echo "$D_PROCESSES" | wc -l)
    echo -e "${RED}⚠️  Найдено зависших процессов (статус D): $D_COUNT${NC}"
    echo "$D_PROCESSES" | head -10
    echo "   Процессы в состоянии D могут указывать на проблемы с I/O."
else
    echo -e "${GREEN}✅ Зависших процессов не найдено${NC}"
fi
echo ""

# ============================================
# 12. ПРОВЕРКА API НА ЗАВИСАНИЯ
# ============================================
echo -e "${CYAN}1️⃣2️⃣  ПРОВЕРКА API${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}🌐 Тест доступности API:${NC}"
API_RESPONSE=$(timeout 5 curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/popular-cards 2>/dev/null || echo "TIMEOUT")
if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API отвечает (код: $API_RESPONSE)${NC}"
elif [ "$API_RESPONSE" = "TIMEOUT" ]; then
    echo -e "${RED}❌ API НЕ ОТВЕЧАЕТ (таймаут)${NC}"
    echo "   Это может указывать на зависание приложения."
else
    echo -e "${YELLOW}⚠️  API вернул код: $API_RESPONSE${NC}"
fi
echo ""

# ============================================
# РЕКОМЕНДАЦИИ
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}💡 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Рекомендация 1: Перезапуск приложения
if pm2 list | grep -q "arenda-neba"; then
    RESTARTS=$(pm2 jlist 2>/dev/null | grep -o '"name":"arenda-neba"[^}]*"restart_time":[0-9]*' | grep -o '"restart_time":[0-9]*' | cut -d':' -f2 || echo "0")
    if [ -n "$RESTARTS" ] && [ "$RESTARTS" -gt 10 ] 2>/dev/null; then
        echo -e "${YELLOW}1️⃣  ПЕРЕЗАПУСТИТЕ ПРИЛОЖЕНИЕ:${NC}"
        echo "   pm2 restart arenda-neba"
        echo "   или"
        echo "   pm2 delete arenda-neba && pm2 start server.js --name arenda-neba"
        echo ""
    fi
fi

# Рекомендация 2: Отключить apport
if [ -n "$APPORT_PID" ]; then
    echo -e "${YELLOW}2️⃣  ОТКЛЮЧИТЬ APPORT:${NC}"
    echo "   sudo systemctl stop apport"
    echo "   sudo systemctl disable apport"
    echo ""
fi

# Рекомендация 3: Очистить логи
if [ -n "$RSYSLOG_PID" ] && (( $(echo "$RSYSLOG_CPU > 5.0" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${YELLOW}3️⃣  ОЧИСТИТЬ ЛОГИ:${NC}"
    echo "   sudo journalctl --vacuum-time=7d"
    echo "   sudo find /var/log -type f -name '*.log' -mtime +7 -delete"
    echo ""
fi

# Рекомендация 4: Проверить код на бесконечные циклы
echo -e "${YELLOW}4️⃣  ПРОВЕРИТЬ КОД НА ПРОБЛЕМЫ:${NC}"
echo "   Проверьте server.js на наличие:"
echo "   - Бесконечных циклов"
echo "   - Рекурсивных вызовов без ограничений"
echo "   - Неправильной обработки ошибок"
echo "   - Утечек памяти"
echo ""

# Рекомендация 5: Мониторинг в реальном времени
echo -e "${YELLOW}5️⃣  МОНИТОРИНГ В РЕАЛЬНОМ ВРЕМЕНИ:${NC}"
echo "   watch -n 1 'ps aux --sort=-%cpu | head -10'"
echo "   pm2 monit"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Диагностика завершена${NC}"
echo -e "${BLUE}========================================${NC}"
