# 🚀 Инструкция по настройке на сервере

## 📋 Первоначальная настройка

### 1. Подключитесь к серверу:
```bash
ssh root@your-server-ip
# или
ssh user@your-server-ip
```

### 2. Перейдите в папку проекта:
```bash
cd /opt/arenda-neba
# или
cd /path/to/your/project
```

### 3. Настройте автоматическую регенерацию страниц после git pull:

```bash
# Копируем hook в Git
cp post-merge-hook.sh .git/hooks/post-merge

# Делаем hook исполняемым
chmod +x .git/hooks/post-merge

# Делаем скрипт обновления исполняемым
chmod +x update.sh
```

---

## 🔄 Обновление сайта

### Способ 1: Автоматический (рекомендуется)
Используйте готовый скрипт:
```bash
bash update.sh
```

Этот скрипт автоматически:
- ✅ Делает `git pull`
- ✅ Обновляет зависимости
- ✅ Регенерирует страницы оборудования
- ✅ Перезапускает PM2

---

### Способ 2: Ручной
```bash
# 1. Получить изменения
git pull origin main

# 2. Регенерировать страницы
node generate-pages.js

# 3. Перезапустить PM2
pm2 restart arenda-neba
```

---

## 🔍 Проверка работы

После обновления проверьте:

```bash
# Статус приложения
pm2 status

# Логи приложения
pm2 logs arenda-neba

# Последние 50 строк логов
pm2 logs arenda-neba --lines 50
```

---

## ⚠️ Устранение проблем

### Если картинки не грузятся:
```bash
# Принудительная регенерация страниц
node generate-pages.js

# Проверьте, что изображения есть
ls -la public/images/
```

### Если сервер не перезапускается:
```bash
# Остановить PM2
pm2 stop arenda-neba

# Удалить процесс из PM2
pm2 delete arenda-neba

# Запустить заново
pm2 start server.js --name arenda-neba

# Сохранить конфигурацию PM2
pm2 save
```

### Если Git hook не работает:
```bash
# Проверьте права доступа
ls -la .git/hooks/post-merge

# Должно быть: -rwxr-xr-x (исполняемый)
# Если нет, исправьте:
chmod +x .git/hooks/post-merge
```

---

## 📝 Полезные команды

```bash
# Просмотр статуса Git
git status

# Просмотр последних коммитов
git log --oneline -5

# Отменить локальные изменения (осторожно!)
git reset --hard origin/main

# Обновить только HTML страницы
node generate-pages.js

# Перезапустить сервер
pm2 restart arenda-neba

# Посмотреть использование ресурсов
pm2 monit
```

---

## 🎯 Автозапуск при перезагрузке сервера

```bash
# Сохранить текущие процессы PM2
pm2 save

# Настроить автозапуск PM2 при старте системы
pm2 startup

# Выполните команду, которую предложит PM2
```

---

## 📞 Контакты

Если возникли проблемы:
1. Проверьте логи: `pm2 logs arenda-neba`
2. Проверьте статус: `pm2 status`
3. Посмотрите эту инструкцию: `cat SETUP_SERVER.md`
