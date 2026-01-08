const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Список старых услуг для удаления (по названиям)
const oldServicesToDelete = [
  'Автовышка 12-18 метров',
  'Автовышка 20-28 метров',
  'Автовышка 30-45 метров'
];

console.log('🧹 Начинаем очистку старых услуг...\n');

db.serialize(() => {
  // Сначала показываем, что будет удалено
  db.all('SELECT id, title FROM services', [], (err, services) => {
    if (err) {
      console.error('❌ Ошибка при получении списка услуг:', err);
      db.close();
      return;
    }
    
    console.log('📋 Все услуги в базе:');
    services.forEach(service => {
      const willDelete = oldServicesToDelete.includes(service.title);
      console.log(`  ${willDelete ? '🗑️' : '✓'} [${service.id}] ${service.title}`);
    });
    
    console.log('\n🗑️ Удаляем старые услуги...\n');
    
    // Удаляем старые услуги
    let deletedCount = 0;
    let remainingCount = services.length;
    
    oldServicesToDelete.forEach((title, index) => {
      db.run('DELETE FROM services WHERE title = ?', [title], function(err) {
        if (err) {
          console.error(`❌ Ошибка при удалении "${title}":`, err.message);
        } else if (this.changes > 0) {
          console.log(`✅ Удалено: "${title}" (ID: ${this.lastID})`);
          deletedCount++;
          remainingCount--;
        } else {
          console.log(`⚠️ Не найдено: "${title}"`);
        }
        
        // После последнего удаления показываем итоги
        if (index === oldServicesToDelete.length - 1) {
          setTimeout(() => {
            console.log('\n📊 Итоги:');
            console.log(`  Удалено: ${deletedCount} услуг`);
            console.log(`  Осталось: ${remainingCount} услуг\n`);
            
            // Показываем оставшиеся услуги
            db.all('SELECT id, title, is_popular FROM services ORDER BY id', [], (err, remainingServices) => {
              if (err) {
                console.error('❌ Ошибка при получении оставшихся услуг:', err);
              } else {
                console.log('📋 Оставшиеся услуги:');
                remainingServices.forEach(service => {
                  const popular = service.is_popular ? '⭐ (популярная)' : '';
                  console.log(`  [${service.id}] ${service.title} ${popular}`);
                });
              }
              
              db.close();
              console.log('\n✅ Очистка завершена!');
            });
          }, 100);
        }
      });
    });
  });
});
