#!/bin/bash

# Скрипт для поиска бэкапов на сервере
# Использование: ./find-backup.sh

echo "🔍 Поиск бэкапов на сервере..."
echo ""

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Места для поиска
SEARCH_PATHS=(
    "/opt/arenda-neba/backups"
    "/opt/arenda-neba"
    "/root/backups"
    "/root"
    "/home/backups"
    "/var/backups"
    "/tmp"
)

# Ищем папки с бэкапами
echo -e "${BLUE}📁 Ищем папки с бэкапами...${NC}"
echo ""

FOUND_BACKUPS=0

for path in "${SEARCH_PATHS[@]}"; do
    if [ -d "$path" ]; then
        # Ищем папки, содержащие "backup" в названии
        BACKUP_DIRS=$(find "$path" -maxdepth 2 -type d -name "*backup*" 2>/dev/null)
        
        if [ ! -z "$BACKUP_DIRS" ]; then
            echo -e "${GREEN}✅ Найдено в: $path${NC}"
            echo "$BACKUP_DIRS" | while read dir; do
                if [ -d "$dir" ]; then
                    echo -e "   📦 $dir"
                    # Показываем содержимое
                    if [ -f "$dir/database.db" ] || [ -d "$dir/public" ]; then
                        echo -e "      ✅ Содержит файлы проекта"
                        if [ -f "$dir/database.db" ]; then
                            SIZE=$(du -h "$dir/database.db" | cut -f1)
                            echo -e "         📊 database.db ($SIZE)"
                        fi
                        if [ -d "$dir/public" ]; then
                            FILES=$(find "$dir/public" -type f | wc -l)
                            echo -e "         📁 public/ ($FILES файлов)"
                        fi
                    fi
                    FOUND_BACKUPS=1
                fi
            done
            echo ""
        fi
    fi
done

# Ищем файлы database.db
echo -e "${BLUE}📊 Ищем файлы database.db...${NC}"
echo ""

DB_FILES=$(find /opt /root /home /var -name "database.db" -type f 2>/dev/null | head -10)

if [ ! -z "$DB_FILES" ]; then
    echo "$DB_FILES" | while read db_file; do
        DIR=$(dirname "$db_file")
        echo -e "${GREEN}✅ Найден: $db_file${NC}"
        SIZE=$(du -h "$db_file" | cut -f1)
        DATE=$(stat -c %y "$db_file" 2>/dev/null | cut -d' ' -f1)
        echo -e "   📊 Размер: $SIZE"
        echo -e "   📅 Дата: $DATE"
        
        # Проверяем, есть ли рядом папка public
        if [ -d "$DIR/public" ]; then
            echo -e "   ✅ Есть папка public/"
        fi
        
        # Проверяем, есть ли рядом server.js
        if [ -f "$DIR/server.js" ]; then
            echo -e "   ✅ Есть server.js"
        fi
        
        echo ""
    done
else
    echo -e "${YELLOW}⚠️  Файлы database.db не найдены${NC}"
    echo ""
fi

# Ищем по дате бэкапа
BACKUP_NAME="backup_2026-01-04_22-41-24"
echo -e "${BLUE}🔍 Ищем конкретный бэкап: $BACKUP_NAME${NC}"
echo ""

FOUND=$(find /opt /root /home /var -type d -name "$BACKUP_NAME" 2>/dev/null)

if [ ! -z "$FOUND" ]; then
    echo -e "${GREEN}✅ Найден:${NC}"
    echo "$FOUND" | while read backup_path; do
        echo -e "   📦 $backup_path"
        if [ -d "$backup_path" ]; then
            echo -e "      Содержимое:"
            ls -lh "$backup_path" | head -10
        fi
    done
else
    echo -e "${YELLOW}⚠️  Бэкап $BACKUP_NAME не найден${NC}"
    echo ""
    echo -e "${YELLOW}💡 Попробуйте найти похожие бэкапы:${NC}"
    find /opt /root /home /var -type d -name "*2026-01-04*" 2>/dev/null | head -5
fi

echo ""
echo -e "${BLUE}📋 Проверяем текущую директорию проекта:${NC}"
CURRENT_DIR="/opt/arenda-neba"
if [ -d "$CURRENT_DIR" ]; then
    echo -e "${GREEN}✅ Проект находится в: $CURRENT_DIR${NC}"
    echo ""
    echo "Содержимое:"
    ls -lh "$CURRENT_DIR" | head -15
    echo ""
    
    if [ -d "$CURRENT_DIR/backups" ]; then
        echo -e "${GREEN}✅ Папка backups существует${NC}"
        echo "Содержимое backups:"
        ls -lh "$CURRENT_DIR/backups" | head -10
    else
        echo -e "${YELLOW}⚠️  Папка backups не существует${NC}"
        echo -e "${YELLOW}💡 Создать папку? (y/n)${NC}"
    fi
fi

echo ""
echo -e "${BLUE}💡 Рекомендации:${NC}"
echo "1. Если бэкап на локальной машине, скопируйте его на сервер:"
echo "   scp -r 'F:/New site/backups/backup_2026-01-04_22-41-24' root@91.222.237.34:/opt/arenda-neba/backups/"
echo ""
echo "2. Или используйте текущие файлы проекта (если они актуальны)"
echo "3. Проверьте, может быть бэкап в другом месте"
