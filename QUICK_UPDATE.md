# ⚡ Быстрое обновление сайта на сервере

## 🎯 ГЛАВНОЕ - сделайте это ОДИН РАЗ:

### 1️⃣ Подключитесь к серверу:
```bash
ssh root@ВАШ_IP
```

### 2️⃣ Перейдите в папку проекта:
```bash
cd /opt/arenda-neba
```

### 3️⃣ Настройте автоматику (ОДИН РАЗ):
```bash
# Сделайте скрипты исполняемыми
chmod +x update.sh post-merge-hook.sh

# Установите Git hook
cp post-merge-hook.sh .git/hooks/post-merge
chmod +x .git/hooks/post-merge
```

---

## 🚀 ДАЛЬШЕ всегда используйте просто:

```bash
bash update.sh
```

**ВСЁ!** Этот скрипт сделает:
- ✅ `git pull` - получит изменения
- ✅ Регенерирует страницы с правильными картинками
- ✅ Обновит зависимости
- ✅ Перезапустит PM2

---

## 🔍 Проверка:

```bash
# Смотрим статус
pm2 status

# Смотрим логи (если что-то не так)
pm2 logs arenda-neba --lines 50
```

---

## ⚠️ Если что-то пошло не так:

### Картинки не грузятся:
```bash
node generate-pages.js
pm2 restart arenda-neba
```

### Сервер не работает:
```bash
pm2 restart arenda-neba
# или
pm2 stop arenda-neba
pm2 start server.js --name arenda-neba
```

---

## 📝 Полная инструкция:
См. файл `SETUP_SERVER.md` в проекте
