const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Adding updated_at column to services table...');

db.serialize(() => {
  // Проверяем, существует ли уже колонка updated_at
  db.all("PRAGMA table_info(services)", [], (err, columns) => {
    if (err) {
      console.error('❌ Error checking table structure:', err);
      db.close();
      return;
    }
    
    const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
    
    if (hasUpdatedAt) {
      console.log('✅ Column updated_at already exists in services table');
      db.close();
      return;
    }
    
    // Добавляем колонку updated_at
    db.run("ALTER TABLE services ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
      if (err) {
        console.error('❌ Error adding updated_at column:', err);
        db.close();
        return;
      }
      
      console.log('✅ Successfully added updated_at column to services table');
      
      // Обновляем все существующие записи, устанавливая updated_at в текущее время
      db.run("UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL", (err) => {
        if (err) {
          console.error('❌ Error updating existing records:', err);
        } else {
          console.log('✅ Updated existing records with current timestamp');
        }
        db.close();
      });
    });
  });
});
