/**
 * Прямая регенерация страниц: загружаем функции из server.js через eval
 * Это безопасный одноразовый скрипт
 */
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// Загружаем server.js как текст и извлекаем нужные функции
const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

// Извлекаем fixEncoding
function fixEncoding(str) {
  if (!str || typeof str !== 'string') return str || '';
  // Simplified — в большинстве случаев данные уже корректные
  return str;
}

// Извлекаем fixImageUrl
function fixImageUrl(url) {
  if (!url) return '';
  let fixed = url;
  fixed = fixed.replace(/https?:\/\/localhost:\d+/g, '');
  fixed = fixed.replace(/\.png/g, '.webp');
  return fixed;
}

// Извлекаем generateUrlFromTitle
function generateUrlFromTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '.html';
}

// Загружаем generateEquipmentPageHTML из server.js
// Ищем от "function generateEquipmentPageHTML" до следующей "function "
const startMatch = serverCode.indexOf('function generateEquipmentPageHTML(service)');
if (startMatch === -1) {
  console.error('Cannot find generateEquipmentPageHTML in server.js');
  process.exit(1);
}

// Ищем конец функции — следующий "function " на том же уровне отступа
let braceCount = 0;
let funcEnd = startMatch;
let started = false;
for (let i = startMatch; i < serverCode.length; i++) {
  if (serverCode[i] === '{') { braceCount++; started = true; }
  if (serverCode[i] === '}') { braceCount--; }
  if (started && braceCount === 0) { funcEnd = i + 1; break; }
}

const funcCode = serverCode.substring(startMatch, funcEnd);
// eval the function
eval(funcCode);

// Аналогично для createEquipmentPage
const startMatch2 = serverCode.indexOf('function createEquipmentPage(service)');
let braceCount2 = 0;
let funcEnd2 = startMatch2;
let started2 = false;
for (let i = startMatch2; i < serverCode.length; i++) {
  if (serverCode[i] === '{') { braceCount2++; started2 = true; }
  if (serverCode[i] === '}') { braceCount2--; }
  if (started2 && braceCount2 === 0) { funcEnd2 = i + 1; break; }
}
const funcCode2 = serverCode.substring(startMatch2, funcEnd2);
eval(funcCode2);

// Теперь генерируем страницы
const db = new sqlite3.Database('./database.db');

db.all('SELECT * FROM services WHERE active = 1 ORDER BY order_num', [], (err, services) => {
  if (err) { console.error(err); db.close(); return; }

  console.log(`📊 Найдено ${services.length} услуг\n`);

  const avtoparkDir = path.join(__dirname, 'public', 'avtopark');
  if (!fs.existsSync(avtoparkDir)) {
    fs.mkdirSync(avtoparkDir, { recursive: true });
  }

  services.forEach((service, i) => {
    try {
      // Применяем processServiceRow-подобную обработку
      if (service.custom_specs && typeof service.custom_specs === 'string') {
        try { service.custom_specs = JSON.parse(service.custom_specs); } catch(e) {}
      }
      if (service.images && typeof service.images === 'string') {
        try { service.images = JSON.parse(service.images); } catch(e) {}
      }
      if (service.reach_diagrams && typeof service.reach_diagrams === 'string') {
        try { service.reach_diagrams = JSON.parse(service.reach_diagrams); } catch(e) {}
      }

      const result = createEquipmentPage(service);
      if (result) {
        console.log(`✅ ${i+1}. ${service.title} -> ${path.basename(result)}`);
      } else {
        console.log(`❌ ${i+1}. ${service.title} — ошибка генерации`);
      }
    } catch(e) {
      console.error(`❌ ${i+1}. ${service.title}:`, e.message);
    }
  });

  db.close(() => console.log('\n✅ Готово'));
});
