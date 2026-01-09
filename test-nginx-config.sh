#!/bin/bash

echo "🔍 Проверка конфигурации Nginx..."
echo ""

# Проверка конфига
echo "1. Проверка синтаксиса Nginx:"
sudo nginx -t
echo ""

# Проверка активных конфигов
echo "2. Активные конфиги:"
ls -la /etc/nginx/sites-enabled/
echo ""

# Проверка содержимого конфига
echo "3. Содержимое конфига arenda-neba:"
sudo cat /etc/nginx/sites-available/arenda-neba | grep -E "server_name|listen|proxy_pass" | head -10
echo ""

# Проверка статуса Nginx
echo "4. Статус Nginx:"
sudo systemctl status nginx --no-pager | head -10
echo ""

# Проверка портов
echo "5. Проверка портов:"
sudo ss -tulpn | grep -E ":80|:3000"
echo ""

# Проверка PM2
echo "6. Статус PM2:"
pm2 status
echo ""

# Проверка локального доступа
echo "7. Проверка локального доступа:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000 || echo "❌ Приложение не отвечает на порту 3000"
echo ""

echo "✅ Проверка завершена"

