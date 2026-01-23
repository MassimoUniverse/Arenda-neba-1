#!/bin/bash

echo "🔍 Проверка сохранности загруженных файлов...\n"

cd /opt/arenda-neba

# 1. Проверяем, что папка uploads существует
if [ ! -d "uploads" ]; then
    echo "❌ Папка uploads не существует!"
    echo "💡 Создаём папку..."
    mkdir -p uploads
    chmod 755 uploads
    echo "✅ Папка uploads создана"
else
    FILE_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
    echo "✅ Папка uploads существует"
    echo "   Файлов в папке: $FILE_COUNT"
fi

# 2. Проверяем, что uploads в .gitignore
if grep -q "^uploads/" .gitignore 2>/dev/null; then
    echo "✅ Папка uploads в .gitignore (файлы не попадут в Git)"
else
    echo "⚠️  Папка uploads НЕ в .gitignore!"
    echo "💡 Добавьте 'uploads/' в .gitignore"
fi

# 3. Проверяем права доступа
if [ -d "uploads" ]; then
    PERMS=$(stat -c "%a" uploads 2>/dev/null || stat -f "%OLp" uploads 2>/dev/null)
    echo "   Права доступа: $PERMS"
    
    if [ "$PERMS" != "755" ] && [ "$PERMS" != "775" ]; then
        echo "⚠️  Рекомендуемые права: 755"
        echo "💡 Исправьте: chmod 755 uploads"
    fi
fi

# 4. Проверяем, что файлы не отслеживаются Git
echo "\n📊 Проверка Git статуса:"
if git ls-files uploads/ 2>/dev/null | grep -q .; then
    echo "⚠️  ВНИМАНИЕ: Некоторые файлы из uploads отслеживаются Git!"
    echo "   Это не должно быть так. Файлы должны быть в .gitignore"
    git ls-files uploads/ | head -5
else
    echo "✅ Файлы из uploads НЕ отслеживаются Git (правильно)"
fi

# 5. Проверяем резервные копии
echo "\n📦 Резервные копии:"
BACKUP_COUNT=$(find . -maxdepth 1 -name "uploads_backup_*" -type d 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo "   Найдено резервных копий: $BACKUP_COUNT"
    find . -maxdepth 1 -name "uploads_backup_*" -type d -exec ls -ld {} \; 2>/dev/null | head -3
else
    echo "   Резервных копий не найдено"
fi

echo "\n✅ Проверка завершена"
echo "\n💡 Важно:"
echo "   - Файлы в uploads/ НЕ удалятся при 'git pull'"
echo "   - Файлы в uploads/ НЕ попадут в Git (благодаря .gitignore)"
echo "   - При деплое через deploy.sh создаются резервные копии"
