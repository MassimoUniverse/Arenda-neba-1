#!/bin/bash

# Скрипт для проверки конкретного загруженного изображения
# Использование: ./verify-uploaded-image.sh

echo "🔍 ПРОВЕРКА ЗАГРУЖЕННОГО ИЗОБРАЖЕНИЯ"
echo "====================================="
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/opt/arenda-neba"
cd "$PROJECT_DIR" || exit 1

# Изображение из логов
IMAGE_PATH="/uploads/автовышка-13-метров-main-image-1768822908711.webp"
IMAGE_FILE="uploads/автовышка-13-метров-main-image-1768822908711.webp"

echo "📸 Проверяем изображение: $IMAGE_PATH"
echo ""

# 1. Проверка существования файла
echo "1️⃣  ПРОВЕРКА ФАЙЛА"
echo "------------------"
if [ -f "$IMAGE_FILE" ]; then
    SIZE=$(du -h "$IMAGE_FILE" | cut -f1)
    PERMS=$(ls -l "$IMAGE_FILE" | awk '{print $1}')
    echo -e "${GREEN}✅ Файл существует${NC}"
    echo "   Размер: $SIZE"
    echo "   Права: $PERMS"
else
    echo -e "${RED}❌ Файл НЕ найден!${NC}"
    echo "   Путь: $IMAGE_FILE"
    echo ""
    echo "   Поиск похожих файлов:"
    find uploads -name "*автовышка*13*" -o -name "*13*метров*" 2>/dev/null | head -10
fi
echo ""

# 2. Проверка в базе данных
echo "2️⃣  ПРОВЕРКА В БАЗЕ ДАННЫХ"
echo "---------------------------"
if command -v sqlite3 &> /dev/null && [ -f "database.db" ]; then
    DB_RESULT=$(sqlite3 database.db "SELECT id, title, image_url FROM services WHERE image_url LIKE '%13%метров%' OR image_url LIKE '%13-metrov%' OR title LIKE '%13%метров%' LIMIT 5;" 2>/dev/null)
    
    if [ -n "$DB_RESULT" ]; then
        echo -e "${GREEN}✅ Найдены записи в базе данных:${NC}"
        echo "$DB_RESULT" | while IFS='|' read -r id title image_url; do
            echo "   ID: $id"
            echo "   Название: $title"
            echo "   image_url: $image_url"
            
            # Проверяем существование файла
            if [ -n "$image_url" ]; then
                FILE_PATH=$(echo "$image_url" | sed 's|^/||')
                if [ -f "$FILE_PATH" ]; then
                    echo -e "   Статус файла: ${GREEN}✅ Существует${NC}"
                else
                    echo -e "   Статус файла: ${RED}❌ НЕ найден${NC}"
                fi
            fi
            echo ""
        done
    else
        echo -e "${YELLOW}⚠️  Записи не найдены в базе данных${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  sqlite3 не установлен или база данных недоступна${NC}"
fi
echo ""

# 3. Проверка популярных карточек
echo "3️⃣  ПРОВЕРКА ПОПУЛЯРНЫХ КАРТОЧЕК"
echo "--------------------------------"
if command -v sqlite3 &> /dev/null && [ -f "database.db" ]; then
    POPULAR=$(sqlite3 database.db "SELECT id, title, image_url, is_popular FROM services WHERE title LIKE '%13%метров%' LIMIT 1;" 2>/dev/null)
    
    if [ -n "$POPULAR" ]; then
        echo "$POPULAR" | while IFS='|' read -r id title image_url is_popular; do
            echo "   Название: $title"
            echo "   image_url: $image_url"
            echo "   is_popular: $is_popular"
            
            if [ "$is_popular" = "1" ]; then
                echo -e "   Статус: ${GREEN}✅ В популярных карточках${NC}"
            else
                echo -e "   Статус: ${YELLOW}⚠️  НЕ в популярных карточках${NC}"
            fi
        done
    else
        echo -e "${YELLOW}⚠️  Услуга не найдена в базе данных${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  sqlite3 не установлен или база данных недоступна${NC}"
fi
echo ""

# 4. Проверка HTTP доступа
echo "4️⃣  ПРОВЕРКА HTTP ДОСТУПА"
echo "-------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$IMAGE_PATH" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Изображение доступно по HTTP (код: $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Изображение НЕ доступно по HTTP (код: $HTTP_CODE)${NC}"
    echo "   URL: http://localhost:3000$IMAGE_PATH"
fi
echo ""

# 5. Проверка всех файлов в uploads
echo "5️⃣  ВСЕ ФАЙЛЫ В UPLOADS"
echo "-----------------------"
FILE_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
echo "   Всего файлов: $FILE_COUNT"

if [ "$FILE_COUNT" -gt 0 ]; then
    echo ""
    echo "   Последние 10 файлов:"
    find uploads -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -10 | while read timestamp filepath; do
        filename=$(basename "$filepath")
        size=$(du -h "$filepath" 2>/dev/null | cut -f1 || echo "unknown")
        date=$(date -d "@${timestamp%.*}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "N/A")
        echo "     $date - $filename ($size)"
    done
fi
echo ""

echo "✅ Проверка завершена"
