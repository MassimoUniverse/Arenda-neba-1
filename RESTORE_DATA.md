# Восстановление данных каталога

## Проблема
После деплоя создалась новая база данных с только 3 базовыми услугами, а старые данные пропали.

## Решение 1: Восстановить из бэкапа старой базы (если есть)

### На сервере:

```bash
# 1. Остановите приложение
pm2 stop arenda-neba

# 2. Найдите старую базу данных (если она сохранена)
# Обычно она может быть в:
# - ~/backup-old/database.db
# - /opt/arenda-neba/database.db.backup
# - или где-то еще

# 3. Если нашли старую базу, скопируйте её
cp /path/to/old/database.db /opt/arenda-neba/database.db.backup

# 4. Запустите приложение
pm2 start arenda-neba
```

## Решение 2: Импортировать данные из старой базы через SQLite

### На сервере:

```bash
# 1. Установите sqlite3 (если не установлен)
sudo apt install -y sqlite3

# 2. Если у вас есть старая база, экспортируйте данные
sqlite3 /path/to/old/database.db ".dump services" > services_backup.sql

# 3. Импортируйте в новую базу
sqlite3 /opt/arenda-neba/database.db < services_backup.sql

# 4. Перезапустите приложение
pm2 restart arenda-neba
```

## Решение 3: Добавить услуги через админ-панель

1. Зайдите в админ-панель: `http://your-server:3000/admin.html`
2. Логин: `admin`, Пароль: `admin123` (если не меняли)
3. Добавьте все услуги вручную через интерфейс

## Решение 4: Восстановить из локальной базы (если она есть)

Если у вас есть локальная база данных с полными данными:

```bash
# На локальной машине экспортируйте данные
sqlite3 database.db ".dump services" > services_export.sql

# Загрузите файл на сервер
scp services_export.sql user@server:/opt/arenda-neba/

# На сервере импортируйте
cd /opt/arenda-neba
pm2 stop arenda-neba
sqlite3 database.db < services_export.sql
pm2 start arenda-neba
```

## Решение 5: Создать скрипт для добавления всех услуг

См. файл `restore-services.js` - выполните его на сервере.

