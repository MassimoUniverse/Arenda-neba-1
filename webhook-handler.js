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
          console.log('   Commit:', payload.head_commit?.message || 'N/A');
          
          // Выполняем деплой
          const deployScript = path.join(__dirname, 'deploy.sh');
          
          exec(`bash ${deployScript}`, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
              console.error(`❌ Deploy error: ${error}`);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Deploy failed: ' + error.message);
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
          console.log('ℹ️  Push to non-main branch, ignoring');
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Not main branch, ignoring');
        }
      } catch (error) {
        console.error('❌ Webhook error:', error);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid payload: ' + error.message);
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🔗 Webhook handler listening on port ${PORT}`);
  console.log(`   Ready to receive GitHub webhooks`);
});

