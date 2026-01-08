# Проверка HTML на сервере

## Проблема
Слайды не появляются, ошибка: "Element #popular-equipment not found"

## Возможная причина
Файл `index.html` на сервере не содержит секцию с id="popular-equipment"

## Проверка на сервере

### 1. Проверьте наличие секции в HTML
```bash
cd /opt/arenda-neba
grep -n "popular-equipment" public/index.html
```

**Должна быть строка:**
```html
<section id="popular-equipment" class="section our-capabilities-section">
```

### 2. Если секции нет, обновите файлы
```bash
cd /opt/arenda-neba
git pull origin main
```

### 3. Проверьте, что файл обновился
```bash
grep -n "popular-equipment" public/index.html
```

### 4. Проверьте контейнер слайдов
```bash
grep -n "our-capabilities-slider" public/index.html
```

**Должна быть строка:**
```html
<div class="our-capabilities-slider" id="our-capabilities-slider">
```

### 5. Перезапустите сервер
```bash
pm2 restart arenda-neba
```

### 6. Очистите кэш браузера
- Нажмите Ctrl+Shift+Delete
- Выберите "Изображения и файлы в кэше"
- Нажмите "Удалить данные"

Или откройте сайт в режиме инкогнито (Ctrl+Shift+N)

### 7. Проверьте консоль браузера
Откройте DevTools (F12) и проверьте:
- Есть ли сообщение "🔄 Initializing slider..."
- Есть ли сообщение "✅ Section found:"
- Есть ли ошибки (красные сообщения)

### 8. Если секция всё ещё не найдена

Проверьте полный HTML файл:
```bash
cat public/index.html | grep -A 20 "Популярная техника"
```

Должен быть такой блок:
```html
<!-- POPULAR EQUIPMENT SLIDER -->
<section id="popular-equipment" class="section our-capabilities-section">
  <div class="container section-header" data-fade-in>
    <h2>Популярная техника</h2>
  </div>
  <div class="container our-capabilities-description" data-fade-in>
    <p>Самые востребованные автовышки нашего автопарка для различных задач.</p>
  </div>
  <div class="our-capabilities-sticky">
    <div class="our-capabilities-slider" id="our-capabilities-slider">
      <!-- Слайды будут добавлены через JavaScript -->
    </div>
    <div class="container popular-equipment-button">
      <a href="#autopark" class="btn btn-primary">Посмотреть весь автопарк</a>
    </div>
  </div>
</section>
```

### 9. Если секции нет в файле

Восстановите файл из локальной копии:
```bash
# На локальной машине (Windows)
scp "F:\New site\deploy\public\index.html" user@server:/opt/arenda-neba/public/index.html

# Или через WinSCP скопируйте файл вручную
```

### 10. После восстановления файла
```bash
cd /opt/arenda-neba
pm2 restart arenda-neba
```
