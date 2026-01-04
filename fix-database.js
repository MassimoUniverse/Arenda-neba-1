const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Путь к текущей базе
const currentDbPath = path.join(__dirname, 'database.db');

// Путь к бэкапу "slightly done"
const backupDbPath = path.join(__dirname, '..', 'backups', 'slightly done', 'database.db');

console.log('🔍 Проверка базы данных...\n');

// Проверяем наличие текущей базы
if (!fs.existsSync(currentDbPath)) {
  console.log('❌ База данных не найдена, копируем из бэкапа...');
  if (fs.existsSync(backupDbPath)) {
    fs.copyFileSync(backupDbPath, currentDbPath);
    console.log('✅ База данных скопирована из бэкапа');
  } else {
    console.error('❌ Бэкап не найден:', backupDbPath);
    process.exit(1);
  }
}

// Открываем текущую базу
const db = new sqlite3.Database(currentDbPath, (err) => {
  if (err) {
    console.error('❌ Ошибка открытия БД:', err.message);
    process.exit(1);
  }
  console.log('✅ База данных открыта');
});

// Проверяем наличие таблицы services
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('❌ Ошибка проверки таблиц:', err.message);
    db.close();
    process.exit(1);
  }

  const tableNames = tables.map(t => t.name);
  console.log('📊 Найдено таблиц:', tableNames.length);
  console.log('   Таблицы:', tableNames.join(', ') || 'НЕТ ТАБЛИЦ');

  if (!tableNames.includes('services')) {
    console.log('\n❌ Таблица services не найдена!');
    console.log('📦 Копируем базу данных из бэкапа...');
    
    db.close();
    
    // Делаем резервную копию текущей базы
    if (fs.existsSync(currentDbPath)) {
      const backupPath = currentDbPath + '.backup';
      fs.copyFileSync(currentDbPath, backupPath);
      console.log('✅ Резервная копия создана:', backupPath);
    }
    
    // Копируем из бэкапа
    if (fs.existsSync(backupDbPath)) {
      fs.copyFileSync(backupDbPath, currentDbPath);
      console.log('✅ База данных скопирована из бэкапа "slightly done"');
      console.log('\n✅ Готово! Теперь можно запустить restore-reach-diagrams.js');
    } else {
      console.error('❌ Бэкап не найден:', backupDbPath);
      process.exit(1);
    }
  } else {
    console.log('\n✅ Таблица services найдена');
    console.log('✅ База данных в порядке');
    db.close();
  }
});

