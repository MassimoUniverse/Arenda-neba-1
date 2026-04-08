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

function parseEquipmentPrices(price, deliveryPerKm) {
  let priceHalfShift = '';
  let priceShift = '';
  const d = deliveryPerKm || 85;
  if (price) {
    const halfShiftMatch = price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*полсмен/i);
    if (halfShiftMatch) priceHalfShift = halfShiftMatch[1].replace(/\s/g, '');
    const shiftMatch = price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
    if (shiftMatch) {
      priceShift = shiftMatch[1].replace(/\s/g, '');
    } else {
      const anyPriceMatch = price.match(/(\d+[\s\d]*)/);
      if (anyPriceMatch) priceShift = anyPriceMatch[1].replace(/\s/g, '');
    }
  }
  if (!priceShift) priceShift = '18000';
  return { priceHalfShift, priceShift, deliveryPerKm: d };
}

function buildPricingSectionHtml(service) {
  const { priceHalfShift, priceShift, deliveryPerKm } = parseEquipmentPrices(service.price, service.delivery_per_km);
  let rows = '';
  if (priceHalfShift) {
    rows += `<div class="pricing-row">
                                <span>Полсмены (3+1 часа)</span>
                                <span class="pricing-value">${parseInt(priceHalfShift, 10).toLocaleString('ru-RU')} ₽ <span class="price-vat">без НДС</span></span>
                            </div>`;
  }
  rows += `<div class="pricing-row">
                                <span>1 смена (8 часов)</span>
                                <span class="pricing-value">${parseInt(priceShift, 10).toLocaleString('ru-RU')} ₽ <span class="price-vat">без НДС</span></span>
                            </div>
                            <div class="pricing-row">
                                <span>Подача техники (за КАД)</span>
                                <span class="pricing-value">${deliveryPerKm} ₽/км × 2 (в каждую сторону)</span>
                            </div>`;
  const note = priceHalfShift
    ? `<p class="pricing-note">* Полсмены (3+1) согласовывается отдельно по началу времени работы</p>`
    : '';
  return `<div class="pricing-table">
                            ${rows}
                        </div>
                        ${note}`;
}

// Упрощенная версия генерации HTML (основные части)
// Полную версию лучше взять из server.js
function generateEquipmentPageHTML(service) {
  const title = service.title || 'Автовышка';
  const description = service.description || '';
  const price = service.price || '';
  // Определяем путь к изображению (приоритет: webp > jpg > png)
  let imageUrl = service.image_url || '/images/avtovyshka-13m.webp';
  
  // Исправляем путь: убираем localhost и меняем .png на .webp
  if (imageUrl) {
    imageUrl = imageUrl.replace(/http:\/\/localhost:\d+/g, '');
    imageUrl = imageUrl.replace(/https?:\/\/[^\/]+/g, '');
    imageUrl = imageUrl.replace('.png', '.webp');
  }
  
  const heightLift = service.height_lift || '';
  const maxReach = service.max_reach || '';
  const maxCapacity = service.max_capacity || '';
  const liftType = service.lift_type || '';
  const transportLength = service.transport_length || '';
  const transportHeight = service.transport_height || '';
  const width = service.width || '';
  const boomRotationAngle = service.boom_rotation_angle || '';
  const basketRotationAngle = service.basket_rotation_angle || '';
  
  const metaDescription = description.length > 150 
    ? description.substring(0, 150) + '...' 
    : description || `Аренда ${title.toLowerCase()} в Санкт-Петербурге. ☎ +7 (991) 000-91-11`;
  
  // Используем _template.html как шаблон (отдельный файл, не перезаписывается генератором)
  const templatePath = path.join(__dirname, 'public', 'avtopark', '_template.html');
  // Fallback на старый шаблон если _template.html не найден
  const fallbackPath = path.join(__dirname, 'public', 'avtopark', 'avtovyshka-13m.html');
  
  const resolvedTemplatePath = fs.existsSync(templatePath) ? templatePath : fallbackPath;
  
  if (fs.existsSync(resolvedTemplatePath)) {
    let html = fs.readFileSync(resolvedTemplatePath, 'utf8');
    
    // Заменяем основные данные
    html = html.replace(/<title>.*?<\/title>/, `<title>${title} - Аренда в СПб | Аренда Неба</title>`);
    html = html.replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}"`);
    
    // Заменяем заголовок
    html = html.replace(/<h1[^>]*>.*?<\/h1>/, `<h1>${title}</h1>`);

    // Проставляем корректное значение для скрытого поля equipment в форме калькулятора
    html = html.replace(
      /(<input\s+type="hidden"\s+name="equipment"\s+value=")[^"]*(")/,
      `$1${title.replace(/"/g, '&quot;')}$2`
    );
    
    // Строим specs-grid HTML из custom_specs или legacy полей
    let customSpecs = [];
    if (service.custom_specs) {
      try {
        const parsed = typeof service.custom_specs === 'string' ? JSON.parse(service.custom_specs) : service.custom_specs;
        if (Array.isArray(parsed)) customSpecs = parsed;
      } catch(e) { /* ignore */ }
    }
    
    let specsHtml = '';
    if (customSpecs.length > 0) {
      customSpecs.filter(s => s && s.label && s.value).forEach(s => {
        specsHtml += `<div class="spec-item"><div class="spec-icon">${s.icon || '📏'}</div><div class="spec-info"><div class="spec-label">${s.label}</div><div class="spec-value">${s.value}</div></div></div>\n`;
      });
    } else {
      const legacy = [
        { icon: '📏', label: 'Высота подъема', value: heightLift },
        { icon: '📐', label: 'Вылет стрелы', value: maxReach },
        { icon: '⚖️', label: 'Грузоподъемность корзины', value: maxCapacity },
        { icon: '🚗', label: 'Тип', value: liftType },
        { icon: '📏', label: 'Длина в транспортном положении', value: transportLength },
        { icon: '📏', label: 'Высота в транспортном положении', value: transportHeight },
        { icon: '📏', label: 'Ширина', value: width },
        { icon: '🔄', label: 'Угол поворота стрелы', value: boomRotationAngle },
        { icon: '🔄', label: 'Угол поворота корзины', value: basketRotationAngle }
      ];
      legacy.forEach(s => {
        if (s.value) specsHtml += `<div class="spec-item"><div class="spec-icon">${s.icon}</div><div class="spec-info"><div class="spec-label">${s.label}</div><div class="spec-value">${s.value}</div></div></div>\n`;
      });
    }
    
    // Заменяем весь specs-grid содержимым из БД
    html = html.replace(/<div class="specs-grid">[\s\S]*?<\/div>\s*<div class="reach-diagrams/, 
      `<div class="specs-grid">\n${specsHtml}</div>\n<div class="reach-diagrams`);
    
    // Парсим и инжектим reach diagrams data
    let reachDiagrams = [];
    if (service.reach_diagrams) {
      try {
        const parsed = typeof service.reach_diagrams === 'string' ? JSON.parse(service.reach_diagrams) : service.reach_diagrams;
        if (Array.isArray(parsed)) reachDiagrams = parsed;
      } catch(e) { /* ignore */ }
    }
    if (reachDiagrams.length === 0 && service.reach_diagram_url) {
      reachDiagrams = [{ url: service.reach_diagram_url, title: 'Схема вылета стрелы' }];
    }
    
    // Устанавливаем display для reach diagrams container (поддержка и none и block)
    html = html.replace(
      /id="reachDiagramsContainer" style="display:\s*(none|block);?"/,
      `id="reachDiagramsContainer" style="display: ${reachDiagrams.length > 0 ? 'block' : 'none'};"`
    );
    
    // Удаляем старый скрипт serviceReachDiagrams из шаблона (если есть от предыдущей генерации)
    html = html.replace(/<script>window\.serviceReachDiagrams\s*=[\s\S]*?<\/script>/g, '');
    
    // Инжектим window.serviceReachDiagrams перед закрывающим </div> info-section
    const reachScript = `<script>window.serviceReachDiagrams = ${JSON.stringify(reachDiagrams)};window.serviceReachDiagramUrl = ${JSON.stringify(service.reach_diagram_url || '')};</script>`;
    html = html.replace(
      /<\/div>\s*<\/div>\s*<div class="equipment-tab-content" id="tab-description">/,
      `${reachScript}</div></div>\n<div class="equipment-tab-content" id="tab-description">`
    );
    
    // Заменяем описание из БД
    const descHtml = description ? description : '<p>Описание техники</p>';
    html = html.replace('<!-- DESCRIPTION_PLACEHOLDER -->', descHtml);
    
    // Заменяем изображения
    if (imageUrl) {
      const imgSrc = imageUrl.startsWith('/') ? '..' + imageUrl : '../' + imageUrl;
      html = html.replace(/src="[^"]*" alt="[^"]*" id="mainEquipmentImage"/, `src="${imgSrc}" alt="${title}" id="mainEquipmentImage"`);
      html = html.replace(/(<div class="gallery-thumbnails[^"]*">[\s\S]*?<img src=")[^"]*(")/,  `$1${imgSrc}$2`);
    }
    
    // Блок цен и опция «Полсмены» в калькуляторе
    html = html.replace(
      /<!-- PRICING_BLOCK_START -->[\s\S]*?<!-- PRICING_BLOCK_END -->/,
      `<!-- PRICING_BLOCK_START -->\n                        ${buildPricingSectionHtml(service)}\n                        <!-- PRICING_BLOCK_END -->`
    );
    const { priceHalfShift } = parseEquipmentPrices(service.price, service.delivery_per_km);
    html = html.replace(
      /<!-- HALF_SHIFT_OPTION -->\s*<option value="0\.5">Полсмены<\/option>\s*/,
      priceHalfShift ? '<option value="0.5">Полсмены</option>\n                                ' : ''
    );
    
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

    const avtoparkDir = path.join(__dirname, 'public', 'avtopark');

    // Создаем директорию если её нет
    if (!fs.existsSync(avtoparkDir)) {
      fs.mkdirSync(avtoparkDir, { recursive: true });
      console.log('📁 Создана директория:', avtoparkDir);
    }

    let generated = 0;
    let errors = 0;

    services.forEach((service, index) => {
      try {
        // Определяем имя файла
        let filename = service.url || generateUrlFromTitle(service.title);
        filename = filename.replace(/^\/+/, '').replace(/^(avtopark|equipment)\//, '');
        if (!filename.endsWith('.html')) {
          filename += '.html';
        }

        const filePath = path.join(avtoparkDir, filename);

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

