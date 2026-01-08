# 🔧 Исправление: файл содержит "404: Not Found"

## Проблема
Файл `webhook-handler.js` на сервере содержит "404: Not Found" вместо JavaScript кода.

Это произошло, потому что curl не смог скачать файл с GitHub (возможно, неправильный URL или файл не в репозитории).

## Решение: Создать файл вручную

### Шаг 1: Удалите поврежденный файл
```bash
# На сервере
cd /opt/arenda-neba
rm webhook-handler.js
```

### Шаг 2: Создайте файл заново
```bash
nano webhook-handler.js
```

### Шаг 3: Скопируйте и вставьте ВЕСЬ этот код:

```javascript
const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PROJECT_DIR = process.env.PROJECT_DIR || '/opt/arenda-neba';
const PORT = process.env.WEBHOOK_PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        
        if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
          console.log('🔄 Webhook received: push to main branch');
          console.log('   Commit:', payload.head_commit?.message || 'N/A');
          
          const deployScript = path.join(PROJECT_DIR, 'deploy.sh');
          
          exec(`bash ${deployScript}`, { 
            cwd: PROJECT_DIR,
            env: { ...process.env, PATH: process.env.PATH, PROJECT_DIR: PROJECT_DIR }
          }, (error, stdout, stderr) => {
            if (error) {
              console.error(`❌ Deploy error: ${error}`);
              res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('Deploy failed: ' + error.message);
              return;
            }
            
            console.log(`✅ Deploy output: ${stdout}`);
            if (stderr) {
              console.error(`⚠️ Deploy warnings: ${stderr}`);
            }
            
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Deploy successful');
          });
        } else {
          console.log('ℹ️  Push to non-main branch, ignoring');
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not main branch, ignoring');
        }
      } catch (error) {
        console.error('❌ Webhook error:', error);
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid payload: ' + error.message);
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🔗 Webhook handler listening on port ${PORT}`);
  console.log(`📁 Project directory: ${PROJECT_DIR}`);
  console.log(`   Ready to receive GitHub webhooks`);
});
```

### Шаг 4: Сохраните файл
- Нажмите `Ctrl+O` (сохранить)
- Нажмите `Enter` (подтвердить)
- Нажмите `Ctrl+X` (выйти)

### Шаг 5: Проверьте синтаксис
```bash
node -c webhook-handler.js
```

**Если команда ничего не выводит** - файл правильный! ✅

**Если видите ошибку** - проверьте, что скопировали весь код правильно.

### Шаг 6: Проверьте содержимое
```bash
head -3 webhook-handler.js
```

Должно быть:
```
const http = require('http');
const { exec } = require('child_process');
const path = require('path');
```

**НЕ должно быть:**
```
404: Not Found
```

### Шаг 7: Перезапустите PM2
```bash
pm2 restart webhook-handler
pm2 logs webhook-handler --lines 20
```

Должны увидеть:
```
🔗 Webhook handler listening on port 3001
📁 Project directory: /opt/arenda-neba
   Ready to receive GitHub webhooks
```

## Альтернатива: Использовать WinSCP

1. Откройте WinSCP
2. Подключитесь к серверу
3. Перейдите в `/opt/arenda-neba/`
4. Удалите файл `webhook-handler.js` (если есть)
5. Скопируйте файл `F:\New site\webhook-handler.js` на сервер
6. На сервере выполните:
```bash
node -c webhook-handler.js
pm2 restart webhook-handler
```

## Важно

После создания файла убедитесь, что он содержит правильный JavaScript код, а не "404: Not Found"!
