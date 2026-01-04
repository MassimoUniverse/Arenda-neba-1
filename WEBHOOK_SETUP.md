# 🔗 Настройка вебхука для автоматического деплоя

## Шаг 1: Закоммитить и запушить изменения

### На локальной машине (где вы сейчас работаете):

```bash
# 1. Перейдите в папку deploy
cd deploy

# 2. Проверьте статус
git status

# 3. Добавьте все изменения
git add .

# 4. Закоммитьте изменения
git commit -m "Добавлена автоматическая генерация страниц техники"

# 5. Запушьте на GitHub
git push origin main
```

## Шаг 2: Настроить вебхук на GitHub

### 2.1. Зайдите на GitHub:

1. Откройте: https://github.com/MassimoUniverse/Arenda-neba-1
2. Нажмите **Settings** (вверху справа)
3. В левом меню нажмите **Webhooks**
4. Нажмите **Add webhook**

### 2.2. Заполните форму:

- **Payload URL**: `http://ВАШ_IP_СЕРВЕРА:3000/webhook` или `http://ваш-домен.ru/webhook`
  - Замените на ваш реальный IP или домен
  - Если используете домен, убедитесь что он указывает на сервер
  
- **Content type**: выберите `application/json`

- **Secret**: оставьте пустым (или создайте секретный ключ, если хотите)

- **Which events**: выберите **Just the push event**

- **Active**: галочка должна быть

- Нажмите **Add webhook**

## Шаг 3: Создать обработчик вебхука на сервере

### 3.1. Подключитесь к серверу:

```bash
ssh user@ваш-сервер
# Замените user и ваш-сервер на реальные данные
```

### 3.2. Создайте файл для обработки вебхука:

```bash
cd /opt/arenda-neba
nano webhook-handler.js
```

### 3.3. Вставьте этот код:

```javascript
const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PORT = 3001; // Другой порт для вебхука

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        
        // Проверяем что это push в main ветку
        if (payload.ref === 'refs/heads/main') {
          console.log('🔄 Webhook received: push to main branch');
          
          // Выполняем деплой
          const deployScript = path.join(__dirname, 'deploy.sh');
          
          exec(`bash ${deployScript}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`❌ Deploy error: ${error}`);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Deploy failed');
              return;
            }
            
            console.log(`✅ Deploy output: ${stdout}`);
            if (stderr) {
              console.error(`⚠️ Deploy warnings: ${stderr}`);
            }
            
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Deploy successful');
          });
        } else {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Not main branch, ignoring');
        }
      } catch (error) {
        console.error('❌ Webhook error:', error);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid payload');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🔗 Webhook handler listening on port ${PORT}`);
});
```

### 3.4. Сохраните файл:
- Нажмите `Ctrl+O` (сохранить)
- Нажмите `Enter` (подтвердить)
- Нажмите `Ctrl+X` (выйти)

### 3.5. Обновите deploy.sh:

```bash
nano deploy.sh
```

Убедитесь что там такой код:

```bash
#!/bin/bash
cd /opt/arenda-neba
git pull origin main
npm install
pm2 restart arenda-neba
```

Сохраните (`Ctrl+O`, `Enter`, `Ctrl+X`)

### 3.6. Сделайте скрипт исполняемым:

```bash
chmod +x deploy.sh
```

### 3.7. Запустите обработчик вебхука через PM2:

```bash
pm2 start webhook-handler.js --name webhook-handler
pm2 save
```

## Шаг 4: Настроить Nginx (если используете)

Если у вас настроен Nginx, добавьте проксирование:

```bash
sudo nano /etc/nginx/sites-available/arenda-neba
```

Добавьте в блок server:

```nginx
location /webhook {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Перезапустите Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 5: Проверить работу

### 5.1. Сделайте тестовый коммит:

```bash
# На локальной машине
cd deploy
echo "# Test" >> test.txt
git add test.txt
git commit -m "Test webhook"
git push origin main
```

### 5.2. Проверить логи:

```bash
# На сервере
pm2 logs webhook-handler
pm2 logs arenda-neba
```

Должны увидеть:
```
🔄 Webhook received: push to main branch
✅ Deploy output: ...
```

## Готово! 🎉

Теперь при каждом `git push origin main` сайт будет автоматически обновляться на сервере!

