# 🚨 Восстановление после git clean

## Что было удалено:
- `.env` (переменные окружения - КРИТИЧНО!)
- `node_modules/` (зависимости)
- `backups/` (бэкапы)
- `uploads/` (загруженные файлы)

## СРОЧНОЕ ВОССТАНОВЛЕНИЕ:

### 1. Восстановите файл .env

```bash
cd /opt/arenda-neba

# Создайте файл .env с необходимыми переменными
nano .env
```

Добавьте в файл:
```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 2. Установите зависимости

```bash
cd /opt/arenda-neba
npm install
```

### 3. Восстановите uploads (если есть бэкап)

```bash
# Если есть бэкап uploads
cd /opt/arenda-neba
tar -xzf backups/uploads_*.tar.gz 2>/dev/null || echo "Бэкап uploads не найден"
```

### 4. Перезапустите приложение

```bash
pm2 restart arenda-neba
pm2 logs arenda-neba --lines 50
```

### 5. Проверьте статус

```bash
pm2 status
curl http://localhost:3000/api/services
```

## Если база данных тоже была удалена:

```bash
# Восстановите из бэкапа
cd /opt/arenda-neba
cp backups/database_*.db database.db 2>/dev/null || echo "Бэкап БД не найден"

# Или создайте новую
node init-db.js
```

## Быстрая команда для восстановления:

```bash
cd /opt/arenda-neba

# 1. Создайте .env (скопируйте из примера выше)
cat > .env << 'EOF'
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF

# 2. Установите зависимости
npm install

# 3. Восстановите uploads из бэкапа (если есть)
ls backups/uploads_*.tar.gz 2>/dev/null && tar -xzf backups/uploads_*.tar.gz || echo "Бэкап uploads не найден"

# 4. Восстановите базу данных (если нужно)
ls backups/database_*.db 2>/dev/null && cp backups/database_*.db database.db || echo "Бэкап БД не найден"

# 5. Перезапустите
pm2 restart arenda-neba
pm2 logs arenda-neba --lines 50
```
