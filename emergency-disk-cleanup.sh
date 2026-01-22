#!/bin/bash

# Экстренная очистка диска для освобождения места
# Использование: ./emergency-disk-cleanup.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}🚨 ЭКСТРЕННАЯ ОЧИСТКА ДИСКА${NC}"
echo -e "${RED}========================================${NC}"
echo ""

# Переходим в директорию проекта
PROJECT_DIR="/opt/arenda-neba"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    echo -e "${RED}❌ Директория проекта не найдена: $PROJECT_DIR${NC}"
    exit 1
fi

# Проверка текущего использования диска
echo -e "${YELLOW}📊 Текущее использование диска:${NC}"
df -h / | tail -1
echo ""

DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 95 ]; then
    echo -e "${GREEN}✅ Диск не заполнен критически (${DISK_USAGE}%)${NC}"
    echo "   Но продолжим очистку для профилактики..."
    echo ""
fi

# ============================================
# 1. ОЧИСТКА СИСТЕМНЫХ ЛОГОВ
# ============================================
echo -e "${CYAN}1️⃣  ОЧИСТКА СИСТЕМНЫХ ЛОГОВ${NC}"
echo "----------------------------------------"

# Очистка journald (системные логи)
echo -e "${YELLOW}📋 Очистка journald (логи старше 3 дней):${NC}"
BEFORE_SIZE=$(du -sh /var/log/journal 2>/dev/null | cut -f1 || echo "0")
journalctl --vacuum-time=3d 2>/dev/null
AFTER_SIZE=$(du -sh /var/log/journal 2>/dev/null | cut -f1 || echo "0")
echo "   Было: $BEFORE_SIZE → Стало: $AFTER_SIZE"
echo ""

# Очистка старых логов в /var/log
echo -e "${YELLOW}📋 Удаление старых логов (старше 7 дней):${NC}"
OLD_LOGS=$(find /var/log -type f -name "*.log" -mtime +7 2>/dev/null | wc -l)
if [ "$OLD_LOGS" -gt 0 ]; then
    find /var/log -type f -name "*.log" -mtime +7 -delete 2>/dev/null
    echo "   Удалено файлов: $OLD_LOGS"
else
    echo "   Старых логов не найдено"
fi
echo ""

# Очистка ротированных логов
echo -e "${YELLOW}📋 Очистка ротированных логов (старше 7 дней):${NC}"
OLD_ROTATED=$(find /var/log -type f -name "*.gz" -mtime +7 2>/dev/null | wc -l)
if [ "$OLD_ROTATED" -gt 0 ]; then
    find /var/log -type f -name "*.gz" -mtime +7 -delete 2>/dev/null
    echo "   Удалено архивов: $OLD_ROTATED"
else
    echo "   Старых архивов не найдено"
fi
echo ""

# ============================================
# 2. ОЧИСТКА PM2 ЛОГОВ
# ============================================
echo -e "${CYAN}2️⃣  ОЧИСТКА PM2 ЛОГОВ${NC}"
echo "----------------------------------------"

if command -v pm2 &> /dev/null; then
    PM2_LOG_DIR="/root/.pm2/logs"
    if [ -d "$PM2_LOG_DIR" ]; then
        BEFORE_SIZE=$(du -sh "$PM2_LOG_DIR" 2>/dev/null | cut -f1 || echo "0")
        
        # Очистка старых логов PM2 (старше 7 дней)
        find "$PM2_LOG_DIR" -type f -name "*.log" -mtime +7 -delete 2>/dev/null
        
        # Очистка больших логов (оставляем только последние 1000 строк)
        if [ -f "$PM2_LOG_DIR/arenda-neba-error.log" ]; then
            LOG_SIZE=$(du -h "$PM2_LOG_DIR/arenda-neba-error.log" 2>/dev/null | cut -f1)
            if [ -n "$LOG_SIZE" ]; then
                echo "   Размер arenda-neba-error.log: $LOG_SIZE"
                # Оставляем только последние 1000 строк
                tail -1000 "$PM2_LOG_DIR/arenda-neba-error.log" > "$PM2_LOG_DIR/arenda-neba-error.log.tmp" 2>/dev/null
                mv "$PM2_LOG_DIR/arenda-neba-error.log.tmp" "$PM2_LOG_DIR/arenda-neba-error.log" 2>/dev/null
                echo "   Лог обрезан до последних 1000 строк"
            fi
        fi
        
        if [ -f "$PM2_LOG_DIR/arenda-neba-out.log" ]; then
            LOG_SIZE=$(du -h "$PM2_LOG_DIR/arenda-neba-out.log" 2>/dev/null | cut -f1)
            if [ -n "$LOG_SIZE" ]; then
                echo "   Размер arenda-neba-out.log: $LOG_SIZE"
                tail -1000 "$PM2_LOG_DIR/arenda-neba-out.log" > "$PM2_LOG_DIR/arenda-neba-out.log.tmp" 2>/dev/null
                mv "$PM2_LOG_DIR/arenda-neba-out.log.tmp" "$PM2_LOG_DIR/arenda-neba-out.log" 2>/dev/null
                echo "   Лог обрезан до последних 1000 строк"
            fi
        fi
        
        AFTER_SIZE=$(du -sh "$PM2_LOG_DIR" 2>/dev/null | cut -f1 || echo "0")
        echo "   Было: $BEFORE_SIZE → Стало: $AFTER_SIZE"
    fi
fi
echo ""

# ============================================
# 3. ОЧИСТКА СТАРЫХ БЭКАПОВ
# ============================================
echo -e "${CYAN}3️⃣  ОЧИСТКА СТАРЫХ БЭКАПОВ${NC}"
echo "----------------------------------------"

# Очистка старых бэкапов базы данных
if [ -d "$PROJECT_DIR" ]; then
    OLD_DB_BACKUPS=$(find "$PROJECT_DIR" -name "database_backup_*.db" -mtime +3 2>/dev/null | wc -l)
    if [ "$OLD_DB_BACKUPS" -gt 0 ]; then
        BACKUP_SIZE=$(du -ch "$PROJECT_DIR"/database_backup_*.db 2>/dev/null | tail -1 | cut -f1 || echo "0")
        find "$PROJECT_DIR" -name "database_backup_*.db" -mtime +3 -delete 2>/dev/null
        echo "   Удалено старых бэкапов БД: $OLD_DB_BACKUPS (освобождено: $BACKUP_SIZE)"
    else
        echo "   Старых бэкапов БД не найдено"
    fi
    
    # Очистка старых бэкапов uploads
    OLD_UPLOADS_BACKUPS=$(find "$PROJECT_DIR" -type d -name "uploads_backup_*" -mtime +3 2>/dev/null | wc -l)
    if [ "$OLD_UPLOADS_BACKUPS" -gt 0 ]; then
        BACKUP_SIZE=$(du -sh "$PROJECT_DIR"/uploads_backup_* 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
        find "$PROJECT_DIR" -type d -name "uploads_backup_*" -mtime +3 -exec rm -rf {} + 2>/dev/null
        echo "   Удалено старых бэкапов uploads: $OLD_UPLOADS_BACKUPS"
    else
        echo "   Старых бэкапов uploads не найдено"
    fi
fi
echo ""

# ============================================
# 4. ОЧИСТКА NPM КЭША И ВРЕМЕННЫХ ФАЙЛОВ
# ============================================
echo -e "${CYAN}4️⃣  ОЧИСТКА NPM КЭША И ВРЕМЕННЫХ ФАЙЛОВ${NC}"
echo "----------------------------------------"

# Очистка npm кэша
if command -v npm &> /dev/null; then
    BEFORE_SIZE=$(du -sh ~/.npm 2>/dev/null | cut -f1 || echo "0")
    npm cache clean --force 2>/dev/null
    AFTER_SIZE=$(du -sh ~/.npm 2>/dev/null | cut -f1 || echo "0")
    echo "   npm кэш: $BEFORE_SIZE → $AFTER_SIZE"
fi

# Очистка node-gyp кэша
if [ -d "/root/.cache/node-gyp" ]; then
    BEFORE_SIZE=$(du -sh /root/.cache/node-gyp 2>/dev/null | cut -f1 || echo "0")
    # Оставляем только последнюю версию Node.js
    if [ -d "/root/.cache/node-gyp" ]; then
        LATEST_VERSION=$(ls -t /root/.cache/node-gyp 2>/dev/null | head -1)
        if [ -n "$LATEST_VERSION" ]; then
            find /root/.cache/node-gyp -mindepth 1 -maxdepth 1 ! -name "$LATEST_VERSION" -exec rm -rf {} + 2>/dev/null
        fi
    fi
    AFTER_SIZE=$(du -sh /root/.cache/node-gyp 2>/dev/null | cut -f1 || echo "0")
    echo "   node-gyp кэш: $BEFORE_SIZE → $AFTER_SIZE"
fi

# Очистка временных файлов
TMP_CLEANED=$(find /tmp -type f -mtime +7 2>/dev/null | wc -l)
find /tmp -type f -mtime +7 -delete 2>/dev/null
echo "   Удалено временных файлов из /tmp: $TMP_CLEANED"
echo ""

# ============================================
# 5. ОЧИСТКА ДУБЛИКАТОВ В UPLOADS
# ============================================
echo -e "${CYAN}5️⃣  ПРОВЕРКА UPLOADS НА ДУБЛИКАТЫ${NC}"
echo "----------------------------------------"

if [ -d "$PROJECT_DIR/uploads" ]; then
    UPLOADS_SIZE=$(du -sh "$PROJECT_DIR/uploads" 2>/dev/null | cut -f1 || echo "0")
    UPLOADS_COUNT=$(find "$PROJECT_DIR/uploads" -type f 2>/dev/null | wc -l)
    echo "   Текущий размер uploads: $UPLOADS_SIZE ($UPLOADS_COUNT файлов)"
    
    # Находим дубликаты по размеру (быстрая проверка)
    echo "   Поиск возможных дубликатов..."
    # Это может занять время, поэтому делаем только для файлов > 1MB
    find "$PROJECT_DIR/uploads" -type f -size +1M -exec md5sum {} \; 2>/dev/null | \
        sort | uniq -d -w 32 | wc -l | xargs -I {} echo "   Найдено возможных дубликатов: {}"
fi
echo ""

# ============================================
# 6. ОСТАНОВКА ПРОЦЕССОВ ДЛЯ ОСВОБОЖДЕНИЯ РЕСУРСОВ
# ============================================
echo -e "${CYAN}6️⃣  ОСТАНОВКА ПРОБЛЕМНЫХ ПРОЦЕССОВ${NC}"
echo "----------------------------------------"

# Остановка rsyslogd если он использует много CPU
RSYSLOG_PID=$(ps aux | grep "[r]syslogd" | awk '{print $2}')
if [ -n "$RSYSLOG_PID" ]; then
    RSYSLOG_CPU=$(ps aux | grep "[r]syslogd" | awk '{print $3}')
    if (( $(echo "$RSYSLOG_CPU > 10.0" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${YELLOW}   Перезапуск rsyslogd (CPU: ${RSYSLOG_CPU}%)${NC}"
        systemctl restart rsyslog 2>/dev/null || service rsyslog restart 2>/dev/null
        sleep 2
    fi
fi

# Остановка зависших процессов компиляции
GCC_PROCESSES=$(ps aux | grep "[g]cc\|[n]ode-gyp" | grep -v grep | awk '{print $2}')
if [ -n "$GCC_PROCESSES" ]; then
    echo -e "${YELLOW}   Найдены процессы компиляции, которые могут быть зависшими${NC}"
    echo "   PID: $GCC_PROCESSES"
    echo "   (Оставляем их работать, если они активны)"
fi
echo ""

# ============================================
# ИТОГОВАЯ СТАТИСТИКА
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 ИТОГОВАЯ СТАТИСТИКА${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}📁 Использование диска после очистки:${NC}"
df -h / | tail -1
echo ""

NEW_DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
FREED_SPACE=$((DISK_USAGE - NEW_DISK_USAGE))

if [ "$NEW_DISK_USAGE" -lt 95 ]; then
    echo -e "${GREEN}✅ Диск освобожден! Использование: ${NEW_DISK_USAGE}%${NC}"
    if [ "$FREED_SPACE" -gt 0 ]; then
        echo -e "${GREEN}   Освобождено примерно: ${FREED_SPACE}%${NC}"
    fi
else
    echo -e "${RED}⚠️  Диск все еще заполнен: ${NEW_DISK_USAGE}%${NC}"
    echo -e "${YELLOW}💡 Рекомендации:${NC}"
    echo "   1. Проверьте uploads/ на наличие очень больших файлов"
    echo "   2. Удалите неиспользуемые файлы вручную"
    echo "   3. Рассмотрите возможность расширения диска"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Очистка завершена${NC}"
echo -e "${BLUE}========================================${NC}"
