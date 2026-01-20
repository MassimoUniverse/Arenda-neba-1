#!/bin/bash

# Комплексный скрипт: очистка диска + переустановка sqlite3
# Использование: ./fix-sqlite3-and-disk.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔧 ИСПРАВЛЕНИЕ: ДИСК + SQLITE3${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd /opt/arenda-neba || exit 1

# 1. Проверка диска
echo -e "${YELLOW}1️⃣  ПРОВЕРКА ДИСКА${NC}"
echo "----------------------------------------"
df -h / | tail -1
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo ""

if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠️  Диск заполнен на ${DISK_USAGE}%! Очищаем...${NC}"
    echo ""
    
    # Очистка старых бэкапов (оставляем только 2 самых свежих)
    echo -e "${YELLOW}   🗑️  Удаляем старые бэкапы uploads (оставляем 2 самых свежих)...${NC}"
    UPLOADS_BACKUP_COUNT=$(ls -dt uploads_backup_* 2>/dev/null | wc -l)
    if [ "$UPLOADS_BACKUP_COUNT" -gt 2 ]; then
        OLD_UPLOADS_BACKUPS=$(ls -dt uploads_backup_* 2>/dev/null | tail -n +3)
        echo "$OLD_UPLOADS_BACKUPS" | while read backup; do
            SIZE=$(du -sh "$backup" 2>/dev/null | cut -f1 || echo "unknown")
            echo "      Удаляем: $(basename "$backup") ($SIZE)"
            rm -rf "$backup" 2>/dev/null || true
        done
        echo -e "${GREEN}   ✅ Удалено $((UPLOADS_BACKUP_COUNT - 2)) старых бэкапов uploads${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}   🗑️  Удаляем старые бэкапы БД (оставляем 2 самых свежих)...${NC}"
    DB_BACKUP_COUNT=$(ls -dt database_backup_*.db 2>/dev/null | wc -l)
    if [ "$DB_BACKUP_COUNT" -gt 2 ]; then
        OLD_DB_BACKUPS=$(ls -dt database_backup_*.db 2>/dev/null | tail -n +3)
        echo "$OLD_DB_BACKUPS" | while read backup; do
            SIZE=$(du -sh "$backup" 2>/dev/null | cut -f1 || echo "unknown")
            echo "      Удаляем: $(basename "$backup") ($SIZE)"
            rm -f "$backup" 2>/dev/null || true
        done
        echo -e "${GREEN}   ✅ Удалено $((DB_BACKUP_COUNT - 2)) старых бэкапов БД${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}   🗑️  Удаляем временные файлы (старше 1 часа)...${NC}"
    find . -maxdepth 1 -name "database_temp_*.db*" -mmin +60 -delete 2>/dev/null || true
    find . -maxdepth 1 -name "uploads_temp_*" -type d -mmin +60 -exec rm -rf {} + 2>/dev/null || true
    
    echo ""
    echo -e "${YELLOW}   🧹 Очищаем npm кэш...${NC}"
    npm cache clean --force 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}   ✅ Очистка завершена${NC}"
    echo ""
    echo "   📊 Использование диска после очистки:"
    df -h / | tail -1
    echo ""
else
    echo -e "${GREEN}✅ Диск в порядке (${DISK_USAGE}% использовано)${NC}"
    echo ""
fi

# 2. Остановка приложения
echo -e "${YELLOW}2️⃣  ОСТАНОВКА ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
pm2 stop arenda-neba 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Приложение остановлено${NC}"
echo ""

# 3. Удаление старого sqlite3
echo -e "${YELLOW}3️⃣  УДАЛЕНИЕ СТАРОГО SQLITE3${NC}"
echo "----------------------------------------"
if [ -d "node_modules/sqlite3" ]; then
    echo "🗑️  Удаляем node_modules/sqlite3..."
    rm -rf node_modules/sqlite3
    echo -e "${GREEN}✅ Старый модуль удален${NC}"
else
    echo -e "${YELLOW}⚠️  Модуль sqlite3 не найден в node_modules${NC}"
fi
echo ""

# 4. Очистка кэша npm
echo -e "${YELLOW}4️⃣  ОЧИСТКА КЭША NPM${NC}"
echo "----------------------------------------"
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}✅ Кэш очищен${NC}"
echo ""

# 5. Установка sqlite3
echo -e "${YELLOW}5️⃣  УСТАНОВКА SQLITE3${NC}"
echo "----------------------------------------"
echo "📦 Устанавливаем sqlite3 из исходников..."
echo "   Это может занять 2-5 минут..."
echo ""

if npm install sqlite3 --build-from-source 2>&1 | tee /tmp/sqlite3-install.log; then
    echo ""
    echo -e "${GREEN}✅ Установка sqlite3 завершена${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Установка из исходников не удалась, пробуем обычную установку...${NC}"
    npm install sqlite3 2>&1 | tail -20
fi
echo ""

# 6. Проверка установки
echo -e "${YELLOW}6️⃣  ПРОВЕРКА УСТАНОВКИ SQLITE3${NC}"
echo "----------------------------------------"
if [ -d "node_modules/sqlite3" ]; then
    echo -e "${GREEN}✅ Папка node_modules/sqlite3 существует${NC}"
    
    if [ -f "node_modules/sqlite3/package.json" ]; then
        VERSION=$(grep '"version"' node_modules/sqlite3/package.json | head -1 | cut -d'"' -f4)
        echo "   Версия: $VERSION"
    fi
    
    if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
        echo -e "${GREEN}✅ Нативный модуль найден${NC}"
        file node_modules/sqlite3/build/Release/node_sqlite3.node
    else
        echo -e "${YELLOW}⚠️  Нативный модуль не найден, пробуем пересобрать...${NC}"
        cd node_modules/sqlite3
        npm run install 2>&1 | tail -10 || npm run rebuild 2>&1 | tail -10 || true
        cd ../..
        
        if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
            echo -e "${GREEN}✅ Нативный модуль успешно пересобран${NC}"
        else
            echo -e "${RED}❌ Не удалось пересобрать нативный модуль${NC}"
            echo ""
            echo "Пробуем полную переустановку node_modules..."
            cd /opt/arenda-neba
            rm -rf node_modules package-lock.json
            npm install
            npm install sqlite3 --build-from-source
        fi
    fi
else
    echo -e "${RED}❌ ОШИБКА: sqlite3 не установлен!${NC}"
    echo ""
    echo "Пробуем полную переустановку..."
    rm -rf node_modules package-lock.json
    npm install
    npm install sqlite3 --build-from-source
fi
echo ""

# 7. Перезапуск приложения
echo -e "${YELLOW}7️⃣  ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
pm2 restart arenda-neba
sleep 3
echo ""

# 8. Проверка логов
echo -e "${YELLOW}8️⃣  ПРОВЕРКА ЛОГОВ${NC}"
echo "----------------------------------------"
echo "Последние 30 строк логов:"
pm2 logs arenda-neba --lines 30 --nostream | tail -30
echo ""

# Проверка на ошибки sqlite3
ERRORS=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -i "sqlite3\|Cannot find module" | wc -l)
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ Ошибок sqlite3 не найдено!${NC}"
else
    echo -e "${RED}❌ Найдено ошибок: $ERRORS${NC}"
    echo "   Последние ошибки:"
    pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -i "sqlite3\|Cannot find module" | tail -3
fi
echo ""

# 9. Проверка статуса
echo -e "${YELLOW}9️⃣  СТАТУС ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
pm2 status arenda-neba
echo ""

# 10. Проверка HTTP
echo -e "${YELLOW}🔟 ПРОВЕРКА HTTP${NC}"
echo "----------------------------------------"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Приложение отвечает на http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Приложение не отвечает на http://localhost:3000${NC}"
fi
echo ""

# Итог
echo -e "${BLUE}========================================${NC}"
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ ВСЁ ИСПРАВЛЕНО!${NC}"
else
    echo -e "${RED}❌ ПРОБЛЕМА ОСТАЛАСЬ${NC}"
    echo ""
    echo "Попробуйте вручную:"
    echo "  cd /opt/arenda-neba"
    echo "  rm -rf node_modules package-lock.json"
    echo "  npm install"
    echo "  npm install sqlite3 --build-from-source"
    echo "  pm2 restart arenda-neba"
fi
echo -e "${BLUE}========================================${NC}"
