# 🔧 Создание deploy.sh на сервере

## Проблема
Файл `deploy.sh` не найден на сервере после `git pull`.

## Решение: Создать файл вручную на сервере

### Шаг 1: Подключитесь к серверу
```bash
ssh user@ваш-сервер
cd /opt/arenda-neba
```

### Шаг 2: Создайте файл deploy.sh
```bash
nano deploy.sh
```

### Шаг 3: Скопируйте и вставьте этот код:

```bash
#!/bin/bash
# Скрипт автоматического деплоя через GitHub

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ⚠️ ВАЖНО: Путь к проекту на сервере
PROJECT_DIR="${PROJECT_DIR:-/opt/arenda-neba}"

echo -e "${GREEN}🚀 Начинаем деплой...${NC}"
cd "$PROJECT_DIR" || exit 1

# Создаем директорию для бэкапов, если её нет
mkdir -p backups

echo -e "${YELLOW}📦 Сохраняем базу данных и загрузки...${NC}"
# Бэкап базы данных
if [ -f "database.db" ]; then
    BACKUP_DB="backups/database_$(date +%Y%m%d_%H%M%S).db"
    cp database.db "$BACKUP_DB"
    echo -e "${GREEN}✅ База данных сохранена: $BACKUP_DB${NC}"
fi

# Бэкап uploads
if [ -d "uploads" ] && [ "$(ls -A uploads 2>/dev/null)" ]; then
    BACKUP_UPLOADS="backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$BACKUP_UPLOADS" uploads/ 2>/dev/null
    echo -e "${GREEN}✅ Загрузки сохранены: $BACKUP_UPLOADS${NC}"
fi

echo -e "${YELLOW}📥 Получаем обновления из GitHub...${NC}"
git fetch origin
git reset --hard origin/main

# Восстанавливаем базу данных, если её нет
if [ ! -f "database.db" ]; then
    echo -e "${YELLOW}⚠️ База данных не найдена, ищем последний бэкап...${NC}"
    LATEST_BACKUP=$(ls -t backups/database_*.db 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" database.db
        echo -e "${GREEN}✅ База данных восстановлена из бэкапа${NC}"
    else
        echo -e "${RED}❌ База данных не найдена и нет бэкапов!${NC}"
    fi
fi

# Восстанавливаем uploads, если папки нет
if [ ! -d "uploads" ]; then
    echo -e "${YELLOW}⚠️ Папка uploads не найдена, восстанавливаем...${NC}"
    mkdir -p uploads
    LATEST_UPLOADS=$(ls -t backups/uploads_*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_UPLOADS" ]; then
        tar -xzf "$LATEST_UPLOADS" -C . 2>/dev/null
        echo -e "${GREEN}✅ Загрузки восстановлены из бэкапа${NC}"
    fi
fi

# Убеждаемся, что uploads/.gitkeep существует
touch uploads/.gitkeep

echo -e "${YELLOW}📦 Устанавливаем зависимости...${NC}"
npm install --production

echo -e "${YELLOW}🔄 Перезапускаем приложение...${NC}"
# Используем PM2 для управления процессом
if pm2 list | grep -q "arenda-neba"; then
    pm2 restart arenda-neba
    echo -e "${GREEN}✅ Приложение перезапущено${NC}"
else
    pm2 start server.js --name arenda-neba
    echo -e "${GREEN}✅ Приложение запущено${NC}"
fi

# Показываем статус
pm2 status

echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
```

### Шаг 4: Сохраните файл
- Нажмите `Ctrl+O` (сохранить)
- Нажмите `Enter` (подтвердить имя файла)
- Нажмите `Ctrl+X` (выйти)

### Шаг 5: Сделайте файл исполняемым
```bash
chmod +x deploy.sh
```

### Шаг 6: Проверьте, что файл создан
```bash
ls -la deploy.sh
```

Должен показать что-то вроде:
```
-rwxr-xr-x 1 user user 1234 Jan 8 13:00 deploy.sh
```

### Шаг 7: Перезапустите webhook
```bash
pm2 restart webhook
pm2 logs webhook
```

## Альтернатива: Использовать curl для создания файла

Если у вас есть доступ к GitHub, можно скачать файл напрямую:

```bash
cd /opt/arenda-neba
curl -o deploy.sh https://raw.githubusercontent.com/MassimoUniverse/Arenda-neba-1/main/deploy.sh
chmod +x deploy.sh
```

## Проверка

После создания файла сделайте тестовый push:
```bash
cd "F:\New site\deploy"
git commit --allow-empty -m "Test webhook deploy.sh"
git push origin main
```

На сервере проверьте логи:
```bash
pm2 logs webhook --lines 30
```

Должны увидеть успешный деплой без ошибок "No such file or directory".
