const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Импортируем функции из server.js
// Для этого нужно скопировать функции generateEquipmentPageHTML и generateUrlFromTitle
// Или использовать require, но проще скопировать логику

// Функция для генерации URL из названия
function generateUrlFromTitle(title) {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '.html';
}

// Упрощенная версия генерации HTML (основные части)
// Полную версию лучше взять из server.js
function generateEquipmentPageHTML(service) {
  const title = service.title || 'Автовышка';
  const description = service.description || '';
  const price = service.price || '';
  const imageUrl = service.image_url || '/images/avtovyshka-13m.png';
  
  const heightLift = service.height_lift || '';
  const maxReach = service.max_reach || '';
  const maxCapacity = service.max_capacity || '';
  const liftType = service.lift_type || '';
  const transportLength = service.transport_length || '';
  const transportHeight = service.transport_height || '';
  const width = service.width || '';
  const boomRotationAngle = service.boom_rotation_angle || '';
  const basketRotationAngle = service.basket_rotation_angle || '';
  
  // Парсим цену
  let priceShift = '';
  if (price) {
    const shiftMatch = price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
    if (shiftMatch) {
      priceShift = shiftMatch[1].replace(/\s/g, '');
    }
  }
  
  const metaDescription = description.length > 150 
    ? description.substring(0, 150) + '...' 
    : description || `Аренда ${title.toLowerCase()} в Санкт-Петербурге. ☎ +7 (991) 000-91-11`;
  
  // Используем существующий файл как шаблон и заменяем данные
  const templatePath = path.join(__dirname, 'public', 'equipment', 'avtovyshka-13m.html');
  
  if (fs.existsSync(templatePath)) {
    let html = fs.readFileSync(templatePath, 'utf8');
    
    // Заменяем основные данные
    html = html.replace(/<title>.*?<\/title>/, `<title>${title} - Аренда в СПб | Аренда Неба</title>`);
    html = html.replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}"`);
    
    // Заменяем заголовок
    html = html.replace(/<h1[^>]*>.*?<\/h1>/, `<h1>${title}</h1>`);
    
    // Заменяем характеристики в specs-grid
    if (heightLift) {
      html = html.replace(/(<div class="spec-label">Высота подъема[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${heightLift}$2`);
    }
    if (maxReach) {
      html = html.replace(/(<div class="spec-label">(?:Максимальный вылет|Вылет стрелы)[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${maxReach}$2`);
    }
    if (maxCapacity) {
      html = html.replace(/(<div class="spec-label">(?:Максимальная грузоподъемность|Грузоподъемность)[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${maxCapacity}$2`);
    }
    if (liftType) {
      html = html.replace(/(<div class="spec-label">(?:Тип подъемника|База)[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${liftType}$2`);
    }
    if (transportLength) {
      html = html.replace(/(<div class="spec-label">Длина в транспортном положении[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${transportLength}$2`);
    }
    if (transportHeight) {
      html = html.replace(/(<div class="spec-label">Высота в транспортном положении[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${transportHeight}$2`);
    }
    if (width) {
      html = html.replace(/(<div class="spec-label">Ширина[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${width}$2`);
    }
    if (boomRotationAngle) {
      html = html.replace(/(<div class="spec-label">Угол поворота стрелы[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${boomRotationAngle}$2`);
    }
    if (basketRotationAngle) {
      html = html.replace(/(<div class="spec-label">Угол поворота корзины[^<]*<\/div>\s*<div class="spec-value">)[^<]*(<\/div>)/, `$1${basketRotationAngle}$2`);
    }
    
    // Заменяем цену
    if (priceShift) {
      html = html.replace(/(<span class="pricing-value">)\d+[\s\d]*\s*₽/, `$1${priceShift} ₽`);
    }
    
    // Заменяем описание
    html = html.replace(/(<p[^>]*>)[^<]*(<\/p>)/, (match, p1, p2) => {
      // Ищем первый параграф в описании
      if (match.includes('Описание') || match.includes('description')) {
        return p1 + description + p2;
      }
      return match;
    });
    
    return html;
  }
  
  // Если шаблона нет, возвращаем базовый HTML
  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Аренда в СПб | Аренда Неба</title>
    <meta name="description" content="${metaDescription}">
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <p>Цена: ${price}</p>
</body>
</html>`;
}

const db = new sqlite3.Database('./database.db');

console.log('🔄 Начинаем генерацию страниц техники...\n');

db.serialize(() => {
  // Получаем все услуги
  db.all('SELECT * FROM services WHERE active = 1 ORDER BY order_num', [], (err, services) => {
    if (err) {
      console.error('❌ Ошибка при получении услуг:', err);
      db.close();
      return;
    }

    if (services.length === 0) {
      console.log('⚠️  Услуги не найдены в базе данных');
      db.close();
      return;
    }

    console.log(`📊 Найдено ${services.length} услуг для генерации страниц\n`);

    const equipmentDir = path.join(__dirname, 'public', 'equipment');
    
    // Создаем директорию если её нет
    if (!fs.existsSync(equipmentDir)) {
      fs.mkdirSync(equipmentDir, { recursive: true });
      console.log('📁 Создана директория:', equipmentDir);
    }

    let generated = 0;
    let errors = 0;

    services.forEach((service, index) => {
      try {
        // Определяем имя файла
        let filename = service.url || generateUrlFromTitle(service.title);
        filename = filename.replace(/^\/+/, '').replace(/^equipment\//, '');
        if (!filename.endsWith('.html')) {
          filename += '.html';
        }

        const filePath = path.join(equipmentDir, filename);

        // Генерируем HTML
        const html = generateEquipmentPageHTML(service);

        // Записываем файл
        fs.writeFileSync(filePath, html, 'utf8');

        generated++;
        console.log(`✅ ${index + 1}. ${service.title} -> ${filename}`);
      } catch (error) {
        errors++;
        console.error(`❌ Ошибка при создании страницы для "${service.title}":`, error.message);
      }
    });

    console.log(`\n✅ Всего создано: ${generated} страниц`);
    if (errors > 0) {
      console.log(`❌ Ошибок: ${errors}`);
    }
    console.log('✅ Генерация завершена!\n');

    db.close((err) => {
      if (err) {
        console.error('❌ Ошибка при закрытии базы:', err);
      } else {
        console.log('💾 База данных закрыта');
        console.log('\n🔄 Перезапустите приложение: pm2 restart arenda-neba');
      }
    });
  });
});

