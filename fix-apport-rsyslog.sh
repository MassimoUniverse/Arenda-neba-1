#!/bin/bash

# Скрипт для отключения apport и оптимизации rsyslogd
# Использование: ./fix-apport-rsyslog.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Исправление проблем с apport и rsyslogd${NC}"
echo ""

# 1. Отключение apport
echo -e "${YELLOW}1️⃣  Отключаем apport...${NC}"
if systemctl is-active --quiet apport 2>/dev/null; then
    sudo systemctl stop apport 2>/dev/null || service apport stop 2>/dev/null || true
    echo -e "${GREEN}   ✅ Apport остановлен${NC}"
else
    echo -e "${GREEN}   ✅ Apport уже остановлен${NC}"
fi

# Отключаем автозапуск apport
if systemctl is-enabled --quiet apport 2>/dev/null; then
    sudo systemctl disable apport 2>/dev/null || true
    echo -e "${GREEN}   ✅ Автозапуск apport отключен${NC}"
else
    echo -e "${GREEN}   ✅ Автозапуск apport уже отключен${NC}"
fi

# Отключаем через конфиг
if [ -f /etc/default/apport ]; then
    sudo sed -i 's/enabled=1/enabled=0/' /etc/default/apport 2>/dev/null || true
    echo -e "${GREEN}   ✅ Apport отключен в конфиге${NC}"
fi

echo ""

# 2. Очистка старых логов
echo -e "${YELLOW}2️⃣  Очищаем старые логи (старше 7 дней)...${NC}"

# Очистка journalctl
if command -v journalctl >/dev/null 2>&1; then
    BEFORE_SIZE=$(du -sh /var/log/journal 2>/dev/null | cut -f1 || echo "unknown")
    sudo journalctl --vacuum-time=7d 2>/dev/null || true
    AFTER_SIZE=$(du -sh /var/log/journal 2>/dev/null | cut -f1 || echo "unknown")
    echo -e "${GREEN}   ✅ Логи journal очищены (было: $BEFORE_SIZE, стало: $AFTER_SIZE)${NC}"
fi

# Очистка старых .log файлов
OLD_LOGS=$(sudo find /var/log -type f -name "*.log" -mtime +7 2>/dev/null | wc -l)
if [ "$OLD_LOGS" -gt 0 ]; then
    sudo find /var/log -type f -name "*.log" -mtime +7 -delete 2>/dev/null || true
    echo -e "${GREEN}   ✅ Удалено $OLD_LOGS старых лог-файлов${NC}"
else
    echo -e "${GREEN}   ✅ Старых лог-файлов не найдено${NC}"
fi

# Очистка старых .gz файлов (сжатые логи)
OLD_GZ=$(sudo find /var/log -type f -name "*.gz" -mtime +30 2>/dev/null | wc -l)
if [ "$OLD_GZ" -gt 0 ]; then
    sudo find /var/log -type f -name "*.gz" -mtime +30 -delete 2>/dev/null || true
    echo -e "${GREEN}   ✅ Удалено $OLD_GZ старых сжатых логов${NC}"
fi

echo ""

# 3. Перезапуск rsyslogd
echo -e "${YELLOW}3️⃣  Перезапускаем rsyslogd...${NC}"
if systemctl is-active --quiet rsyslog 2>/dev/null; then
    sudo systemctl restart rsyslog 2>/dev/null || service rsyslog restart 2>/dev/null || true
    sleep 2
    if systemctl is-active --quiet rsyslog 2>/dev/null; then
        echo -e "${GREEN}   ✅ Rsyslogd перезапущен${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Rsyslogd не перезапустился (может быть не установлен)${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  Rsyslogd не запущен${NC}"
fi

echo ""

# 4. Проверка результата
echo -e "${YELLOW}4️⃣  Проверяем результат...${NC}"
echo ""

# Проверка apport
if ps aux | grep -q "[a]pport"; then
    echo -e "${RED}   ⚠️  Apport всё ещё работает${NC}"
else
    echo -e "${GREEN}   ✅ Apport отключен${NC}"
fi

# Проверка нагрузки CPU
echo ""
echo -e "${YELLOW}📊 Текущая нагрузка CPU (топ-5 процессов):${NC}"
ps aux --sort=-%cpu | head -6 | tail -5

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Исправление завершено!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}💡 Совет: Подождите 1-2 минуты и проверьте нагрузку снова:${NC}"
echo -e "   ${GREEN}uptime${NC}"
echo -e "   ${GREEN}ps aux --sort=-%cpu | head -10${NC}"
