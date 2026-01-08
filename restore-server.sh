#!/bin/bash
# Скрипт быстрого восстановления после git clean

echo "🚨 Восстановление сервера после git clean..."

cd /opt/arenda-neba || exit 1

# 1. Создаем .env файл
echo "📝 Создаем файл .env..."
cat > .env << 'EOF'
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF

# 2. Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# 3. Создаем папку uploads
echo "📁 Создаем папку uploads..."
mkdir -p uploads
chmod 755 uploads

# 4. Восстанавливаем базу данных из бэкапа (если есть)
if [ -d "backups" ] && [ "$(ls -A backups 2>/dev/null)" ]; then
    echo "💾 Ищем бэкап базы данных..."
    LATEST_DB=$(ls -t backups/database_*.db 2>/dev/null | head -1)
    if [ -n "$LATEST_DB" ]; then
        echo "✅ Восстанавливаем базу данных из $LATEST_DB"
        cp "$LATEST_DB" database.db
    else
        echo "⚠️ Бэкап БД не найден, создаем новую..."
        node init-db.js
    fi
else
    echo "⚠️ Папка backups не найдена, создаем новую БД..."
    node init-db.js
fi

# 5. Восстанавливаем uploads из бэкапа (если есть)
if [ -d "backups" ]; then
    LATEST_UPLOADS=$(ls -t backups/uploads_*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_UPLOADS" ]; then
        echo "✅ Восстанавливаем uploads из $LATEST_UPLOADS"
        tar -xzf "$LATEST_UPLOADS" 2>/dev/null || echo "⚠️ Ошибка при распаковке uploads"
    fi
fi

# 6. Перезапускаем приложение
echo "🔄 Перезапускаем приложение..."
pm2 restart arenda-neba

# 7. Проверяем статус
echo ""
echo "✅ Восстановление завершено!"
echo ""
echo "Статус приложения:"
pm2 status arenda-neba

echo ""
echo "Последние логи:"
pm2 logs arenda-neba --lines 20 --nostream

echo ""
echo "⚠️ ВАЖНО: Проверьте файл .env и измените JWT_SECRET и пароль администратора!"
