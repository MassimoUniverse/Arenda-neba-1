# 🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ (когда диск заполнен)

## КРИТИЧНО: Диск заполнен на 100% - сначала очистите место!

---

## ШАГ 1: ОЧИСТКА ДИСКА (выполните СЕЙЧАС)

### Вариант A: Одна команда (рекомендуется)

```bash
journalctl --vacuum-time=1d && find /var/log -type f \( -name "*.log" -o -name "*.gz" \) -mtime +3 -delete && tail -500 /root/.pm2/logs/arenda-neba-error.log > /root/.pm2/logs/arenda-neba-error.log.tmp 2>/dev/null && mv /root/.pm2/logs/arenda-neba-error.log.tmp /root/.pm2/logs/arenda-neba-error.log && tail -500 /root/.pm2/logs/arenda-neba-out.log > /root/.pm2/logs/arenda-neba-out.log.tmp 2>/dev/null && mv /root/.pm2/logs/arenda-neba-out.log.tmp /root/.pm2/logs/arenda-neba-out.log && cd /opt/arenda-neba && find . -name "database_backup_*.db" -mtime +1 -delete && find . -type d -name "uploads_backup_*" -mtime +1 -exec rm -rf {} + && npm cache clean --force && rm -rf /root/.cache/node-gyp/* && find /tmp -type f -mtime +1 -delete && df -h /
```

### Вариант B: Пошагово (если одна команда не работает)

```bash
# 1. Очистка системных логов
journalctl --vacuum-time=1d

# 2. Удаление старых логов
find /var/log -type f -name "*.log" -mtime +3 -delete
find /var/log -type f -name "*.gz" -mtime +3 -delete

# 3. Очистка PM2 логов
tail -500 /root/.pm2/logs/arenda-neba-error.log > /tmp/error.tmp && mv /tmp/error.tmp /root/.pm2/logs/arenda-neba-error.log
tail -500 /root/.pm2/logs/arenda-neba-out.log > /tmp/out.tmp && mv /tmp/out.tmp /root/.pm2/logs/arenda-neba-out.log

# 4. Удаление старых бэкапов
cd /opt/arenda-neba
find . -name "database_backup_*.db" -mtime +1 -delete
find . -type d -name "uploads_backup_*" -mtime +1 -exec rm -rf {} +

# 5. Очистка кэшей
npm cache clean --force
rm -rf /root/.cache/node-gyp/*

# 6. Очистка /tmp
find /tmp -type f -mtime +1 -delete

# 7. Проверка результата
df -h /
```

---

## ШАГ 2: После очистки - проверьте место

```bash
df -h /
```

**Если использование < 95%, продолжайте. Если нет - найдите большие файлы:**

```bash
# ТОП-20 самых больших файлов
du -h / | sort -rh | head -20

# Проверьте uploads
du -h /opt/arenda-neba/uploads/* | sort -rh | head -20
```

---

## ШАГ 3: Обновите код (после освобождения места)

```bash
cd /opt/arenda-neba
git pull origin main
chmod +x fix-sqlite3-and-pm2.sh
```

---

## ШАГ 4: Исправьте sqlite3 и запустите приложение

### Вариант A: Используйте скрипт

```bash
./fix-sqlite3-and-pm2.sh
```

### Вариант B: Вручную

```bash
# 1. Остановите все процессы PM2
pm2 stop all
pm2 delete all

# 2. Удалите проблемные модули
rm -rf node_modules/sqlite3
rm -rf node_modules/node-gyp
rm -rf node_modules/.node-gyp-*
npm cache clean --force

# 3. Установите sqlite3
npm install sqlite3 --build-from-source

# 4. Запустите приложение
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    pm2 start server.js --name arenda-neba --cwd /opt/arenda-neba
fi

# 5. Проверьте статус
pm2 list
pm2 logs arenda-neba --lines 20
```

---

## Если очистка не помогла

Если диск все еще заполнен после очистки, проверьте:

```bash
# Найти самые большие файлы
du -h /opt/arenda-neba | sort -rh | head -20

# Проверить uploads на дубликаты или очень большие файлы
ls -lh /opt/arenda-neba/uploads/ | sort -rh | head -20

# Проверить логи на огромные файлы
find /var/log -type f -size +100M -exec ls -lh {} \;
```

---

## Быстрая команда (всё сразу, после очистки диска)

```bash
cd /opt/arenda-neba && git pull origin main && chmod +x fix-sqlite3-and-pm2.sh && ./fix-sqlite3-and-pm2.sh
```
