#!/bin/bash
# Команды для ручной очистки диска (когда git pull не работает)
# Скопируйте и выполните эти команды на сервере

echo "🚨 ЭКСТРЕННАЯ ОЧИСТКА ДИСКА (ручной режим)"
echo "=========================================="
echo ""

# 1. Очистка системных логов
echo "1. Очистка journald..."
journalctl --vacuum-time=1d 2>/dev/null || echo "   Ошибка journalctl"

# 2. Удаление старых логов
echo "2. Удаление старых логов..."
find /var/log -type f -name "*.log" -mtime +3 -delete 2>/dev/null
find /var/log -type f -name "*.gz" -mtime +3 -delete 2>/dev/null
echo "   Готово"

# 3. Очистка PM2 логов
echo "3. Очистка PM2 логов..."
if [ -f "/root/.pm2/logs/arenda-neba-error.log" ]; then
    tail -500 /root/.pm2/logs/arenda-neba-error.log > /root/.pm2/logs/arenda-neba-error.log.tmp 2>/dev/null
    mv /root/.pm2/logs/arenda-neba-error.log.tmp /root/.pm2/logs/arenda-neba-error.log 2>/dev/null
fi
if [ -f "/root/.pm2/logs/arenda-neba-out.log" ]; then
    tail -500 /root/.pm2/logs/arenda-neba-out.log > /root/.pm2/logs/arenda-neba-out.log.tmp 2>/dev/null
    mv /root/.pm2/logs/arenda-neba-out.log.tmp /root/.pm2/logs/arenda-neba-out.log 2>/dev/null
fi
echo "   Готово"

# 4. Удаление старых бэкапов
echo "4. Удаление старых бэкапов..."
cd /opt/arenda-neba 2>/dev/null || cd /root
find . -name "database_backup_*.db" -mtime +1 -delete 2>/dev/null
find . -type d -name "uploads_backup_*" -mtime +1 -exec rm -rf {} + 2>/dev/null
echo "   Готово"

# 5. Очистка npm кэша
echo "5. Очистка npm кэша..."
npm cache clean --force 2>/dev/null || echo "   npm не найден"
echo "   Готово"

# 6. Очистка node-gyp кэша (оставляем только последнюю версию)
echo "6. Очистка node-gyp кэша..."
if [ -d "/root/.cache/node-gyp" ]; then
    LATEST=$(ls -t /root/.cache/node-gyp 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
        find /root/.cache/node-gyp -mindepth 1 -maxdepth 1 ! -name "$LATEST" -exec rm -rf {} + 2>/dev/null
    fi
fi
echo "   Готово"

# 7. Очистка временных файлов
echo "7. Очистка /tmp..."
find /tmp -type f -mtime +1 -delete 2>/dev/null
echo "   Готово"

# 8. Проверка результата
echo ""
echo "📊 Результат:"
df -h / | tail -1
