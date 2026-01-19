// PM2 Ecosystem файл для правильной конфигурации приложения
module.exports = {
  apps: [{
    name: 'arenda-neba',
    script: './server.js',
    cwd: '/opt/arenda-neba',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_PATH: '/opt/arenda-neba/node_modules'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false
  }]
};
