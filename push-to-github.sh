#!/bin/bash

# Скрипт для отправки изменений с сервера в GitHub
# Использование: ./push-to-github.sh [commit message]

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/opt/arenda-neba"

echo -e "${BLUE}📤 Отправка изменений в GitHub...${NC}"
echo ""

# Переходим в директорию проекта
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Директория проекта не найдена: $PROJECT_DIR${NC}"
    exit 1
}

echo -e "${GREEN}✅ Директория проекта: $PROJECT_DIR${NC}"
echo ""

# Проверяем Git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Git репозиторий не найден${NC}"
    echo -e "${YELLOW}💡 Инициализируйте репозиторий:${NC}"
    echo "   git init"
    echo "   git remote add origin https://github.com/MassimoUniverse/Arenda-neba-1.git"
    exit 1
fi

# Проверяем статус
echo -e "${BLUE}📊 Проверяем статус Git...${NC}"
git status

# Проверяем, есть ли изменения
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Нет изменений для коммита${NC}"
    exit 0
fi

# Получаем сообщение коммита
COMMIT_MESSAGE="${1:-Update files from server}"

echo ""
echo -e "${BLUE}📝 Добавляем все изменения...${NC}"
git add -A

echo ""
echo -e "${BLUE}💾 Создаем коммит: ${COMMIT_MESSAGE}${NC}"
git commit -m "$COMMIT_MESSAGE" || {
    echo -e "${YELLOW}⚠️  Нет новых изменений для коммита${NC}"
    exit 0
}

echo ""
echo -e "${BLUE}📤 Отправляем в GitHub...${NC}"
git push origin main || {
    echo -e "${RED}❌ Ошибка при отправке в GitHub${NC}"
    echo -e "${YELLOW}💡 Возможные причины:${NC}"
    echo "   1. Нет прав доступа к репозиторию"
    echo "   2. Нужна аутентификация (токен или SSH ключ)"
    echo "   3. Конфликт с удаленной веткой"
    echo ""
    echo -e "${YELLOW}💡 Решения:${NC}"
    echo "   - Проверьте настройки: git remote -v"
    echo "   - Используйте токен: git push https://TOKEN@github.com/MassimoUniverse/Arenda-neba-1.git main"
    echo "   - Или настройте SSH ключ"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Изменения успешно отправлены в GitHub!${NC}"
echo ""
