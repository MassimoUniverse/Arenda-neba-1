# ✅ Проверка конфигурации Nginx

## Что видно из логов:

1. ✅ Конфиг `arenda-neba` активен (есть символическая ссылка)
2. ✅ Nginx перезагружен
3. ⚠️ В логах видны запросы от ботов/сканеров (404 на .php файлы - это нормально)

## Проверьте конфиг:

```bash
# Посмотрите содержимое конфига
sudo cat /etc/nginx/sites-available/arenda-neba
```

Убедитесь, что там есть:
```nginx
server {
    listen 80;
    server_name test.arendaneba.ru www.test.arendaneba.ru;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... остальные настройки
    }
}
```

## Проверьте, что сервер работает:

```bash
# Проверьте статус PM2
pm2 status

# Проверьте, что приложение слушает на порту 3000
sudo ss -tulpn | grep :3000

# Проверьте логи приложения
pm2 logs arenda-neba --lines 20
```

## Проверьте доступность с сервера:

```bash
# Проверьте локально
curl -H "Host: test.arendaneba.ru" http://localhost

# Или
curl http://localhost:3000
```

## Проверьте логи Nginx для вашего домена:

```bash
# Смотрите логи в реальном времени
sudo tail -f /var/log/nginx/access.log | grep test.arendaneba.ru

# Или проверьте ошибки
sudo tail -f /var/log/nginx/error.log
```

## Если сайт не открывается с телефона:

1. **Проверьте DNS с телефона:**
   - Используйте приложение для проверки DNS (например, Network Info II для Android)
   - Или откройте в браузере: `http://test.arendaneba.ru` (не https)

2. **Проверьте, что запросы доходят до сервера:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```
   Попробуйте открыть сайт на телефоне и посмотрите, появляются ли записи.

3. **Проверьте файрвол:**
   ```bash
   sudo ufw status
   # Порт 80 должен быть открыт
   ```

## Если запросы не доходят до сервера:

Проблема в DNS на стороне телефона. Попробуйте:
- Перезагрузить телефон
- Использовать режим инкогнито
- Отключить Wi-Fi и использовать мобильный интернет
- Очистить кэш браузера

