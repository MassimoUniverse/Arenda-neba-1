#!/bin/bash
# Скрипт для обновления сайта на сервере
# Использование: bash update.sh

echo "🚀 Начинаем обновление сайта..."
echo ""

# 1. Получаем последние изменения из Git
echo "📥 Получаем изменения из GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при git pull!"
    exit 1
fi
echo "✅ Git pull выполнен успешно"
echo ""

# 2. Устанавливаем зависимости (если package.json изменился)
echo "📦 Проверяем зависимости..."
npm install --production
echo "✅ Зависимости обновлены"
echo ""

# 3. Исправляем пути к изображениям в базе данных
echo "🖼️  Исправляем пути к изображениям..."
if [ -f "fix-image-paths.js" ]; then
    node fix-image-paths.js
    echo "✅ Пути исправлены"
else
    echo "⚠️  Скрипт fix-image-paths.js не найден"
fi
echo ""

# 4. Регенерируем страницы оборудования
echo "🔄 Регенерируем страницы оборудования..."
node generate-pages.js
if [ $? -ne 0 ]; then
    echo "⚠️  Предупреждение: не удалось регенерировать страницы"
else
    echo "✅ Страницы обновлены"
fi
echo ""

# 5. Перезапускаем приложение через PM2
echo "🔄 Перезапускаем приложение..."
pm2 restart arenda-neba
if [ $? -ne 0 ]; then
    echo "⚠️  PM2 не найден или приложение не запущено. Запускаем вручную..."
    pm2 start server.js --name arenda-neba
fi
echo "✅ Приложение перезапущено"
echo ""

echo "🎉 Обновление завершено успешно!"
echo ""
echo "📊 Проверьте статус:"
echo "   pm2 status"
echo "   pm2 logs arenda-neba"
