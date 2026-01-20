#!/bin/bash

# Скрипт для проверки синтаксиса server.js на сервере
# Использование: ./check-server-syntax.sh

cd /opt/arenda-neba || exit 1

echo "🔍 Проверка синтаксиса server.js"
echo "=================================="
echo ""

# Проверка синтаксиса
if node -c server.js 2>&1; then
    echo "✅ Синтаксис server.js корректен"
else
    echo "❌ ОШИБКА СИНТАКСИСА!"
    echo ""
    echo "Проверяем количество строк..."
    wc -l server.js
    echo ""
    echo "Проверяем последние строки файла..."
    tail -20 server.js
    echo ""
    echo "Проверяем открывающие и закрывающие скобки..."
    OPEN_BRACES=$(grep -o '{' server.js | wc -l)
    CLOSE_BRACES=$(grep -o '}' server.js | wc -l)
    OPEN_PARENS=$(grep -o '(' server.js | wc -l)
    CLOSE_PARENS=$(grep -o ')' server.js | wc -l)
    echo "   Открывающих фигурных скобок: $OPEN_BRACES"
    echo "   Закрывающих фигурных скобок: $CLOSE_BRACES"
    echo "   Открывающих круглых скобок: $OPEN_PARENS"
    echo "   Закрывающих круглых скобок: $CLOSE_PARENS"
    
    if [ "$OPEN_BRACES" -ne "$CLOSE_BRACES" ]; then
        echo "   ⚠️  Несоответствие фигурных скобок!"
    fi
    if [ "$OPEN_PARENS" -ne "$CLOSE_PARENS" ]; then
        echo "   ⚠️  Несоответствие круглых скобок!"
    fi
fi

echo ""
echo "✅ Проверка завершена"
