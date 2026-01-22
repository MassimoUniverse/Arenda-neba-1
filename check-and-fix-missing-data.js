const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./database.db');

console.log('🔍 Проверка данных в базе...\n');

// Проверяем все активные услуги
db.all('SELECT id, title, url, image_url, images, reach_diagrams, reach_diagram_url FROM services WHERE active = 1', [], (err, services) => {
  if (err) {
    console.error('❌ Ошибка при получении услуг:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`📊 Найдено активных услуг: ${services.length}\n`);

  let withImageUrl = 0;
  let withImages = 0;
  let withReachDiagrams = 0;
  let withReachDiagramUrl = 0;
  let missingImages = [];
  let missingDiagrams = [];

  services.forEach(service => {
    if (service.image_url && service.image_url.trim()) {
      withImageUrl++;
    } else {
      missingImages.push(service);
    }

    if (service.images && service.images.trim()) {
      try {
        const parsed = JSON.parse(service.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          withImages++;
        }
      } catch (e) {
        // Не JSON
      }
    }

    if (service.reach_diagrams && service.reach_diagrams.trim()) {
      try {
        const parsed = JSON.parse(service.reach_diagrams);
        if (Array.isArray(parsed) && parsed.length > 0) {
          withReachDiagrams++;
        }
      } catch (e) {
        // Не JSON
      }
    } else if (service.reach_diagram_url && service.reach_diagram_url.trim()) {
      withReachDiagramUrl++;
    } else {
      missingDiagrams.push(service);
    }
  });

  console.log('📈 Статистика:');
  console.log(`   📸 С image_url: ${withImageUrl}/${services.length}`);
  console.log(`   📸 С images (массив): ${withImages}/${services.length}`);
  console.log(`   📐 С reach_diagrams: ${withReachDiagrams}/${services.length}`);
  console.log(`   📐 С reach_diagram_url: ${withReachDiagramUrl}/${services.length}`);

  if (missingImages.length > 0) {
    console.log(`\n⚠️  Услуги без image_url (${missingImages.length}):`);
    missingImages.forEach(s => {
      console.log(`   - ${s.title} (ID: ${s.id})`);
    });
  }

  if (missingDiagrams.length > 0) {
    console.log(`\n⚠️  Услуги без схем вылета стрелы (${missingDiagrams.length}):`);
    missingDiagrams.forEach(s => {
      console.log(`   - ${s.title} (ID: ${s.id}, URL: ${s.url})`);
    });
  }

  console.log('\n💡 Рекомендации:');
  
  if (missingDiagrams.length > 0) {
    console.log('   1. Схемы вылета стрелы нужно добавить вручную через админ-панель');
    console.log('   2. Или найти бэкап, который содержит схемы');
  }
  
  if (withImageUrl === services.length && withReachDiagrams === 0) {
    console.log('\n✅ Все изображения на месте!');
    console.log('⚠️  Но схемы вылета стрелы отсутствуют.');
    console.log('\n📝 Что делать:');
    console.log('   1. Зайдите в админ-панель');
    console.log('   2. Откройте каждую услугу');
    console.log('   3. Загрузите схемы вылета стрелы');
    console.log('   4. После загрузки страницы перегенерируются автоматически');
  }

  db.close();
  process.exit(0);
});
