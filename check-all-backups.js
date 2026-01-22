const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Список бэкапов для проверки
const backupPaths = [
  path.join(__dirname, 'database.db.backup'),
  path.join(__dirname, 'database_backup_20260122_102927.db'),
  path.join(__dirname, 'database_temp_1769077767.db'),
  path.join(__dirname, 'database.db'), // Текущая база
];

console.log('🔍 Проверка всех доступных бэкапов...\n');

const results = [];

backupPaths.forEach((backupPath, index) => {
  if (!fs.existsSync(backupPath)) {
    console.log(`${index + 1}. ${backupPath}`);
    console.log('   ⚠️  Файл не найден\n');
    return;
  }

  console.log(`${index + 1}. ${backupPath}`);
  
  const db = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.log(`   ❌ Ошибка открытия: ${err.message}\n`);
      return;
    }

    // Проверяем наличие таблицы services
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='services'", [], (err, tables) => {
      if (err) {
        console.log(`   ❌ Ошибка проверки таблиц: ${err.message}\n`);
        db.close();
        return;
      }

      if (tables.length === 0) {
        console.log('   ⚠️  Таблица "services" не найдена\n');
        db.close();
        return;
      }

      // Получаем статистику
      db.all(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 ELSE 0 END) as with_image_url,
          SUM(CASE WHEN images IS NOT NULL AND images != '' THEN 1 ELSE 0 END) as with_images,
          SUM(CASE WHEN reach_diagrams IS NOT NULL AND reach_diagrams != '' THEN 1 ELSE 0 END) as with_reach_diagrams,
          SUM(CASE WHEN reach_diagram_url IS NOT NULL AND reach_diagram_url != '' THEN 1 ELSE 0 END) as with_reach_diagram_url
        FROM services
      `, [], (err, statsRows) => {
        if (err) {
          console.log(`   ❌ Ошибка получения статистики: ${err.message}\n`);
          db.close();
          return;
        }

        const stats = statsRows[0];
        console.log(`   ✅ Таблица "services" найдена`);
        console.log(`   📊 Всего услуг: ${stats.total}`);
        console.log(`   📊 Активных: ${stats.active}`);
        console.log(`   📸 С image_url: ${stats.with_image_url}`);
        console.log(`   📸 С images: ${stats.with_images}`);
        console.log(`   📐 С reach_diagrams: ${stats.with_reach_diagrams}`);
        console.log(`   📐 С reach_diagram_url: ${stats.with_reach_diagram_url}`);

        const hasData = stats.with_image_url > 0 || stats.with_images > 0 || stats.with_reach_diagrams > 0;
        
        if (hasData) {
          console.log(`   ✅ ПОДХОДИТ ДЛЯ ВОССТАНОВЛЕНИЯ!`);
          results.push({
            path: backupPath,
            stats: stats,
            suitable: true
          });
        } else {
          console.log(`   ⚠️  Нет данных для восстановления`);
        }
        
        console.log('');
        db.close();

        // Если это последний файл, выводим итоги
        if (index === backupPaths.length - 1) {
          console.log('\n📋 ИТОГИ:\n');
          
          const suitable = results.filter(r => r.suitable);
          if (suitable.length > 0) {
            console.log('✅ Найдены подходящие бэкапы:');
            suitable.forEach((result, idx) => {
              console.log(`\n${idx + 1}. ${result.path}`);
              console.log(`   Активных услуг: ${result.stats.active}`);
              console.log(`   С изображениями: ${result.stats.with_image_url + result.stats.with_images}`);
              console.log(`   С схемами: ${result.stats.with_reach_diagrams + result.stats.with_reach_diagram_url}`);
              console.log(`\n   💡 Запустите восстановление:`);
              console.log(`   node restore-all-images-and-diagrams.js "${result.path}"`);
            });
          } else {
            console.log('❌ Подходящих бэкапов не найдено');
            console.log('\n💡 Варианты:');
            console.log('   1. Восстановите данные вручную через админ-панель');
            console.log('   2. Проверьте текущую базу данных - возможно, данные уже там есть');
            console.log('   3. Загрузите изображения и схемы через админ-панель');
          }
        }
      });
    });
  });
});
