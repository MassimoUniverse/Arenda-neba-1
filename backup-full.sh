#!/bin/bash

# Скрипт полного бэкапа проекта
# Использование:
#   ./backup-full.sh [путь_к_проекту] [--archive|--no-archive]
#   CREATE_ARCHIVE=1 ./backup-full.sh
#   CREATE_ARCHIVE=0 ./backup-full.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Парсинг флагов
CREATE_ARCHIVE=""
for arg in "$@"; do
    case "$arg" in
        --archive|-a)
            CREATE_ARCHIVE="1"
            ;;
        --no-archive|-n)
            CREATE_ARCHIVE="0"
            ;;
    esac
done

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
    # Для SQLite безопаснее использовать .backup, если есть sqlite3 CLI
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "database.db" ".backup '$BACKUP_PATH/database.db'" >/dev/null 2>&1 || cp "database.db" "$BACKUP_PATH/database.db"
    else
    cp "database.db" "$BACKUP_PATH/database.db"
    fi
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

# 2.1 .env (важно для полного восстановления)
echo -e "${YELLOW}🔐 Копируем .env (если есть)...${NC}"
if [ -f ".env" ]; then
    cp ".env" "$BACKUP_PATH/.env"
    chmod 600 "$BACKUP_PATH/.env" 2>/dev/null || true
    echo -e "${GREEN}✅ .env скопирован (права 600)${NC}"
else
    echo -e "${YELLOW}⚠️ .env не найден${NC}"
fi

# 2.2 PM2 dump (если есть) — пригодится для восстановления процессов
echo -e "${YELLOW}🧩 Копируем PM2 dump (если доступен)...${NC}"
PM2_DUMP="${HOME}/.pm2/dump.pm2"
if [ -f "$PM2_DUMP" ]; then
    mkdir -p "$BACKUP_PATH/pm2"
    cp "$PM2_DUMP" "$BACKUP_PATH/pm2/dump.pm2"
    echo -e "${GREEN}✅ PM2 dump скопирован${NC}"
else
    echo -e "${YELLOW}⚠️ PM2 dump не найден${NC}"
fi

# 2.3 Nginx конфиги (если доступно) — опционально
echo -e "${YELLOW}🌐 Копируем конфиги nginx (если доступно)...${NC}"
NGINX_BACKUP_DIR="$BACKUP_PATH/nginx"
mkdir -p "$NGINX_BACKUP_DIR" 2>/dev/null || true
for f in /etc/nginx/nginx.conf /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*; do
    if [ -r "$f" ]; then
        # Копируем только файлы, директории пропускаем
        if [ -f "$f" ]; then
            cp "$f" "$NGINX_BACKUP_DIR/" 2>/dev/null || true
        fi
    fi
done
if [ "$(ls -A "$NGINX_BACKUP_DIR" 2>/dev/null)" ]; then
    echo -e "${GREEN}✅ Конфиги nginx скопированы (что было доступно)${NC}"
else
    rmdir "$NGINX_BACKUP_DIR" 2>/dev/null || true
    echo -e "${YELLOW}⚠️ Конфиги nginx недоступны/не найдены (нужны права root)${NC}"
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
- .env: $([ -f "$BACKUP_PATH/.env" ] && echo "✅" || echo "❌")
- server.js: $([ -f "$BACKUP_PATH/server.js" ] && echo "✅" || echo "❌")
- public/: $([ -d "$BACKUP_PATH/public" ] && echo "✅" || echo "❌")
- pm2 dump: $([ -f "$BACKUP_PATH/pm2/dump.pm2" ] && echo "✅" || echo "❌")
- nginx conf: $([ -d "$BACKUP_PATH/nginx" ] && echo "✅" || echo "❌")

Для восстановления:
1. Скопируйте database.db в корень проекта
2. Скопируйте uploads/ в корень проекта
3. Остальные файлы уже на месте

EOF

echo -e "${GREEN}✅ Информация о бэкапе сохранена${NC}"

# 5. Создаем архив (опционально)
echo ""
if [ -z "$CREATE_ARCHIVE" ]; then
    # Если задано через env — используем его
    if [ -n "$CREATE_ARCHIVE" ]; then
        :
    fi
fi

# Если CREATE_ARCHIVE не задан флагами, пробуем взять из env
if [ -z "$CREATE_ARCHIVE" ] && [ -n "${CREATE_ARCHIVE:-}" ]; then
    CREATE_ARCHIVE="${CREATE_ARCHIVE}"
fi

# По умолчанию:
# - если есть TTY → спрашиваем
# - если нет TTY (cron/CI) → делаем архив
if [ -z "$CREATE_ARCHIVE" ]; then
    if [ -t 0 ]; then
read -p "Создать архив .tar.gz? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
            CREATE_ARCHIVE="1"
        else
            CREATE_ARCHIVE="0"
        fi
    else
        CREATE_ARCHIVE="1"
    fi
fi

if [ "$CREATE_ARCHIVE" = "1" ]; then
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

