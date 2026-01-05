#!/bin/bash

# Скрипт восстановления из бэкапа
# Использование: ./restore-backup.sh [путь_к_бэкапу]

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Определяем директорию проекта
if [ -f "server.js" ]; then
    PROJECT_DIR="$(pwd)"
else
    PROJECT_DIR="/opt/arenda-neba"
fi

cd "$PROJECT_DIR" || exit 1

# Если путь к бэкапу не указан, ищем последний бэкап
if [ -z "$1" ]; then
    BACKUPS_DIR="backups"
    if [ ! -d "$BACKUPS_DIR" ]; then
        echo -e "${RED}❌ Директория бэкапов не найдена: $BACKUPS_DIR${NC}"
        echo ""
        echo "Доступные бэкапы:"
        find . -type d -name "backup_*" -o -name "backups" 2>/dev/null | head -10
        exit 1
    fi
    
    # Находим последний бэкап
    LATEST_BACKUP=$(ls -t "$BACKUPS_DIR" | grep "^backup_" | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        echo -e "${RED}❌ Бэкапы не найдены в $BACKUPS_DIR${NC}"
        echo ""
        echo "Доступные бэкапы:"
        ls -la "$BACKUPS_DIR" 2>/dev/null || echo "Директория пуста"
        exit 1
    fi
    
    BACKUP_PATH="$BACKUPS_DIR/$LATEST_BACKUP"
else
    BACKUP_PATH="$1"
fi

# Проверяем существование бэкапа
if [ ! -d "$BACKUP_PATH" ]; then
    echo -e "${RED}❌ Бэкап не найден: $BACKUP_PATH${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Восстановление из бэкапа...${NC}"
echo -e "${YELLOW}Проект: $PROJECT_DIR${NC}"
echo -e "${YELLOW}Бэкап: $BACKUP_PATH${NC}"
echo ""

# Показываем информацию о бэкапе
if [ -f "$BACKUP_PATH/BACKUP_INFO.txt" ]; then
    echo -e "${BLUE}Информация о бэкапе:${NC}"
    cat "$BACKUP_PATH/BACKUP_INFO.txt"
    echo ""
fi

# Подтверждение
read -p "Продолжить восстановление? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Восстановление отменено${NC}"
    exit 0
fi

# 1. Останавливаем сервер
echo -e "${YELLOW}🛑 Останавливаем сервер...${NC}"
pm2 stop arenda-neba 2>/dev/null || echo "Сервер не запущен или PM2 не установлен"

# 2. Восстанавливаем базу данных
echo -e "${YELLOW}📊 Восстанавливаем базу данных...${NC}"
if [ -f "$BACKUP_PATH/database.db" ]; then
    cp "$BACKUP_PATH/database.db" "$PROJECT_DIR/database.db"
    echo -e "${GREEN}✅ База данных восстановлена${NC}"
else
    echo -e "${RED}⚠️ База данных не найдена в бэкапе${NC}"
fi

# 3. Восстанавливаем загрузки
echo -e "${YELLOW}📁 Восстанавливаем загруженные файлы...${NC}"
if [ -d "$BACKUP_PATH/uploads" ]; then
    rm -rf "$PROJECT_DIR/uploads" 2>/dev/null
    cp -r "$BACKUP_PATH/uploads" "$PROJECT_DIR/uploads"
    echo -e "${GREEN}✅ Загрузки восстановлены${NC}"
else
    echo -e "${YELLOW}⚠️ Папка uploads не найдена в бэкапе${NC}"
fi

# 4. Восстанавливаем файлы проекта (опционально)
read -p "Восстановить файлы проекта (server.js, public/, etc.)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📄 Восстанавливаем файлы проекта...${NC}"
    
    # Восстанавливаем server.js
    if [ -f "$BACKUP_PATH/server.js" ]; then
        cp "$BACKUP_PATH/server.js" "$PROJECT_DIR/server.js"
        echo -e "${GREEN}✅ server.js восстановлен${NC}"
    fi
    
    # Восстанавливаем public/
    if [ -d "$BACKUP_PATH/public" ]; then
        rm -rf "$PROJECT_DIR/public" 2>/dev/null
        cp -r "$BACKUP_PATH/public" "$PROJECT_DIR/public"
        echo -e "${GREEN}✅ public/ восстановлена${NC}"
    fi
    
    # Восстанавливаем package.json
    if [ -f "$BACKUP_PATH/package.json" ]; then
        cp "$BACKUP_PATH/package.json" "$PROJECT_DIR/package.json"
        echo -e "${GREEN}✅ package.json восстановлен${NC}"
    fi
fi

# 5. Устанавливаем зависимости (если нужно)
read -p "Установить зависимости (npm install)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📦 Устанавливаем зависимости...${NC}"
    npm install
    echo -e "${GREEN}✅ Зависимости установлены${NC}"
fi

# 6. Перезапускаем сервер
echo -e "${YELLOW}🔄 Перезапускаем сервер...${NC}"
pm2 restart arenda-neba 2>/dev/null || pm2 start server.js --name arenda-neba

# Итоговая информация
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Статус сервера:"
pm2 status arenda-neba 2>/dev/null || echo "PM2 не установлен или сервер не запущен"
echo ""
echo -e "${GREEN}✅ Готово!${NC}"

