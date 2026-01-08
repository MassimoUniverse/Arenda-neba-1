# 🚀 Развертывание на сервере

## Быстрый способ (Git Pull)

### Вариант 1: Через SSH (рекомендуется)

```bash
# Подключитесь к серверу
ssh root@91.222.237.34

# Перейдите в директорию проекта
cd /opt/arenda-neba

# Остановите сервер (если используется PM2)
pm2 stop arenda-neba

# Обновите код из репозитория
git pull origin main

# Установите зависимости (если нужно)
npm install --production

# Запустите сервер
pm2 restart arenda-neba

# Проверьте статус
pm2 status
pm2 logs arenda-neba --lines 50
```

### Вариант 2: Через SCP (прямое копирование файлов)

Если Git не работает или нужно скопировать файлы напрямую:

```powershell
# На локальной машине (PowerShell)
cd "F:\New site\deploy"

# Скопируйте все файлы на сервер
scp -r public root@91.222.237.34:/opt/arenda-neba/
scp server.js root@91.222.237.34:/opt/arenda-neba/
scp package.json root@91.222.237.34:/opt/arenda-neba/
scp database.db root@91.222.237.34:/opt/arenda-neba/
```

## Полный скрипт развертывания

Создайте файл `deploy.sh` на сервере:

```bash
#!/bin/bash
cd /opt/arenda-neba
pm2 stop arenda-neba
git pull origin main
npm install --production
pm2 restart arenda-neba
pm2 save
echo "✅ Деплой завершен"
```

Затем запустите:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Проверка после деплоя

```bash
# Проверьте, что сервер запущен
pm2 status

# Проверьте логи
pm2 logs arenda-neba --lines 100

# Проверьте файлы
ls -lh /opt/arenda-neba/public/
ls -lh /opt/arenda-neba/database.db

# Проверьте, что сайт работает
curl http://localhost:3000
```

## Устранение проблем

### Git не работает на сервере

```bash
# Проверьте настройки Git
cd /opt/arenda-neba
git remote -v
git status

# Если нужно настроить заново
git remote set-url origin https://github.com/MassimoUniverse/Arenda-neba-1.git
```

### Файлы не обновляются

```bash
# Проверьте права доступа
ls -la /opt/arenda-neba/

# Проверьте, что вы в правильной директории
pwd

# Принудительно обновите
git fetch origin
git reset --hard origin/main
```

### Сервер не запускается

```bash
# Проверьте ошибки
pm2 logs arenda-neba --err

# Запустите вручную для диагностики
cd /opt/arenda-neba
node server.js

# Проверьте порт
netstat -tulpn | grep 3000
```

### PM2 не найден

```bash
# Установите PM2
npm install -g pm2

# Или запустите сервер напрямую
cd /opt/arenda-neba
node server.js
```

## Автоматический деплой через Webhook

Если настроен webhook, проверьте:

```bash
# Проверьте, что webhook работает
pm2 logs webhook-handler --lines 50

# Или проверьте логи nginx
tail -f /var/log/nginx/error.log
```

## Ручное копирование через WinSCP

1. Откройте WinSCP
2. Подключитесь к `91.222.237.34`
3. Перейдите в `/opt/arenda-neba/`
4. Скопируйте файлы из `F:\New site\deploy\` на сервер:
   - `public/` → `/opt/arenda-neba/public/`
   - `server.js` → `/opt/arenda-neba/server.js`
   - `package.json` → `/opt/arenda-neba/package.json`
   - `database.db` → `/opt/arenda-neba/database.db`
5. Перезапустите сервер через SSH
