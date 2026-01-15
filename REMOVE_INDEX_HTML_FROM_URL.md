# Удаление /index.html из URL

## Что сделано

### 1. Редирект в server.js
Добавлен редирект с `/index.html` на `/` в `server.js`:
- При переходе на `test.arendaneba.ru/index.html` происходит редирект на `test.arendaneba.ru/`
- В адресной строке будет только `test.arendaneba.ru`

### 2. Настройка nginx (опционально, но рекомендуется)

Для дополнительной оптимизации можно добавить редирект на уровне nginx:

```bash
sudo nano /etc/nginx/sites-available/arenda-neba
```

Добавьте в блок `server {` перед `location / {`:

```nginx
# Редирект с /index.html на /
location = /index.html {
    return 301 /;
}
```

**Полный пример конфига:**

```nginx
server {
    listen 80;
    server_name test.arendaneba.ru www.test.arendaneba.ru;
    
    client_max_body_size 50M;
    
    # Редирект с /index.html на /
    location = /index.html {
        return 301 /;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

После изменений:

```bash
# Проверьте конфигурацию
sudo nginx -t

# Перезагрузите nginx
sudo systemctl reload nginx
```

## Результат

- ✅ `test.arendaneba.ru/index.html` → редирект на `test.arendaneba.ru/`
- ✅ В адресной строке будет только `test.arendaneba.ru`
- ✅ Все ссылки на `/index.html` будут работать, но перенаправлять на `/`

## После деплоя

После того как изменения будут запушены и деплой выполнен:

```bash
# На сервере
cd /opt/arenda-neba
git pull origin main
pm2 restart arenda-neba
```

Если настроили nginx:
```bash
sudo systemctl reload nginx
```
