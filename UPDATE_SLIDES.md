# Обновление слайдов на сервере

## Проблема
Слайды не отображаются на сайте после восстановления из бекапа.

## Решение

### 1. Подключитесь к серверу по SSH
```bash
ssh user@your-server-ip
```

### 2. Перейдите в директорию проекта
```bash
cd /path/to/your/project
```

### 3. Обновите файлы из репозитория
```bash
git pull origin main
```

### 4. Убедитесь, что файлы обновились
Проверьте наличие секции слайдов в `public/index.html`:
```bash
grep -n "popular-equipment" public/index.html
```

Проверьте наличие функции инициализации в `public/script.js`:
```bash
grep -n "initOurCapabilitiesSlider" public/script.js
```

### 5. Перезапустите сервер
```bash
pm2 restart all
# или
pm2 restart server
```

### 6. Проверьте логи
```bash
pm2 logs server
```

### 7. Очистите кэш браузера
- Откройте сайт в режиме инкогнито
- Или очистите кэш браузера (Ctrl+Shift+Delete)

## Если файлы не обновились

### Проверьте статус Git
```bash
git status
```

### Если есть конфликты
```bash
git reset --hard origin/main
git clean -fd
git pull origin main
```

### Переустановите зависимости (если нужно)
```bash
npm install
```

### Перезапустите сервер
```bash
pm2 restart all
```

## Проверка работы слайдов

1. Откройте сайт в браузере
2. Найдите секцию "Популярная техника"
3. Откройте консоль браузера (F12)
4. Проверьте наличие ошибок JavaScript
5. Проверьте, что функция `initOurCapabilitiesSlider` вызывается

## Отладка

Если слайды всё ещё не работают, проверьте в консоли браузера:

```javascript
// Проверьте наличие секции
document.getElementById('popular-equipment')

// Проверьте наличие контейнера слайдов
document.getElementById('our-capabilities-slider')

// Проверьте наличие функции
typeof initOurCapabilitiesSlider
```
