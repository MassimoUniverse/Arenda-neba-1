#!/bin/bash

# Скрипт для удаления всех временных директорий uploads_temp_* и старых бэкапов
# Использование: ./delete-temp-backups.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}🗑️  УДАЛЕНИЕ ВРЕМЕННЫХ ФАЙЛОВ И БЭКАПОВ${NC}"
echo -e "${RED}========================================${NC}"
echo ""

PROJECT_DIR="/opt/arenda-neba"
cd "$PROJECT_DIR" || exit 1

# Проверка текущего использования диска
echo -e "${YELLOW}📊 Использование диска ДО очистки:${NC}"
df -h / | tail -1
echo ""

# ============================================
# 1. УДАЛЕНИЕ ВСЕХ uploads_temp_* ДИРЕКТОРИЙ
# ============================================
echo -e "${CYAN}1️⃣  УДАЛЕНИЕ ВСЕХ uploads_temp_* ДИРЕКТОРИЙ${NC}"
echo "----------------------------------------"

TEMP_DIRS=$(find . -type d -name "uploads_temp_*" 2>/dev/null | wc -l)
if [ "$TEMP_DIRS" -gt 0 ]; then
    echo -e "${YELLOW}   Найдено временных директорий: $TEMP_DIRS${NC}"
    
    # Подсчет размера перед удалением
    TOTAL_SIZE=$(du -sh uploads_temp_* 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
    echo "   Примерный размер: ~${TOTAL_SIZE}"
    
    # Удаление
    find . -type d -name "uploads_temp_*" -exec rm -rf {} + 2>/dev/null
    echo -e "${GREEN}   ✅ Все uploads_temp_* директории удалены${NC}"
else
    echo -e "${GREEN}   ✅ Временных директорий не найдено${NC}"
fi
echo ""

# ============================================
# 2. УДАЛЕНИЕ СТАРЫХ uploads_backup_* ДИРЕКТОРИЙ
# ============================================
echo -e "${CYAN}2️⃣  УДАЛЕНИЕ СТАРЫХ uploads_backup_* ДИРЕКТОРИЙ${NC}"
echo "----------------------------------------"

BACKUP_DIRS=$(find . -type d -name "uploads_backup_*" 2>/dev/null | wc -l)
if [ "$BACKUP_DIRS" -gt 0 ]; then
    echo -e "${YELLOW}   Найдено бэкапов: $BACKUP_DIRS${NC}"
    
    # Оставляем только 1 самый новый бэкап
    if [ "$BACKUP_DIRS" -gt 1 ]; then
        echo "   Оставляем только 1 самый новый бэкап..."
        
        # Находим самый новый бэкап
        LATEST_BACKUP=$(find . -type d -name "uploads_backup_*" -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
        
        if [ -n "$LATEST_BACKUP" ]; then
            echo "   Сохраняем: $LATEST_BACKUP"
            
            # Удаляем все остальные
            find . -type d -name "uploads_backup_*" ! -path "$LATEST_BACKUP" -exec rm -rf {} + 2>/dev/null
            echo -e "${GREEN}   ✅ Удалено старых бэкапов: $((BACKUP_DIRS - 1))${NC}"
        else
            # Если не удалось определить самый новый, удаляем все
            find . -type d -name "uploads_backup_*" -exec rm -rf {} + 2>/dev/null
            echo -e "${GREEN}   ✅ Удалено всех бэкапов: $BACKUP_DIRS${NC}"
        fi
    else
        echo -e "${GREEN}   ✅ Только 1 бэкап, оставляем его${NC}"
    fi
else
    echo -e "${GREEN}   ✅ Бэкапов не найдено${NC}"
fi
echo ""

# ============================================
# 3. УДАЛЕНИЕ СТАРЫХ database_backup_*.db
# ============================================
echo -e "${CYAN}3️⃣  УДАЛЕНИЕ СТАРЫХ database_backup_*.db${NC}"
echo "----------------------------------------"

DB_BACKUPS=$(find . -name "database_backup_*.db" 2>/dev/null | wc -l)
if [ "$DB_BACKUPS" -gt 0 ]; then
    echo -e "${YELLOW}   Найдено бэкапов БД: $DB_BACKUPS${NC}"
    
    # Оставляем только 1 самый новый
    if [ "$DB_BACKUPS" -gt 1 ]; then
        LATEST_DB=$(find . -name "database_backup_*.db" -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
        
        if [ -n "$LATEST_DB" ]; then
            echo "   Сохраняем: $LATEST_DB"
            find . -name "database_backup_*.db" ! -name "$(basename "$LATEST_DB")" -delete 2>/dev/null
            echo -e "${GREEN}   ✅ Удалено старых бэкапов БД: $((DB_BACKUPS - 1))${NC}"
        else
            find . -name "database_backup_*.db" -delete 2>/dev/null
            echo -e "${GREEN}   ✅ Удалено всех бэкапов БД: $DB_BACKUPS${NC}"
        fi
    else
        echo -e "${GREEN}   ✅ Только 1 бэкап БД, оставляем его${NC}"
    fi
else
    echo -e "${GREEN}   ✅ Бэкапов БД не найдено${NC}"
fi
echo ""

# ============================================
# 4. ПРОВЕРКА РЕЗУЛЬТАТА
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 РЕЗУЛЬТАТ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}📁 Использование диска ПОСЛЕ очистки:${NC}"
df -h / | tail -1
echo ""

DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
FREED_SPACE=$((100 - DISK_USAGE))

if [ "$DISK_USAGE" -lt 95 ]; then
    echo -e "${GREEN}✅ Диск успешно освобожден!${NC}"
    echo -e "${GREEN}   Использование: ${DISK_USAGE}%${NC}"
    echo -e "${GREEN}   Свободно: ~${FREED_SPACE}%${NC}"
else
    echo -e "${YELLOW}⚠️  Диск все еще заполнен: ${DISK_USAGE}%${NC}"
    echo "   Проверьте другие директории:"
    echo "   du -h --max-depth=2 . | sort -rh | head -20"
fi
echo ""

# Проверка оставшихся больших директорий
echo -e "${YELLOW}📊 ТОП-10 самых больших директорий в проекте:${NC}"
du -h --max-depth=1 . 2>/dev/null | sort -rh | head -10
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Очистка завершена${NC}"
echo -e "${BLUE}========================================${NC}"
