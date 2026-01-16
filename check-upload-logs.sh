#!/bin/bash

# Скрипт для проверки логов загрузки изображений
# Использование: ./check-upload-logs.sh

echo "🔍 Проверка логов загрузки изображений"
echo "========================================"
echo ""

# Проверяем, запущен ли PM2
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 не установлен"
    exit 1
fi

# Проверяем, запущено ли приложение
if ! pm2 list | grep -q "arenda-neba"; then
    echo "❌ Приложение arenda-neba не запущено"
    exit 1
fi

echo "📋 Последние 50 строк логов (все):"
echo "-----------------------------------"
pm2 logs arenda-neba --lines 50 --nostream | grep -E "(📤|📁|✅|❌|Ошибка|error|upload|Upload|uploads)" || echo "Нет записей о загрузке"

echo ""
echo "📋 Логи загрузки изображений (последние 30):"
echo "---------------------------------------------"
pm2 logs arenda-neba --lines 100 --nostream | grep -i "upload\|📤\|📁\|изображение\|image" | tail -30 || echo "Нет записей о загрузке"

echo ""
echo "📋 Ошибки (последние 20):"
echo "-------------------------"
pm2 logs arenda-neba --lines 100 --nostream | grep -i "error\|❌\|ошибка\|failed\|fail" | tail -20 || echo "Ошибок не найдено"

echo ""
echo "📋 Проверка папки uploads:"
echo "---------------------------"
if [ -d "uploads" ]; then
    echo "✅ Папка uploads существует"
    echo "   Файлов: $(find uploads -type f | wc -l)"
    echo "   Размер: $(du -sh uploads | cut -f1)"
    echo "   Права: $(ls -ld uploads | awk '{print $1}')"
    
    # Проверяем последние загруженные файлы
    echo ""
    echo "📁 Последние 5 загруженных файлов:"
    find uploads -type f -printf '%T@ %p\n' | sort -rn | head -5 | while read timestamp filepath; do
        filename=$(basename "$filepath")
        size=$(du -h "$filepath" | cut -f1)
        date=$(date -d "@${timestamp%.*}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -r "${timestamp%.*}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "N/A")
        echo "   $date - $filename ($size)"
    done
else
    echo "❌ Папка uploads не существует!"
fi

echo ""
echo "✅ Проверка завершена"
