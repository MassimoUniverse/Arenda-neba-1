#!/bin/bash

# Комплексная проверка всех компонентов системы
# Использование: ./check-all.sh

echo "🔍 КОМПЛЕКСНАЯ ПРОВЕРКА СИСТЕМЫ"
echo "================================="
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Счетчики ошибок
ERRORS=0
WARNINGS=0

# Определяем директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/opt/arenda-neba"

if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    cd "$SCRIPT_DIR"
fi

echo "📂 Рабочая директория: $(pwd)"
echo ""

# ============================================
# 1. ПРОВЕРКА GIT
# ============================================
echo "1️⃣  ПРОВЕРКА GIT"
echo "----------------"
if command -v git &> /dev/null; then
    echo -e "${GREEN}✅ Git установлен${NC}"
    
    # Проверка статуса
    if git status &> /dev/null; then
        echo -e "${GREEN}✅ Git репозиторий инициализирован${NC}"
        
        # Проверка на незакоммиченные изменения
        if [ -n "$(git status --porcelain)" ]; then
            echo -e "${YELLOW}⚠️  Есть незакоммиченные изменения:${NC}"
            git status --short | head -5
            WARNINGS=$((WARNINGS + 1))
        else
            echo -e "${GREEN}✅ Нет незакоммиченных изменений${NC}"
        fi
        
        # Проверка ветки
        BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
        echo "   Ветка: $BRANCH"
        
        # Проверка синхронизации с удаленным репозиторием
        git fetch origin &> /dev/null
        LOCAL=$(git rev-parse HEAD 2>/dev/null)
        REMOTE=$(git rev-parse origin/main 2>/dev/null)
        if [ "$LOCAL" = "$REMOTE" ]; then
            echo -e "${GREEN}✅ Локальная ветка синхронизирована с origin/main${NC}"
        else
            echo -e "${YELLOW}⚠️  Локальная ветка не синхронизирована с origin/main${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}❌ Не является git репозиторием${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Git не установлен${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 2. ПРОВЕРКА БАЗЫ ДАННЫХ
# ============================================
echo "2️⃣  ПРОВЕРКА БАЗЫ ДАННЫХ"
echo "------------------------"
if [ -f "database.db" ]; then
    DB_SIZE=$(du -h database.db 2>/dev/null | cut -f1 || echo "unknown")
    echo -e "${GREEN}✅ База данных существует ($DB_SIZE)${NC}"
    
    # Проверка прав доступа
    DB_PERMS=$(ls -l database.db | awk '{print $1}')
    echo "   Права: $DB_PERMS"
    
    # Проверка подключения к базе
    if command -v sqlite3 &> /dev/null; then
        if sqlite3 database.db "SELECT 1;" &> /dev/null; then
            echo -e "${GREEN}✅ Подключение к базе данных работает${NC}"
            
            # Проверка целостности
            INTEGRITY=$(sqlite3 database.db "PRAGMA integrity_check;" 2>/dev/null | head -1)
            if [ "$INTEGRITY" = "ok" ]; then
                echo -e "${GREEN}✅ Целостность базы данных: OK${NC}"
            else
                echo -e "${RED}❌ Ошибка целостности базы данных: $INTEGRITY${NC}"
                ERRORS=$((ERRORS + 1))
            fi
            
            # Проверка таблиц
            TABLES=$(sqlite3 database.db ".tables" 2>/dev/null | wc -w)
            echo "   Таблиц в базе: $TABLES"
            
            # Проверка количества записей в services
            SERVICES_COUNT=$(sqlite3 database.db "SELECT COUNT(*) FROM services;" 2>/dev/null || echo "0")
            echo "   Услуг в базе: $SERVICES_COUNT"
        else
            echo -e "${RED}❌ Не удалось подключиться к базе данных${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  sqlite3 CLI не установлен (не критично)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ База данных не найдена!${NC}"
    echo -e "${YELLOW}💡 Решение: База будет создана при первом запуске сервера${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 3. ПРОВЕРКА SQLITE3 МОДУЛЯ NODE.JS
# ============================================
echo "3️⃣  ПРОВЕРКА SQLITE3 МОДУЛЯ"
echo "----------------------------"
if [ -d "node_modules/sqlite3" ]; then
    echo -e "${GREEN}✅ Модуль sqlite3 установлен${NC}"
    
    # Проверка нативного модуля
    if [ -f "node_modules/sqlite3/build/Release/node_sqlite3.node" ]; then
        echo -e "${GREEN}✅ Нативный модуль sqlite3 скомпилирован${NC}"
        
        # Проверка архитектуры
        if command -v file &> /dev/null; then
            ARCH=$(file node_modules/sqlite3/build/Release/node_sqlite3.node 2>/dev/null | grep -o "ELF.*" || echo "unknown")
            echo "   Архитектура: $ARCH"
        fi
    else
        echo -e "${RED}❌ Нативный модуль sqlite3 не найден!${NC}"
        echo -e "${YELLOW}💡 Решение: npm install sqlite3 --build-from-source${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Проверка версии
    if [ -f "node_modules/sqlite3/package.json" ]; then
        VERSION=$(grep '"version"' node_modules/sqlite3/package.json | head -1 | cut -d'"' -f4)
        echo "   Версия: $VERSION"
    fi
else
    echo -e "${RED}❌ Модуль sqlite3 не установлен!${NC}"
    echo -e "${YELLOW}💡 Решение: npm install sqlite3 --build-from-source${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 4. ПРОВЕРКА ПАПКИ UPLOADS
# ============================================
echo "4️⃣  ПРОВЕРКА ПАПКИ UPLOADS"
echo "--------------------------"
if [ -d "uploads" ]; then
    echo -e "${GREEN}✅ Папка uploads существует${NC}"
    
    # Проверка прав доступа
    UPLOADS_PERMS=$(ls -ld uploads | awk '{print $1}')
    echo "   Права: $UPLOADS_PERMS"
    
    # Проверка на запись
    if [ -w "uploads" ]; then
        echo -e "${GREEN}✅ Папка uploads доступна для записи${NC}"
    else
        echo -e "${RED}❌ Папка uploads НЕ доступна для записи!${NC}"
        echo -e "${YELLOW}💡 Решение: chmod 755 uploads${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Подсчет файлов
    FILES_COUNT=$(find uploads -type f 2>/dev/null | wc -l)
    UPLOADS_SIZE=$(du -sh uploads 2>/dev/null | cut -f1 || echo "0")
    echo "   Файлов: $FILES_COUNT"
    echo "   Размер: $UPLOADS_SIZE"
    
    if [ "$FILES_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Папка uploads пуста${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Проверка последних файлов
    if [ "$FILES_COUNT" -gt 0 ]; then
        echo "   Последние 3 файла:"
        find uploads -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -3 | while read timestamp filepath; do
            filename=$(basename "$filepath")
            size=$(du -h "$filepath" 2>/dev/null | cut -f1 || echo "unknown")
            echo "     - $filename ($size)"
        done
    fi
else
    echo -e "${RED}❌ Папка uploads не существует!${NC}"
    echo -e "${YELLOW}💡 Решение: mkdir -p uploads && chmod 755 uploads${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 5. ПРОВЕРКА PM2 И ПРИЛОЖЕНИЯ
# ============================================
echo "5️⃣  ПРОВЕРКА PM2 И ПРИЛОЖЕНИЯ"
echo "-----------------------------"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2 установлен${NC}"
    
    # Проверка статуса приложения
    if pm2 list | grep -q "arenda-neba"; then
        STATUS=$(pm2 jlist 2>/dev/null | grep -o '"name":"arenda-neba"[^}]*"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        
        if [ "$STATUS" = "online" ]; then
            echo -e "${GREEN}✅ Приложение arenda-neba запущено (статус: $STATUS)${NC}"
            
            # Проверка времени работы
            UPTIME=$(pm2 jlist 2>/dev/null | grep -o '"name":"arenda-neba"[^}]*"pm_uptime":[0-9]*' | grep -o '"pm_uptime":[0-9]*' | cut -d':' -f2 || echo "0")
            if [ "$UPTIME" -gt 0 ]; then
                UPTIME_HOURS=$((UPTIME / 3600000))
                UPTIME_MINS=$(((UPTIME % 3600000) / 60000))
                echo "   Время работы: ${UPTIME_HOURS}ч ${UPTIME_MINS}м"
            fi
            
            # Проверка перезапусков
            RESTARTS=$(pm2 jlist 2>/dev/null | grep -o '"name":"arenda-neba"[^}]*"restart_time":[0-9]*' | grep -o '"restart_time":[0-9]*' | cut -d':' -f2 || echo "0")
            if [ "$RESTARTS" -gt 0 ]; then
                echo -e "${YELLOW}⚠️  Количество перезапусков: $RESTARTS${NC}"
                WARNINGS=$((WARNINGS + 1))
            else
                echo "   Перезапусков: 0"
            fi
        else
            echo -e "${RED}❌ Приложение arenda-neba НЕ запущено (статус: $STATUS)${NC}"
            echo -e "${YELLOW}💡 Решение: pm2 restart arenda-neba${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}❌ Приложение arenda-neba не найдено в PM2${NC}"
        echo -e "${YELLOW}💡 Решение: pm2 start server.js --name arenda-neba${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ PM2 не установлен!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 6. ПРОВЕРКА ПОРТА И HTTP ДОСТУПНОСТИ
# ============================================
echo "6️⃣  ПРОВЕРКА ПОРТА И HTTP"
echo "------------------------"
if command -v ss &> /dev/null || command -v netstat &> /dev/null; then
    if ss -tulpn 2>/dev/null | grep -q ":3000" || netstat -tulpn 2>/dev/null | grep -q ":3000"; then
        echo -e "${GREEN}✅ Порт 3000 слушается${NC}"
        
        # Проверка HTTP ответа
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
            echo -e "${GREEN}✅ Приложение отвечает на HTTP запросы (код: $HTTP_CODE)${NC}"
        else
            echo -e "${RED}❌ Приложение НЕ отвечает на HTTP запросы (код: $HTTP_CODE)${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}❌ Порт 3000 НЕ слушается${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Не удалось проверить порт (ss/netstat не найдены)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================
# 7. ПРОВЕРКА ЛОГОВ НА ОШИБКИ
# ============================================
echo "7️⃣  ПРОВЕРКА ЛОГОВ НА ОШИБКИ"
echo "----------------------------"
if pm2 list | grep -q "arenda-neba"; then
    # Проверка последних ошибок
    ERROR_COUNT=$(pm2 logs arenda-neba --lines 100 --nostream 2>&1 | grep -iE "error|❌|ошибка|failed|fail|Cannot find module" | wc -l)
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✅ Ошибок в последних 100 строках логов не найдено${NC}"
    else
        echo -e "${RED}❌ Найдено ошибок в логах: $ERROR_COUNT${NC}"
        echo "   Последние ошибки:"
        pm2 logs arenda-neba --lines 100 --nostream 2>&1 | grep -iE "error|❌|ошибка|failed|fail|Cannot find module" | tail -5 | sed 's/^/     /'
        ERRORS=$((ERRORS + 1))
    fi
    
    # Проверка на критичные ошибки
    CRITICAL_ERRORS=$(pm2 logs arenda-neba --lines 50 --nostream 2>&1 | grep -iE "Cannot find module.*sqlite3|MODULE_NOT_FOUND.*sqlite3|invalid ELF header" | wc -l)
    if [ "$CRITICAL_ERRORS" -gt 0 ]; then
        echo -e "${RED}❌ КРИТИЧЕСКАЯ ОШИБКА: Проблемы с модулем sqlite3!${NC}"
        echo -e "${YELLOW}💡 Решение: ./install-sqlite3.sh или ./fix-sqlite3.sh${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Приложение не запущено, логи недоступны${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================
# 8. ПРОВЕРКА ЗАВИСИМОСТЕЙ
# ============================================
echo "8️⃣  ПРОВЕРКА ЗАВИСИМОСТЕЙ"
echo "-------------------------"
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json найден${NC}"
    
    if [ -d "node_modules" ]; then
        MODULES_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
        echo -e "${GREEN}✅ node_modules существует ($MODULES_COUNT модулей)${NC}"
        
        # Проверка критичных модулей
        CRITICAL_MODULES=("express" "sqlite3" "multer" "sharp" "bcryptjs")
        for module in "${CRITICAL_MODULES[@]}"; do
            if [ -d "node_modules/$module" ]; then
                echo "   ✅ $module установлен"
            else
                echo -e "   ${RED}❌ $module НЕ установлен${NC}"
                ERRORS=$((ERRORS + 1))
            fi
        done
    else
        echo -e "${RED}❌ node_modules не найден!${NC}"
        echo -e "${YELLOW}💡 Решение: npm install${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ package.json не найден!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 9. ПРОВЕРКА КРИТИЧНЫХ ФАЙЛОВ
# ============================================
echo "9️⃣  ПРОВЕРКА КРИТИЧНЫХ ФАЙЛОВ"
echo "-----------------------------"
CRITICAL_FILES=("server.js" "package.json" ".gitignore" "deploy.sh")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅ $file${NC}"
    else
        echo -e "   ${RED}❌ $file не найден${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Проверка папки public
if [ -d "public" ]; then
    PUBLIC_FILES=$(find public -type f | wc -l)
    echo -e "   ${GREEN}✅ public/ ($PUBLIC_FILES файлов)${NC}"
else
    echo -e "   ${RED}❌ public/ не найдена${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 10. ПРОВЕРКА .GITIGNORE
# ============================================
echo "🔟 ПРОВЕРКА .GITIGNORE"
echo "----------------------"
if [ -f ".gitignore" ]; then
    if grep -q "database.db" .gitignore && grep -q "uploads/" .gitignore; then
        echo -e "${GREEN}✅ База данных и uploads в .gitignore${NC}"
    else
        echo -e "${RED}❌ База данных или uploads НЕ в .gitignore!${NC}"
        echo -e "${YELLOW}💡 Решение: Добавьте database.db и uploads/ в .gitignore${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ .gitignore не найден!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# ИТОГОВЫЙ ОТЧЕТ
# ============================================
echo "=========================================="
echo "📊 ИТОГОВЫЙ ОТЧЕТ"
echo "=========================================="
echo ""

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✅ ВСЁ ОТЛИЧНО! Ошибок не найдено.${NC}"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Найдено предупреждений: $WARNINGS${NC}"
    echo -e "${GREEN}✅ Критических ошибок нет.${NC}"
    exit 0
else
    echo -e "${RED}❌ Найдено критических ошибок: $ERRORS${NC}"
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Найдено предупреждений: $WARNINGS${NC}"
    fi
    echo ""
    echo "💡 Рекомендации по исправлению:"
    echo "   1. Проверьте логи: pm2 logs arenda-neba --lines 50"
    echo "   2. Установите зависимости: npm install"
    echo "   3. Исправьте sqlite3: ./install-sqlite3.sh"
    echo "   4. Перезапустите: pm2 restart arenda-neba"
    exit 1
fi
