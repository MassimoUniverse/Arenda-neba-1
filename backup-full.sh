#!/bin/bash

# Скрипт полного бэкапа проекта
# Использование: ./backup-full.sh [путь_к_проекту]

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Определяем директорию проекта
if [ -n "$1" ]; then
    PROJECT_DIR="$1"
else
    # Пытаемся определить автоматически
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    if [ -f "$SCRIPT_DIR/server.js" ] || [ -f "$SCRIPT_DIR/../server.js" ]; then
        PROJECT_DIR="$SCRIPT_DIR"
    else
        # По умолчанию для сервера
        PROJECT_DIR="/opt/arenda-neba"
    fi
fi

# Проверяем существование директории
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Директория не найдена: $PROJECT_DIR${NC}"
    echo "Использование: $0 [путь_к_проекту]"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

# Создаем директорию для бэкапов
BACKUPS_DIR="backups"
mkdir -p "$BACKUPS_DIR"

# Генерируем имя бэкапа с датой и временем
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="backup_${TIMESTAMP}"
BACKUP_PATH="$BACKUPS_DIR/$BACKUP_NAME"

echo -e "${BLUE}📦 Создание полного бэкапа...${NC}"
echo -e "${YELLOW}Проект: $PROJECT_DIR${NC}"
echo -e "${YELLOW}Бэкап: $BACKUP_PATH${NC}"
echo ""

# Создаем директорию бэкапа
mkdir -p "$BACKUP_PATH"

# 1. База данных
echo -e "${YELLOW}📊 Копируем базу данных...${NC}"
if [ -f "database.db" ]; then
    cp "database.db" "$BACKUP_PATH/database.db"
    DB_SIZE=$(du -h "database.db" | cut -f1)
    echo -e "${GREEN}✅ База данных скопирована ($DB_SIZE)${NC}"
else
    echo -e "${RED}⚠️ База данных не найдена${NC}"
fi

# Проверяем другие базы данных
if [ -f "rental.db" ]; then
    cp "rental.db" "$BACKUP_PATH/rental.db"
    echo -e "${GREEN}✅ rental.db скопирована${NC}"
fi

# 2. Папка uploads
echo -e "${YELLOW}📁 Копируем загруженные файлы...${NC}"
if [ -d "uploads" ] && [ "$(ls -A uploads 2>/dev/null)" ]; then
    cp -r "uploads" "$BACKUP_PATH/uploads"
    UPLOADS_SIZE=$(du -sh "uploads" 2>/dev/null | cut -f1)
    echo -e "${GREEN}✅ Загрузки скопированы ($UPLOADS_SIZE)${NC}"
else
    echo -e "${YELLOW}⚠️ Папка uploads пуста или не существует${NC}"
fi

# 3. Все файлы проекта (кроме ненужных)
echo -e "${YELLOW}📄 Копируем файлы проекта...${NC}"

# Копируем основные файлы и папки
FILES_TO_COPY=(
    "server.js"
    "package.json"
    "package-lock.json"
    "init-db.js"
    "webhook-handler.js"
    "*.md"
    "public"
    "deploy.sh"
    "*.sh"
    "*.js"
)

# Копируем файлы
for pattern in "${FILES_TO_COPY[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        cp -r $pattern "$BACKUP_PATH/" 2>/dev/null || true
    fi
done

# Копируем папку deploy если мы не в ней
if [ -d "deploy" ] && [ "$(basename "$PROJECT_DIR")" != "deploy" ]; then
    cp -r "deploy" "$BACKUP_PATH/deploy"
    echo -e "${GREEN}✅ Папка deploy скопирована${NC}"
fi

# Исключаем ненужные папки
rm -rf "$BACKUP_PATH/node_modules" 2>/dev/null
rm -rf "$BACKUP_PATH/.git" 2>/dev/null
rm -rf "$BACKUP_PATH/backups" 2>/dev/null
rm -rf "$BACKUP_PATH/.env" 2>/dev/null

# 4. Создаем файл с информацией о бэкапе
echo -e "${YELLOW}📝 Создаем информацию о бэкапе...${NC}"
cat > "$BACKUP_PATH/BACKUP_INFO.txt" << EOF
========================================
ПОЛНЫЙ БЭКАП ПРОЕКТА
========================================
Дата создания: $(date '+%Y-%m-%d %H:%M:%S')
Версия: $(git rev-parse --short HEAD 2>/dev/null || echo "неизвестно")
Ветка: $(git branch --show-current 2>/dev/null || echo "неизвестно")

Директория проекта: $PROJECT_DIR
Размер бэкапа: $(du -sh "$BACKUP_PATH" 2>/dev/null | cut -f1)

Содержимое:
- database.db: $([ -f "$BACKUP_PATH/database.db" ] && echo "✅" || echo "❌")
- uploads/: $([ -d "$BACKUP_PATH/uploads" ] && echo "✅" || echo "❌")
- server.js: $([ -f "$BACKUP_PATH/server.js" ] && echo "✅" || echo "❌")
- public/: $([ -d "$BACKUP_PATH/public" ] && echo "✅" || echo "❌")

Для восстановления:
1. Скопируйте database.db в корень проекта
2. Скопируйте uploads/ в корень проекта
3. Остальные файлы уже на месте

EOF

echo -e "${GREEN}✅ Информация о бэкапе сохранена${NC}"

# 5. Создаем архив (опционально)
echo ""
read -p "Создать архив .tar.gz? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗜️ Создаем архив...${NC}"
    cd "$BACKUPS_DIR" || exit 1
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    ARCHIVE_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    echo -e "${GREEN}✅ Архив создан: ${BACKUP_NAME}.tar.gz ($ARCHIVE_SIZE)${NC}"
    cd "$PROJECT_DIR" || exit 1
fi

# Итоговая информация
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ БЭКАП ЗАВЕРШЕН!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Путь: ${BLUE}$BACKUP_PATH${NC}"
echo -e "Размер: ${BLUE}$(du -sh "$BACKUP_PATH" 2>/dev/null | cut -f1)${NC}"
echo ""

# Показываем список последних бэкапов
echo -e "${YELLOW}Последние 5 бэкапов:${NC}"
ls -lht "$BACKUPS_DIR" | head -6 | tail -5

echo ""
echo -e "${GREEN}✅ Готово!${NC}"

