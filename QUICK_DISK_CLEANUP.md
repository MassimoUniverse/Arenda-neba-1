# 🚨 ЭКСТРЕННАЯ ОЧИСТКА ДИСКА (когда git pull не работает)

## Выполните эти команды на сервере:

```bash
# 1. Очистка системных логов (journald)
journalctl --vacuum-time=1d

# 2. Удаление старых логов
find /var/log -type f -name "*.log" -mtime +3 -delete
find /var/log -type f -name "*.gz" -mtime +3 -delete

# 3. Очистка PM2 логов (обрезаем до 500 строк)
tail -500 /root/.pm2/logs/arenda-neba-error.log > /root/.pm2/logs/arenda-neba-error.log.tmp 2>/dev/null && mv /root/.pm2/logs/arenda-neba-error.log.tmp /root/.pm2/logs/arenda-neba-error.log
tail -500 /root/.pm2/logs/arenda-neba-out.log > /root/.pm2/logs/arenda-neba-out.log.tmp 2>/dev/null && mv /root/.pm2/logs/arenda-neba-out.log.tmp /root/.pm2/logs/arenda-neba-out.log

# 4. Удаление старых бэкапов
cd /opt/arenda-neba
find . -name "database_backup_*.db" -mtime +1 -delete
find . -type d -name "uploads_backup_*" -mtime +1 -exec rm -rf {} +

# 5. Очистка npm кэша
npm cache clean --force

# 6. Очистка node-gyp кэша (оставляем только последнюю версию Node.js)
LATEST=$(ls -t /root/.cache/node-gyp 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
    find /root/.cache/node-gyp -mindepth 1 -maxdepth 1 ! -name "$LATEST" -exec rm -rf {} +
fi

# 7. Очистка временных файлов
find /tmp -type f -mtime +1 -delete

# 8. Проверка результата
df -h /
```

## Или выполните всё одной командой:

```bash
journalctl --vacuum-time=1d && find /var/log -type f \( -name "*.log" -o -name "*.gz" \) -mtime +3 -delete && tail -500 /root/.pm2/logs/arenda-neba-error.log > /root/.pm2/logs/arenda-neba-error.log.tmp 2>/dev/null && mv /root/.pm2/logs/arenda-neba-error.log.tmp /root/.pm2/logs/arenda-neba-error.log && tail -500 /root/.pm2/logs/arenda-neba-out.log > /root/.pm2/logs/arenda-neba-out.log.tmp 2>/dev/null && mv /root/.pm2/logs/arenda-neba-out.log.tmp /root/.pm2/logs/arenda-neba-out.log && cd /opt/arenda-neba && find . -name "database_backup_*.db" -mtime +1 -delete && find . -type d -name "uploads_backup_*" -mtime +1 -exec rm -rf {} + && npm cache clean --force && LATEST=$(ls -t /root/.cache/node-gyp 2>/dev/null | head -1) && [ -n "$LATEST" ] && find /root/.cache/node-gyp -mindepth 1 -maxdepth 1 ! -name "$LATEST" -exec rm -rf {} + && find /tmp -type f -mtime +1 -delete && df -h /
```

## После очистки:

1. Проверьте использование диска: `df -h /`
2. Если освободилось место (< 95%), выполните: `cd /opt/arenda-neba && git pull origin main`
3. Затем установите sqlite3: `pm2 stop arenda-neba && rm -rf node_modules/sqlite3 && npm install sqlite3 --build-from-source && pm2 restart arenda-neba`
