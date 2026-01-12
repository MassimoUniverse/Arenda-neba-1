#!/bin/bash
# Git hook для автоматической регенерации страниц после git pull
# Установка: скопировать в .git/hooks/post-merge и сделать исполняемым

echo ""
echo "🔄 Post-merge hook: регенерируем страницы оборудования..."

# Запускаем скрипт генерации страниц
node generate-pages.js

if [ $? -eq 0 ]; then
    echo "✅ Страницы успешно обновлены!"
else
    echo "⚠️  Предупреждение: не удалось обновить страницы"
fi

# Перезапускаем PM2 если он установлен
if command -v pm2 &> /dev/null; then
    echo "🔄 Перезапускаем PM2..."
    pm2 restart arenda-neba 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ PM2 перезапущен"
    fi
fi

echo ""
