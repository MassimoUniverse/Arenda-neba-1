#!/bin/bash

# Скрипт для диагностики и исправления высокой нагрузки CPU от системных процессов
# Использование: ./fix-system-load.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 ДИАГНОСТИКА НАГРУЗКИ CPU${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Проверка общей нагрузки
echo -e "${YELLOW}📊 Общая нагрузка системы:${NC}"
uptime
echo ""

# 2. ТОП процессов по CPU
echo -e "${YELLOW}🔥 ТОП-15 процессов по использованию CPU:${NC}"
ps aux --sort=-%cpu | head -16
echo ""

# 3. Проверка apport
echo -e "${YELLOW}🔍 Проверка apport (система отчетов об ошибках):${NC}"
APPORT_PID=$(ps aux | grep "[a]pport" | awk '{print $2}')
if [ -n "$APPORT_PID" ]; then
    echo -e "${RED}⚠️  Apport работает (PID: $APPORT_PID)${NC}"
    echo "   Это может быть причиной высокой нагрузки"
    echo "   Проверяем, что он делает..."
    ps aux | grep "[a]pport" | head -3
    echo ""
    echo -e "${YELLOW}💡 Решение: Отключить apport (не критично для работы сервера)${NC}"
else
    echo -e "${GREEN}✅ Apport не запущен${NC}"
fi
echo ""

# 4. Проверка rsyslogd
echo -e "${YELLOW}🔍 Проверка rsyslogd (системный демон логирования):${NC}"
RSYSLOG_PID=$(ps aux | grep "[r]syslogd" | awk '{print $2}')
if [ -n "$RSYSLOG_PID" ]; then
    CPU_USAGE=$(ps aux | grep "[r]syslogd" | awk '{print $3}')
    echo -e "${YELLOW}⚠️  Rsyslogd работает (PID: $RSYSLOG_PID, CPU: ${CPU_USAGE}%)${NC}"
    echo "   Проверяем размер логов..."
    
    # Проверка размера логов
    if [ -d "/var/log" ]; then
        LOG_SIZE=$(du -sh /var/log 2>/dev/null | cut -f1)
        echo "   Размер /var/log: $LOG_SIZE"
        
        # Проверка больших логов
        echo "   ТОП-5 самых больших логов:"
        find /var/log -type f -name "*.log" -exec du -h {} + 2>/dev/null | sort -rh | head -5 | sed 's/^/     /'
    fi
else
    echo -e "${GREEN}✅ Rsyslogd не запущен${NC}"
fi
echo ""

# 5. Проверка Node.js процессов
echo -e "${YELLOW}🔍 Проверка процессов Node.js:${NC}"
NODE_PROCESSES=$(ps aux | grep -E "[n]ode|[p]m2" | grep -v grep | wc -l)
if [ "$NODE_PROCESSES" -gt 0 ]; then
    echo -e "${GREEN}✅ Найдено процессов Node.js/PM2: $NODE_PROCESSES${NC}"
    ps aux | grep -E "[n]ode|[p]m2" | grep -v grep | head -5
else
    echo -e "${YELLOW}⚠️  Процессы Node.js не найдены${NC}"
fi
echo ""

# 6. Проверка использования памяти
echo -e "${YELLOW}💾 Использование памяти:${NC}"
free -h
echo ""

# 7. Проверка использования диска
echo -e "${YELLOW}📁 Использование диска:${NC}"
df -h / | tail -1
echo ""

# 8. Проверка на зависшие процессы (статус D)
echo -e "${YELLOW}🔍 Проверка на зависшие процессы (статус D):${NC}"
ZOMBIE_PROCESSES=$(ps aux | awk '$8 ~ /D/ { print $0 }' | wc -l)
if [ "$ZOMBIE_PROCESSES" -gt 0 ]; then
    echo -e "${RED}⚠️  Найдено зависших процессов: $ZOMBIE_PROCESSES${NC}"
    ps aux | awk '$8 ~ /D/ { print $0 }' | head -5
else
    echo -e "${GREEN}✅ Зависших процессов не найдено${NC}"
fi
echo ""

# ============================================
# РЕШЕНИЯ
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}💡 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Решение 1: Отключить apport
if [ -n "$APPORT_PID" ]; then
    echo -e "${YELLOW}1️⃣  ОТКЛЮЧИТЬ APPORT:${NC}"
    echo "   Apport - это система отчетов об ошибках Ubuntu."
    echo "   На сервере она обычно не нужна и может вызывать высокую нагрузку."
    echo ""
    echo "   Выполните:"
    echo -e "   ${GREEN}sudo systemctl stop apport${NC}"
    echo -e "   ${GREEN}sudo systemctl disable apport${NC}"
    echo -e "   ${GREEN}sudo service apport stop${NC}"
    echo ""
fi

# Решение 2: Очистить логи
if [ -n "$RSYSLOG_PID" ]; then
    echo -e "${YELLOW}2️⃣  ОЧИСТИТЬ ЛОГИ:${NC}"
    echo "   Большие логи могут вызывать высокую нагрузку на rsyslogd."
    echo ""
    echo "   Проверьте размер логов:"
    echo -e "   ${GREEN}sudo du -sh /var/log/* | sort -rh | head -10${NC}"
    echo ""
    echo "   Очистите старые логи (старше 7 дней):"
    echo -e "   ${GREEN}sudo journalctl --vacuum-time=7d${NC}"
    echo -e "   ${GREEN}sudo find /var/log -type f -name '*.log' -mtime +7 -delete${NC}"
    echo ""
fi

# Решение 3: Перезапустить rsyslogd
if [ -n "$RSYSLOG_PID" ] && [ "$(echo $CPU_USAGE | cut -d. -f1)" -gt 10 ]; then
    echo -e "${YELLOW}3️⃣  ПЕРЕЗАПУСТИТЬ RSYSLOGD:${NC}"
    echo "   Если rsyslogd использует много CPU, перезапустите его:"
    echo -e "   ${GREEN}sudo systemctl restart rsyslog${NC}"
    echo ""
fi

# Решение 4: Проверить системные логи на ошибки
echo -e "${YELLOW}4️⃣  ПРОВЕРИТЬ СИСТЕМНЫЕ ЛОГИ:${NC}"
echo "   Проверьте, нет ли ошибок, которые вызывают высокую нагрузку:"
echo -e "   ${GREEN}sudo journalctl -p err -b | tail -20${NC}"
echo -e "   ${GREEN}sudo dmesg | tail -20${NC}"
echo ""

# Решение 5: Мониторинг в реальном времени
echo -e "${YELLOW}5️⃣  МОНИТОРИНГ В РЕАЛЬНОМ ВРЕМЕНИ:${NC}"
echo "   Для отслеживания нагрузки используйте:"
echo -e "   ${GREEN}top${NC} - интерактивный мониторинг"
echo -e "   ${GREEN}htop${NC} - улучшенный мониторинг (если установлен)"
echo -e "   ${GREEN}watch -n 1 'ps aux --sort=-%cpu | head -10'${NC} - обновление каждую секунду"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Диагностика завершена${NC}"
echo -e "${BLUE}========================================${NC}"
