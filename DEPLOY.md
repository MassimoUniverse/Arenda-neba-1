# Инструкция по деплою

## Подготовка к деплою

1. Убедитесь, что все зависимости установлены:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Настройте переменные окружения в `.env`:
   - `PORT` - порт сервера (по умолчанию 3000)
   - `JWT_SECRET` - секретный ключ для JWT (обязательно измените!)
   - `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` - для уведомлений (опционально)

4. Инициализируйте базу данных:
```bash
node init-db.js
```

## Деплой на сервер

### Вариант 1: Через Git и Webhook (рекомендуется)

1. На сервере клонируйте репозиторий:
```bash
git clone https://github.com/MassimoUniverse/Arenda-neba-1.git
cd Arenda-neba-1
```

2. Установите зависимости и настройте:
```bash
npm install
cp .env.example .env
# Отредактируйте .env
node init-db.js
```

3. Настройте PM2 для автозапуска:
```bash
npm install -g pm2
pm2 start server.js --name arenda-neba
pm2 save
pm2 startup
```

4. Настройте webhook для автоматического обновления:
   - Создайте скрипт `deploy.sh`:
   ```bash
   #!/bin/bash
   cd /path/to/Arenda-neba-1
   git pull origin main
   npm install
   pm2 restart arenda-neba
   ```
   - Настройте GitHub webhook, который будет вызывать этот скрипт

### Вариант 2: Ручной деплой

1. Загрузите файлы на сервер (через FTP, SCP и т.д.)

2. На сервере:
```bash
cd /path/to/project
npm install
cp .env.example .env
# Отредактируйте .env
node init-db.js
```

3. Запустите сервер:
```bash
# С PM2
pm2 start server.js --name arenda-neba

# Или с systemd
sudo systemctl start arenda-neba
```

## Обновление через Git

После изменений в репозитории:

```bash
git pull origin main
npm install
pm2 restart arenda-neba
```

## Структура папок на сервере

```
/path/to/Arenda-neba-1/
├── public/          # Статические файлы
├── uploads/         # Загруженные файлы (должна быть доступна для записи)
├── database.db      # База данных (создается автоматически)
├── .env             # Переменные окружения (не в git!)
├── server.js
└── ...
```

## Проверка работы

После деплоя проверьте:
- Главная страница: http://your-server:3000
- Админ-панель: http://your-server:3000/admin.html
- API: http://your-server:3000/api/services

## Логи

Просмотр логов PM2:
```bash
pm2 logs arenda-neba
```

## Перезапуск

```bash
pm2 restart arenda-neba
```

## Остановка

```bash
pm2 stop arenda-neba
```


