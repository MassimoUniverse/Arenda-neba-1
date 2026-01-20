#!/bin/bash

# ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ: очистка диска + полная переустановка sqlite3
# Использование: ./emergency-fix-all.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ${NC}"
echo -e "${RED}========================================${NC}"
echo ""

cd /opt/arenda-neba || exit 1

# 1. КРИТИЧЕСКАЯ ОЧИСТКА ДИСКА
echo -e "${RED}1️⃣  КРИТИЧЕСКАЯ ОЧИСТКА ДИСКА${NC}"
echo "----------------------------------------"
df -h / | tail -1
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo ""

if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠️  ДИСК ЗАПОЛНЕН НА ${DISK_USAGE}%! КРИТИЧНО!${NC}"
    echo ""
    
    # ОСТАНОВКА ПРИЛОЖЕНИЙ
    echo "⏸️  Останавливаем приложения..."
    pm2 stop all 2>/dev/null || true
    sleep 2
    
    # АГРЕССИВНАЯ ОЧИСТКА БЭКАПОВ (оставляем только 1 самый свежий!)
    echo ""
    echo -e "${YELLOW}🗑️  УДАЛЯЕМ ВСЕ БЭКАПЫ (оставляем только 1 самый свежий)...${NC}"
    
    # Бэкапы uploads
    UPLOADS_BACKUP_COUNT=$(ls -dt uploads_backup_* 2>/dev/null | wc -l)
    if [ "$UPLOADS_BACKUP_COUNT" -gt 1 ]; then
        echo "   Удаляем $((UPLOADS_BACKUP_COUNT - 1)) бэкапов uploads..."
        ls -dt uploads_backup_* 2>/dev/null | tail -n +2 | xargs rm -rf 2>/dev/null || true
        echo -e "${GREEN}   ✅ Удалено $((UPLOADS_BACKUP_COUNT - 1)) бэкапов uploads${NC}"
    fi
    
    # Бэкапы БД
    DB_BACKUP_COUNT=$(ls -dt database_backup_*.db 2>/dev/null | wc -l)
    if [ "$DB_BACKUP_COUNT" -gt 1 ]; then
        echo "   Удаляем $((DB_BACKUP_COUNT - 1)) бэкапов БД..."
        ls -dt database_backup_*.db 2>/dev/null | tail -n +2 | xargs rm -f 2>/dev/null || true
        echo -e "${GREEN}   ✅ Удалено $((DB_BACKUP_COUNT - 1)) бэкапов БД${NC}"
    fi
    
    # Временные файлы
    echo "   Удаляем все временные файлы..."
    find . -maxdepth 1 -name "database_temp_*" -delete 2>/dev/null || true
    find . -maxdepth 1 -name "uploads_temp_*" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # npm кэш
    echo "   Очищаем npm кэш..."
    npm cache clean --force 2>/dev/null || true
    
    # Старые логи PM2
    echo "   Очищаем старые логи PM2..."
    find ~/.pm2/logs -name "*.log" -mtime +3 -delete 2>/dev/null || true
    
    # Системные логи
    echo "   Очищаем системные логи..."
    sudo journalctl --vacuum-time=3d 2>/dev/null || true
    
    echo ""
    echo "📊 Использование диска после очистки:"
    df -h / | tail -1
    echo ""
else
    echo -e "${GREEN}✅ Диск в порядке${NC}"
    echo ""
fi

# 2. ПРОВЕРКА СИСТЕМЫ
echo -e "${YELLOW}2️⃣  ПРОВЕРКА СИСТЕМЫ${NC}"
echo "----------------------------------------"
echo "Node.js версия: $(node --version 2>/dev/null || echo 'НЕ НАЙДЕНА')"
echo "npm версия: $(npm --version 2>/dev/null || echo 'НЕ НАЙДЕНА')"
echo "Архитектура: $(uname -m)"
echo "ОС: $(uname -s)"
echo ""

# 3. ПОЛНОЕ УДАЛЕНИЕ node_modules
echo -e "${YELLOW}3️⃣  ПОЛНОЕ УДАЛЕНИЕ node_modules${NC}"
echo "----------------------------------------"
if [ -d "node_modules" ]; then
    echo "🗑️  Удаляем node_modules..."
    rm -rf node_modules
    echo -e "${GREEN}✅ node_modules удален${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules не найден${NC}"
fi

if [ -f "package-lock.json" ]; then
    echo "🗑️  Удаляем package-lock.json..."
    rm -f package-lock.json
    echo -e "${GREEN}✅ package-lock.json удален${NC}"
fi
echo ""

# 4. ОЧИСТКА КЭША
echo -e "${YELLOW}4️⃣  ОЧИСТКА КЭША${NC}"
echo "----------------------------------------"
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}✅ Кэш очищен${NC}"
echo ""

# 5. ПРОВЕРКА МЕСТА НА ДИСКЕ ПЕРЕД УСТАНОВКОЙ
echo -e "${YELLOW}5️⃣  ПРОВЕРКА МЕСТА НА ДИСКЕ${NC}"
echo "----------------------------------------"
FREE_SPACE=$(df / | tail -1 | awk '{print $4}')
FREE_SPACE_GB=$((FREE_SPACE / 1024 / 1024))
echo "Свободно: ${FREE_SPACE_GB}GB"

if [ "$FREE_SPACE_GB" -lt 2 ]; then
    echo -e "${RED}❌ КРИТИЧНО МАЛО МЕСТА! Нужно минимум 2GB для установки${NC}"
    echo ""
    echo "Попробуйте удалить больше бэкапов вручную:"
    echo "  du -sh uploads_backup_*"
    echo "  rm -rf uploads_backup_YYYYMMDD_HHMMSS  # удалите старые"
    exit 1
fi
echo ""

# 6. УСТАНОВКА ЗАВИСИМОСТЕЙ
echo -e "${YELLOW}6️⃣  УСТАНОВКА ЗАВИСИМОСТЕЙ${NC}"
echo "----------------------------------------"
echo "📦 Устанавливаем все зависимости..."
echo "   Это может занять 5-10 минут..."
echo ""

npm install 2>&1 | tee /tmp/npm-install.log | tail -30

if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ ОШИБКА: node_modules не создан!${NC}"
    echo "Проверьте логи: cat /tmp/npm-install.log"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Зависимости установлены${NC}"
echo ""

# 7. ПРОВЕРКА SQLITE3
echo -e "${YELLOW}7️⃣  ПРОВЕРКА SQLITE3${NC}"
echo "----------------------------------------"
if [ -d "node_modules/sqlite3" ]; then
    echo -e "${GREEN}✅ sqlite3 найден в node_modules${NC}"
    
    if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
        echo -e "${GREEN}✅ Нативный модуль найден${NC}"
        file node_modules/sqlite3/build/Release/node_sqlite3.node
    else
        echo -e "${YELLOW}⚠️  Нативный модуль не найден, пересобираем...${NC}"
        cd node_modules/sqlite3
        npm run install 2>&1 | tail -20 || npm run rebuild 2>&1 | tail -20 || true
        cd ../..
    fi
else
    echo -e "${RED}❌ sqlite3 НЕ НАЙДЕН! Устанавливаем отдельно...${NC}"
    npm install sqlite3 --build-from-source 2>&1 | tail -30
fi
echo ""

# 8. ТЕСТ ЗАГРУЗКИ МОДУЛЯ
echo -e "${YELLOW}8️⃣  ТЕСТ ЗАГРУЗКИ SQLITE3${NC}"
echo "----------------------------------------"
if node -e "require('sqlite3'); console.log('✅ sqlite3 загружен успешно');" 2>&1; then
    echo -e "${GREEN}✅ МОДУЛЬ SQLITE3 РАБОТАЕТ!${NC}"
else
    echo -e "${RED}❌ ОШИБКА ПРИ ЗАГРУЗКЕ SQLITE3!${NC}"
    echo ""
    echo "Пробуем пересобрать вручную..."
    cd node_modules/sqlite3
    npm run rebuild 2>&1 | tail -30
    cd ../..
    
    # Повторный тест
    if node -e "require('sqlite3'); console.log('✅ sqlite3 загружен успешно');" 2>&1; then
        echo -e "${GREEN}✅ МОДУЛЬ SQLITE3 РАБОТАЕТ ПОСЛЕ ПЕРЕСБОРКИ!${NC}"
    else
        echo -e "${RED}❌ КРИТИЧЕСКАЯ ОШИБКА: sqlite3 не работает!${NC}"
        echo ""
        echo "Возможные причины:"
        echo "  1. Несовместимость версии Node.js"
        echo "  2. Отсутствие build-essential"
        echo "  3. Проблемы с архитектурой"
        echo ""
        echo "Проверьте:"
        echo "  node --version"
        echo "  uname -m"
        echo "  which g++"
        exit 1
    fi
fi
echo ""

# 9. ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ
echo -e "${YELLOW}9️⃣  ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ${NC}"
echo "----------------------------------------"
pm2 restart arenda-neba 2>/dev/null || pm2 start ecosystem.config.js
pm2 restart webhook-handler 2>/dev/null || true
pm2 save
sleep 5
echo ""

# 10. ПРОВЕРКА РЕЗУЛЬТАТА
echo -e "${YELLOW}🔟 ПРОВЕРКА РЕЗУЛЬТАТА${NC}"
echo "----------------------------------------"
echo "Статус PM2:"
pm2 status
echo ""

echo "Логи (последние 20 строк):"
pm2 logs arenda-neba --lines 20 --nostream 2>&1 | tail -20
echo ""

ERRORS=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -i "sqlite3\|Cannot find module.*sqlite3" | wc -l)
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ ОШИБОК SQLITE3 НЕ НАЙДЕНО!${NC}"
else
    echo -e "${RED}❌ Найдено ошибок: $ERRORS${NC}"
    pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -i "sqlite3\|Cannot find module.*sqlite3" | tail -3
fi
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ HTTP отвечает (код: $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ HTTP не отвечает (код: $HTTP_CODE)${NC}"
fi
echo ""

# ИТОГ
echo -e "${BLUE}========================================${NC}"
if [ "$ERRORS" -eq 0 ] && [ "$HTTP_CODE" != "000" ]; then
    echo -e "${GREEN}✅ ВСЁ ИСПРАВЛЕНО!${NC}"
    echo ""
    echo "Приложение должно работать корректно."
    echo "Проверьте сайт в браузере."
else
    echo -e "${RED}❌ ПРОБЛЕМА ОСТАЛАСЬ${NC}"
    echo ""
    echo "Выполните диагностику:"
    echo "  node --version"
    echo "  uname -m"
    echo "  pm2 logs arenda-neba --lines 50"
    echo ""
    echo "Возможно, нужна переустановка Node.js"
fi
echo -e "${BLUE}========================================${NC}"
