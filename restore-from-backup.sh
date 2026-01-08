#!/bin/bash

# Скрипт для восстановления файлов из бэкапа на сервере
# Использование: ./restore-from-backup.sh [backup_name]
# Пример: ./restore-from-backup.sh backup_2026-01-04_22-41-24

set -e  # Остановить при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Путь к проекту на сервере
PROJECT_DIR="/opt/arenda-neba"
BACKUP_DIR="$PROJECT_DIR/backups"

# Определяем имя бэкапа
if [ -z "$1" ]; then
    # Если не указан, используем последний бэкап
    BACKUP_NAME=$(ls -t "$BACKUP_DIR" | grep "^backup_" | head -1)
    if [ -z "$BACKUP_NAME" ]; then
        echo -e "${RED}❌ Бэкапы не найдены в $BACKUP_DIR${NC}"
        exit 1
    fi
    echo -e "${YELLOW}⚠️  Имя бэкапа не указано, используем последний: $BACKUP_NAME${NC}"
else
    BACKUP_NAME="$1"
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Проверяем существование бэкапа
if [ ! -d "$BACKUP_PATH" ]; then
    echo -e "${RED}❌ Бэкап не найден: $BACKUP_PATH${NC}"
    echo -e "${YELLOW}Доступные бэкапы:${NC}"
    ls -1 "$BACKUP_DIR" | grep "^backup_" || echo "Нет доступных бэкапов"
    exit 1
fi

echo -e "${GREEN}✅ Бэкап найден: $BACKUP_NAME${NC}"
echo -e "${YELLOW}📦 Восстановление из: $BACKUP_PATH${NC}"

# Переходим в директорию проекта
cd "$PROJECT_DIR" || exit 1

# Останавливаем сервер (если запущен через PM2)
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⏸️  Останавливаем сервер...${NC}"
    pm2 stop arenda-neba 2>/dev/null || true
fi

# Создаем резервную копию текущих файлов перед восстановлением
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_CURRENT_DIR="$BACKUP_DIR/before_restore_$TIMESTAMP"
echo -e "${YELLOW}💾 Создаем резервную копию текущих файлов в: $BACKUP_CURRENT_DIR${NC}"
mkdir -p "$BACKUP_CURRENT_DIR"

# Копируем текущие файлы
if [ -f "database.db" ]; then
    cp "database.db" "$BACKUP_CURRENT_DIR/" 2>/dev/null || true
fi
if [ -d "public" ]; then
    cp -r "public" "$BACKUP_CURRENT_DIR/" 2>/dev/null || true
fi
if [ -f "server.js" ]; then
    cp "server.js" "$BACKUP_CURRENT_DIR/" 2>/dev/null || true
fi
if [ -f "package.json" ]; then
    cp "package.json" "$BACKUP_CURRENT_DIR/" 2>/dev/null || true
fi

echo -e "${GREEN}✅ Резервная копия создана${NC}"

# Восстанавливаем базу данных
if [ -f "$BACKUP_PATH/database.db" ]; then
    echo -e "${YELLOW}📊 Восстанавливаем базу данных...${NC}"
    cp "$BACKUP_PATH/database.db" "$PROJECT_DIR/database.db"
    echo -e "${GREEN}✅ База данных восстановлена${NC}"
else
    echo -e "${YELLOW}⚠️  База данных не найдена в бэкапе${NC}"
fi

# Восстанавливаем папку public
if [ -d "$BACKUP_PATH/public" ]; then
    echo -e "${YELLOW}📁 Восстанавливаем папку public...${NC}"
    rm -rf "$PROJECT_DIR/public"
    cp -r "$BACKUP_PATH/public" "$PROJECT_DIR/"
    echo -e "${GREEN}✅ Папка public восстановлена${NC}"
else
    echo -e "${YELLOW}⚠️  Папка public не найдена в бэкапе${NC}"
fi

# Восстанавливаем server.js
if [ -f "$BACKUP_PATH/server.js" ]; then
    echo -e "${YELLOW}⚙️  Восстанавливаем server.js...${NC}"
    cp "$BACKUP_PATH/server.js" "$PROJECT_DIR/server.js"
    echo -e "${GREEN}✅ server.js восстановлен${NC}"
else
    echo -e "${YELLOW}⚠️  server.js не найден в бэкапе${NC}"
fi

# Восстанавливаем package.json
if [ -f "$BACKUP_PATH/package.json" ]; then
    echo -e "${YELLOW}📦 Восстанавливаем package.json...${NC}"
    cp "$BACKUP_PATH/package.json" "$PROJECT_DIR/package.json"
    echo -e "${GREEN}✅ package.json восстановлен${NC}"
    
    # Устанавливаем зависимости, если нужно
    echo -e "${YELLOW}📥 Проверяем зависимости...${NC}"
    npm install --production 2>/dev/null || true
fi

# Восстанавливаем init-db.js, если есть
if [ -f "$BACKUP_PATH/init-db.js" ]; then
    echo -e "${YELLOW}🔧 Восстанавливаем init-db.js...${NC}"
    cp "$BACKUP_PATH/init-db.js" "$PROJECT_DIR/init-db.js"
    echo -e "${GREEN}✅ init-db.js восстановлен${NC}"
fi

# Восстанавливаем uploads, если есть
if [ -d "$BACKUP_PATH/uploads" ]; then
    echo -e "${YELLOW}📤 Восстанавливаем папку uploads...${NC}"
    rm -rf "$PROJECT_DIR/uploads"
    cp -r "$BACKUP_PATH/uploads" "$PROJECT_DIR/"
    echo -e "${GREEN}✅ Папка uploads восстановлена${NC}"
fi

# Запускаем сервер
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}▶️  Запускаем сервер...${NC}"
    pm2 restart arenda-neba 2>/dev/null || pm2 start server.js --name arenda-neba
    echo -e "${GREEN}✅ Сервер запущен${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 не найден, запустите сервер вручную: node server.js${NC}"
fi

echo -e "${GREEN}✅ Восстановление завершено!${NC}"
echo -e "${YELLOW}📋 Восстановлено из: $BACKUP_NAME${NC}"
echo -e "${YELLOW}💾 Резервная копия текущих файлов: before_restore_$TIMESTAMP${NC}"
