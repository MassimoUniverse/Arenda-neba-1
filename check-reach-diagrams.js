const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
    process.exit(1);
  }
  console.log('✅ Подключено к базе данных');
});

console.log('\n🔍 Проверка схем вылета стрелы в базе данных...\n');

db.all('SELECT id, title, url, reach_diagrams, reach_diagram_url FROM services WHERE active = 1 ORDER BY order_num', [], (err, rows) => {
  if (err) {
    console.error('❌ Ошибка при запросе:', err.message);
    db.close();
    return;
  }

  console.log(`📊 Найдено услуг: ${rows.length}\n`);

  let hasDiagrams = 0;
  let noDiagrams = 0;

  rows.forEach((row, index) => {
    let diagrams = [];
    let hasData = false;

    // Проверяем reach_diagrams (новый формат)
    if (row.reach_diagrams && row.reach_diagrams.trim()) {
      try {
        const parsed = JSON.parse(row.reach_diagrams);
        if (Array.isArray(parsed) && parsed.length > 0) {
          diagrams = parsed;
          hasData = true;
        }
      } catch (e) {
        // Не JSON
      }
    }

    // Проверяем reach_diagram_url (старый формат)
    if (!hasData && row.reach_diagram_url && row.reach_diagram_url.trim()) {
      diagrams = [{ url: row.reach_diagram_url, title: 'Схема вылета стрелы' }];
      hasData = true;
    }

    if (hasData) {
      hasDiagrams++;
      console.log(`✅ ${index + 1}. ${row.title} (ID: ${row.id})`);
      console.log(`   URL: ${row.url}`);
      console.log(`   Схем: ${diagrams.length}`);
      diagrams.forEach((d, i) => {
        const url = typeof d === 'string' ? d : (d.url || '');
        const title = typeof d === 'object' && d.title ? d.title : 'Схема вылета стрелы';
        console.log(`   ${i + 1}. ${title}: ${url}`);
      });
      console.log('');
    } else {
      noDiagrams++;
      console.log(`❌ ${index + 1}. ${row.title} (ID: ${row.id}) - НЕТ СХЕМ`);
      console.log(`   URL: ${row.url}`);
      console.log(`   reach_diagrams: ${row.reach_diagrams || '(пусто)'}`);
      console.log(`   reach_diagram_url: ${row.reach_diagram_url || '(пусто)'}`);
      console.log('');
    }
  });

  console.log('\n📈 Итого:');
  console.log(`   ✅ Со схемами: ${hasDiagrams}`);
  console.log(`   ❌ Без схем: ${noDiagrams}`);
  console.log(`   📊 Всего: ${rows.length}\n`);

  db.close();
});

