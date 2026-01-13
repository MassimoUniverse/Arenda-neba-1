# 🔧 Исправление ошибки 502 Bad Gateway

**Ошибка:** `502 Bad Gateway` означает, что nginx не может подключиться к Node.js приложению.

---

## 🚨 БЫСТРАЯ ДИАГНОСТИКА

Выполните на сервере по порядку:

### 1. Проверьте статус PM2

```bash
pm2 status
```

**Ожидаемый результат:**
```
┌─────┬──────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ status  │ restart │ uptime   │
├─────┼──────────────┼─────────┼─────────┼──────────┤
│ 0   │ arenda-neba  │ online  │ 0       │ 2h       │
└─────┴──────────────┴─────────┴─────────┴──────────┘
```

**Если статус `errored` или `stopped`:**
```bash
# Перезапустите приложение
pm2 restart arenda-neba

# Или запустите заново
cd /opt/arenda-neba
pm2 start server.js --name arenda-neba
pm2 save
```

---

### 2. Проверьте логи приложения

```bash
pm2 logs arenda-neba --lines 50
```

**Ищите ошибки:**
- ❌ `Error: Cannot find module` - не установлены зависимости
- ❌ `Error: listen EADDRINUSE` - порт занят
- ❌ `Error: SQLITE_CANTOPEN` - проблема с базой данных
- ❌ `SyntaxError` - ошибка в коде

**Если видите ошибки:**
```bash
# Установите зависимости
cd /opt/arenda-neba
npm install

# Проверьте базу данных
ls -la database.db

# Перезапустите
pm2 restart arenda-neba
```

---

### 3. Проверьте, что приложение слушает на порту 3000

```bash
sudo ss -tulpn | grep :3000
```

**Ожидаемый результат:**
```
tcp   LISTEN  0  128  127.0.0.1:3000  *:*  users:(("node",pid=12345,fd=20))
```

**Если порт не слушается:**
- Приложение не запущено или упало
- См. шаг 1 и 2

---

### 4. Проверьте локальный доступ к приложению

```bash
curl http://localhost:3000
```

**Ожидаемый результат:**
- HTML код главной страницы (не ошибка)

**Если ошибка:**
- Приложение не работает
- См. логи (шаг 2)

---

### 5. Проверьте конфигурацию nginx

```bash
sudo cat /etc/nginx/sites-available/arenda-neba
```

**Должно быть:**
```nginx
server {
    listen 80;
    server_name ваш-домен.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Проверьте синтаксис:**
```bash
sudo nginx -t
```

**Если ошибки:**
```bash
# Исправьте конфиг
sudo nano /etc/nginx/sites-available/arenda-neba

# Проверьте снова
sudo nginx -t

# Перезагрузите
sudo systemctl reload nginx
```

---

### 6. Проверьте логи nginx

```bash
sudo tail -50 /var/log/nginx/error.log
```

**Ищите:**
- `connect() failed (111: Connection refused)` - приложение не запущено
- `upstream timed out` - приложение не отвечает
- `no resolver defined` - проблема с DNS

---

## 🔧 РЕШЕНИЕ ПРОБЛЕМ

### Проблема 1: Приложение не запущено

```bash
cd /opt/arenda-neba

# Проверьте, что файлы на месте
ls -la server.js package.json

# Установите зависимости
npm install

# Запустите через PM2
pm2 start server.js --name arenda-neba
pm2 save

# Проверьте статус
pm2 status
```

---

### Проблема 2: Ошибки в коде

```bash
# Проверьте логи
pm2 logs arenda-neba --lines 100

# Если ошибка в коде, обновите с GitHub
cd /opt/arenda-neba
git pull origin main
npm install
pm2 restart arenda-neba
```

---

### Проблема 3: База данных повреждена

```bash
cd /opt/arenda-neba

# Проверьте базу
sqlite3 database.db "PRAGMA integrity_check;"

# Если ошибки, восстановите из бекапа
cp database.db.backup database.db

# Или создайте новую
node init-db.js
```

---

### Проблема 4: Порт занят другим процессом

```bash
# Найдите процесс на порту 3000
sudo lsof -i :3000

# Убейте процесс (если нужно)
sudo kill -9 PID

# Перезапустите приложение
pm2 restart arenda-neba
```

---

### Проблема 5: Неправильный путь в nginx

```bash
# Проверьте путь к приложению
cd /opt/arenda-neba
pwd

# Обновите nginx конфиг
sudo nano /etc/nginx/sites-available/arenda-neba

# Убедитесь что proxy_pass правильный:
# proxy_pass http://localhost:3000;

# Перезагрузите nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ ПОЛНАЯ ПЕРЕУСТАНОВКА (если ничего не помогло)

```bash
cd /opt/arenda-neba

# 1. Остановите приложение
pm2 stop arenda-neba
pm2 delete arenda-neba

# 2. Обновите код
git pull origin main

# 3. Установите зависимости
npm install

# 4. Проверьте базу данных
ls -la database.db

# 5. Запустите приложение
pm2 start server.js --name arenda-neba
pm2 save

# 6. Проверьте статус
pm2 status
pm2 logs arenda-neba --lines 20

# 7. Проверьте локальный доступ
curl http://localhost:3000

# 8. Перезагрузите nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔍 ДОПОЛНИТЕЛЬНАЯ ДИАГНОСТИКА

### Проверка всех процессов Node.js

```bash
ps aux | grep node
```

### Проверка использования портов

```bash
sudo netstat -tulpn | grep :3000
```

### Проверка системных ресурсов

```bash
# Память
free -h

# Диск
df -h

# CPU
top
```

### Проверка прав доступа

```bash
# Права на файлы
ls -la /opt/arenda-neba/

# Права на базу данных
ls -la /opt/arenda-neba/database.db
```

---

## 📞 ЕСЛИ НИЧЕГО НЕ ПОМОГЛО

1. **Соберите информацию:**
   ```bash
   pm2 logs arenda-neba --lines 100 > /tmp/pm2-logs.txt
   sudo tail -100 /var/log/nginx/error.log > /tmp/nginx-errors.txt
   pm2 status > /tmp/pm2-status.txt
   ```

2. **Проверьте:**
   - Работает ли сервер (не перезагружался ли)
   - Есть ли место на диске
   - Не блокирует ли firewall порт 3000

3. **Восстановите из бекапа:**
   ```bash
   cd /opt/arenda-neba
   # Найдите последний бекап
   ls -lt backup_*.zip | head -1
   # Распакуйте и восстановите
   ```

---

## ✅ ПРОВЕРКА РАБОТЫ

После исправления проверьте:

1. **Локально:**
   ```bash
   curl http://localhost:3000
   ```

2. **Через nginx:**
   ```bash
   curl -H "Host: ваш-домен.ru" http://localhost
   ```

3. **Из браузера:**
   - Откройте сайт в браузере
   - Должна загрузиться главная страница

---

**Если проблема осталась, пришлите:**
- Вывод `pm2 logs arenda-neba --lines 50`
- Вывод `sudo tail -50 /var/log/nginx/error.log`
- Вывод `pm2 status`
