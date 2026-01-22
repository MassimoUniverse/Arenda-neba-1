const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Путь к бэкапу
let backupDbPath = process.argv[2] || path.join(__dirname, 'database.db.backup');

if (!fs.existsSync(backupDbPath)) {
  console.error('❌ Бэкап не найден:', backupDbPath);
  console.log('\n💡 Укажите путь к бэкапу:');
  console.log('   node check-backup-structure.js /path/to/backup/database.db');
  process.exit(1);
}

console.log('🔍 Проверка структуры бэкапа...\n');
console.log('📂 Путь к бэкапу:', backupDbPath);

const backupDb = new sqlite3.Database(backupDbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Ошибка открытия бэкапа:', err.message);
    process.exit(1);
  }
  console.log('✅ Бэкап открыт\n');
});

// Получаем список всех таблиц
backupDb.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
  if (err) {
    console.error('❌ Ошибка получения списка таблиц:', err.message);
    backupDb.close();
    process.exit(1);
  }

  console.log('📋 Таблицы в бэкапе:');
  if (tables.length === 0) {
    console.log('   ⚠️  Таблиц не найдено!');
  } else {
    tables.forEach(table => {
      console.log(`   ✅ ${table.name}`);
    });
  }

  // Проверяем наличие таблицы services
  const hasServices = tables.some(t => t.name === 'services');
  
  if (!hasServices) {
    console.log('\n❌ Таблица "services" не найдена в бэкапе!');
    console.log('\n💡 Возможные варианты:');
    console.log('   1. Используйте другой бэкап');
    console.log('   2. Восстановите данные вручную через админ-панель');
    console.log('   3. Проверьте другие бэкапы:');
    
    // Ищем другие бэкапы
    const possibleBackupDirs = [
      __dirname,
      path.join(__dirname, '..'),
      '/opt/backups',
      '/root/backups',
    ];
    
    let foundBackups = [];
    for (const backupDir of possibleBackupDirs) {
      if (fs.existsSync(backupDir)) {
        try {
          const items = fs.readdirSync(backupDir);
          items.forEach(item => {
            const itemPath = path.join(backupDir, item);
            if (fs.statSync(itemPath).isFile() && 
                (item.includes('database') || item.includes('db')) &&
                item !== 'database.db') {
              foundBackups.push(itemPath);
            } else if (fs.statSync(itemPath).isDirectory()) {
              const dbPath = path.join(itemPath, 'database.db');
              if (fs.existsSync(dbPath)) {
                foundBackups.push(dbPath);
              }
            }
          });
        } catch (e) {
          // Игнорируем ошибки доступа
        }
      }
    }
    
    if (foundBackups.length > 0) {
      console.log('\n   Найденные бэкапы:');
      foundBackups.forEach(backup => {
        console.log(`   - ${backup}`);
      });
    }
  } else {
    // Если таблица services есть, проверяем её содержимое
    console.log('\n✅ Таблица "services" найдена!');
    
    backupDb.all('SELECT COUNT(*) as count FROM services', [], (err, countRows) => {
      if (err) {
        console.error('❌ Ошибка подсчета записей:', err.message);
        backupDb.close();
        return;
      }
      
      const count = countRows[0].count;
      console.log(`📊 Записей в таблице services: ${count}`);
      
      if (count === 0) {
        console.log('⚠️  Таблица пустая!');
      } else {
        // Проверяем наличие изображений и схем
        backupDb.all(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 ELSE 0 END) as with_image_url,
            SUM(CASE WHEN images IS NOT NULL AND images != '' THEN 1 ELSE 0 END) as with_images,
            SUM(CASE WHEN reach_diagrams IS NOT NULL AND reach_diagrams != '' THEN 1 ELSE 0 END) as with_reach_diagrams,
            SUM(CASE WHEN reach_diagram_url IS NOT NULL AND reach_diagram_url != '' THEN 1 ELSE 0 END) as with_reach_diagram_url
          FROM services
          WHERE active = 1
        `, [], (err, statsRows) => {
          if (err) {
            console.error('❌ Ошибка получения статистики:', err.message);
            backupDb.close();
            return;
          }
          
          const stats = statsRows[0];
          console.log('\n📈 Статистика активных услуг:');
          console.log(`   Всего активных: ${stats.total}`);
          console.log(`   С image_url: ${stats.with_image_url}`);
          console.log(`   С images: ${stats.with_images}`);
          console.log(`   С reach_diagrams: ${stats.with_reach_diagrams}`);
          console.log(`   С reach_diagram_url: ${stats.with_reach_diagram_url}`);
          
          if (stats.with_image_url > 0 || stats.with_images > 0 || stats.with_reach_diagrams > 0) {
            console.log('\n✅ Бэкап содержит данные для восстановления!');
            console.log('💡 Запустите: node restore-all-images-and-diagrams.js ' + backupDbPath);
          } else {
            console.log('\n⚠️  Бэкап не содержит изображений или схем для восстановления');
          }
          
          backupDb.close();
        });
      }
    });
  }
});
