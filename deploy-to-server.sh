#!/bin/bash

# Скрипт для развертывания на сервере
# Использование: ./deploy-to-server.sh

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/opt/arenda-neba"

echo -e "${BLUE}🚀 Начинаем развертывание...${NC}"
echo ""

# Переходим в директорию проекта
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Директория проекта не найдена: $PROJECT_DIR${NC}"
    exit 1
}

echo -e "${GREEN}✅ Директория проекта: $PROJECT_DIR${NC}"
echo ""

# Проверяем Git
if [ -d ".git" ]; then
    echo -e "${BLUE}📦 Обновляем код из Git...${NC}"
    
    # Останавливаем сервер
    if command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⏸️  Останавливаем сервер...${NC}"
        pm2 stop arenda-neba 2>/dev/null || true
    fi
    
    # Обновляем код
    git fetch origin
    git pull origin main
    
    echo -e "${GREEN}✅ Код обновлен${NC}"
else
    echo -e "${YELLOW}⚠️  Git репозиторий не найден${NC}"
    echo -e "${YELLOW}💡 Используйте SCP или WinSCP для копирования файлов${NC}"
fi

# Устанавливаем зависимости
if [ -f "package.json" ]; then
    echo -e "${BLUE}📥 Устанавливаем зависимости...${NC}"
    npm install --production
    echo -e "${GREEN}✅ Зависимости установлены${NC}"
fi

# Запускаем сервер
if command -v pm2 &> /dev/null; then
    echo -e "${BLUE}▶️  Запускаем сервер...${NC}"
    pm2 restart arenda-neba 2>/dev/null || pm2 start server.js --name arenda-neba
    pm2 save
    echo -e "${GREEN}✅ Сервер запущен${NC}"
    
    # Показываем статус
    echo ""
    echo -e "${BLUE}📊 Статус сервера:${NC}"
    pm2 status
else
    echo -e "${YELLOW}⚠️  PM2 не найден${NC}"
    echo -e "${YELLOW}💡 Запустите сервер вручную: node server.js${NC}"
fi

echo ""
echo -e "${GREEN}✅ Развертывание завершено!${NC}"

# Проверяем файлы
echo ""
echo -e "${BLUE}📋 Проверка файлов:${NC}"
if [ -f "database.db" ]; then
    SIZE=$(du -h database.db | cut -f1)
    echo -e "${GREEN}  ✅ database.db ($SIZE)${NC}"
else
    echo -e "${YELLOW}  ⚠️  database.db не найден${NC}"
fi

if [ -d "public" ]; then
    FILES=$(find public -type f | wc -l)
    echo -e "${GREEN}  ✅ public/ ($FILES файлов)${NC}"
else
    echo -e "${YELLOW}  ⚠️  public/ не найдена${NC}"
fi

if [ -f "server.js" ]; then
    echo -e "${GREEN}  ✅ server.js${NC}"
else
    echo -e "${YELLOW}  ⚠️  server.js не найден${NC}"
fi
