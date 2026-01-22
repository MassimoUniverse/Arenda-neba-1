#!/bin/bash

# Скрипт для поиска и удаления больших файлов
# Использование: ./find-and-clean-large-files.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}🔍 ПОИСК И УДАЛЕНИЕ БОЛЬШИХ ФАЙЛОВ${NC}"
echo -e "${RED}========================================${NC}"
echo ""

PROJECT_DIR="/opt/arenda-neba"
cd "$PROJECT_DIR" 2>/dev/null || cd /root

# ============================================
# 1. ПОИСК БОЛЬШИХ ФАЙЛОВ (исключая /proc, /sys, /dev)
# ============================================
echo -e "${CYAN}1️⃣  ПОИСК БОЛЬШИХ ДИРЕКТОРИЙ${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📊 ТОП-20 самых больших директорий (исключая /proc, /sys, /dev):${NC}"
du -h --max-depth=1 / 2>/dev/null | grep -vE "^[0-9]+K\s+/proc|^[0-9]+K\s+/sys|^[0-9]+K\s+/dev" | sort -rh | head -20
echo ""

# ============================================
# 2. ПОИСК БОЛЬШИХ ФАЙЛОВ В /opt/arenda-neba
# ============================================
echo -e "${CYAN}2️⃣  ПОИСК БОЛЬШИХ ФАЙЛОВ В ПРОЕКТЕ${NC}"
echo "----------------------------------------"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}📊 ТОП-20 самых больших файлов/папок в проекте:${NC}"
    du -h --max-depth=2 "$PROJECT_DIR" 2>/dev/null | sort -rh | head -20
    echo ""
    
    # Проверка uploads
    if [ -d "$PROJECT_DIR/uploads" ]; then
        echo -e "${YELLOW}📊 Размер uploads:${NC}"
        du -sh "$PROJECT_DIR/uploads" 2>/dev/null
        echo -e "${YELLOW}📊 ТОП-10 самых больших файлов в uploads:${NC}"
        find "$PROJECT_DIR/uploads" -type f -exec du -h {} + 2>/dev/null | sort -rh | head -10
        echo ""
    fi
    
    # Проверка node_modules
    if [ -d "$PROJECT_DIR/node_modules" ]; then
        echo -e "${YELLOW}📊 Размер node_modules:${NC}"
        du -sh "$PROJECT_DIR/node_modules" 2>/dev/null
        echo ""
    fi
fi

# ============================================
# 3. ПОИСК БОЛЬШИХ ФАЙЛОВ В /var/log
# ============================================
echo -e "${CYAN}3️⃣  ПОИСК БОЛЬШИХ ЛОГОВ${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📊 ТОП-10 самых больших файлов в /var/log:${NC}"
find /var/log -type f -size +10M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -rh | head -10
echo ""

# ============================================
# 4. ПОИСК БОЛЬШИХ ФАЙЛОВ В /root/.pm2
# ============================================
echo -e "${CYAN}4️⃣  ПОИСК БОЛЬШИХ PM2 ЛОГОВ${NC}"
echo "----------------------------------------"
if [ -d "/root/.pm2/logs" ]; then
    echo -e "${YELLOW}📊 Размер PM2 логов:${NC}"
    du -sh /root/.pm2/logs 2>/dev/null
    echo -e "${YELLOW}📊 ТОП-10 самых больших PM2 логов:${NC}"
    find /root/.pm2/logs -type f -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -rh | head -10
    echo ""
fi

# ============================================
# 5. ПОИСК БОЛЬШИХ БЭКАПОВ
# ============================================
echo -e "${CYAN}5️⃣  ПОИСК БОЛЬШИХ БЭКАПОВ${NC}"
echo "----------------------------------------"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}📊 Бэкапы базы данных:${NC}"
    find "$PROJECT_DIR" -name "database_backup_*.db" -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}'
    echo ""
    
    echo -e "${YELLOW}📊 Бэкапы uploads:${NC}"
    find "$PROJECT_DIR" -type d -name "uploads_backup_*" -exec du -sh {} \; 2>/dev/null | sort -rh
    echo ""
fi

# ============================================
# 6. АГРЕССИВНАЯ ОЧИСТКА
# ============================================
echo -e "${CYAN}6️⃣  АГРЕССИВНАЯ ОЧИСТКА${NC}"
echo "----------------------------------------"

# Очистка PM2 логов (обрезаем до 100 строк)
echo -e "${YELLOW}🗑️  Обрезка PM2 логов до 100 строк...${NC}"
for log in /root/.pm2/logs/*.log; do
    if [ -f "$log" ]; then
        SIZE=$(du -h "$log" 2>/dev/null | cut -f1)
        tail -100 "$log" > "${log}.tmp" 2>/dev/null && mv "${log}.tmp" "$log" 2>/dev/null
        echo "   ✅ $log (было: $SIZE)"
    fi
done
echo ""

# Удаление ВСЕХ старых бэкапов (не только старше 1 дня)
echo -e "${YELLOW}🗑️  Удаление ВСЕХ старых бэкапов...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    # Оставляем только 1 самый новый бэкап БД
    DB_BACKUPS=$(find "$PROJECT_DIR" -name "database_backup_*.db" 2>/dev/null | wc -l)
    if [ "$DB_BACKUPS" -gt 1 ]; then
        find "$PROJECT_DIR" -name "database_backup_*.db" -printf '%T@ %p\n' 2>/dev/null | sort -rn | tail -n +2 | cut -d' ' -f2- | xargs rm -f 2>/dev/null
        echo "   ✅ Удалено старых бэкапов БД: $((DB_BACKUPS - 1))"
    fi
    
    # Оставляем только 1 самую новую папку uploads_backup
    UPLOADS_BACKUPS=$(find "$PROJECT_DIR" -type d -name "uploads_backup_*" 2>/dev/null | wc -l)
    if [ "$UPLOADS_BACKUPS" -gt 1 ]; then
        find "$PROJECT_DIR" -type d -name "uploads_backup_*" -printf '%T@ %p\n' 2>/dev/null | sort -rn | tail -n +2 | cut -d' ' -f2- | xargs rm -rf 2>/dev/null
        echo "   ✅ Удалено старых бэкапов uploads: $((UPLOADS_BACKUPS - 1))"
    fi
fi
echo ""

# Удаление всех .gz логов
echo -e "${YELLOW}🗑️  Удаление всех .gz архивов логов...${NC}"
GZ_COUNT=$(find /var/log -type f -name "*.gz" 2>/dev/null | wc -l)
find /var/log -type f -name "*.gz" -delete 2>/dev/null
echo "   ✅ Удалено архивов: $GZ_COUNT"
echo ""

# Очистка node-gyp кэша полностью
echo -e "${YELLOW}🗑️  Полная очистка node-gyp кэша...${NC}"
if [ -d "/root/.cache/node-gyp" ]; then
    BEFORE=$(du -sh /root/.cache/node-gyp 2>/dev/null | cut -f1)
    rm -rf /root/.cache/node-gyp/*
    AFTER=$(du -sh /root/.cache/node-gyp 2>/dev/null | cut -f1 || echo "0")
    echo "   ✅ Было: $BEFORE → Стало: $AFTER"
fi
echo ""

# Очистка npm кэша
echo -e "${YELLOW}🗑️  Очистка npm кэша...${NC}"
npm cache clean --force 2>/dev/null
echo "   ✅ Готово"
echo ""

# Удаление временных файлов
echo -e "${YELLOW}🗑️  Удаление временных файлов...${NC}"
find /tmp -type f -delete 2>/dev/null
find /var/tmp -type f -delete 2>/dev/null
echo "   ✅ Готово"
echo ""

# ============================================
# 7. ИТОГОВАЯ ПРОВЕРКА
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 ИТОГОВАЯ СТАТИСТИКА${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}📁 Использование диска после очистки:${NC}"
df -h / | tail -1
echo ""

DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 95 ]; then
    echo -e "${GREEN}✅ Диск освобожден! Использование: ${DISK_USAGE}%${NC}"
else
    echo -e "${RED}⚠️  Диск все еще заполнен: ${DISK_USAGE}%${NC}"
    echo ""
    echo -e "${YELLOW}💡 Рекомендации:${NC}"
    echo "   1. Проверьте uploads/ на наличие очень больших файлов"
    echo "   2. Проверьте node_modules/ (может быть очень большим)"
    echo "   3. Рассмотрите удаление неиспользуемых файлов вручную"
    echo ""
    echo "   Команды для проверки:"
    echo "   du -h /opt/arenda-neba/uploads/* | sort -rh | head -20"
    echo "   du -h /opt/arenda-neba/node_modules | sort -rh | head -20"
fi
