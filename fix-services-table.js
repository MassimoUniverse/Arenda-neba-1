const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🔧 Исправление таблицы services...\n');

db.serialize(() => {
  // 1. Проверяем, существует ли таблица services
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='services'", (err, row) => {
    if (err) {
      console.error('❌ Ошибка при проверке таблицы services:', err.message);
      db.close();
      process.exit(1);
    }
    
    if (!row) {
      // Таблицы нет - создаём её со всеми колонками
      console.log('⚠️  Таблица services не существует! Создаём...\n');
      
      db.run(`CREATE TABLE services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price TEXT,
        image_url TEXT,
        specifications TEXT,
        active INTEGER DEFAULT 1,
        order_num INTEGER,
        url TEXT,
        reach_diagram_url TEXT,
        reach_diagrams TEXT,
        images TEXT,
        is_popular INTEGER DEFAULT 0,
        popular_order INTEGER DEFAULT 0,
        card_bullets TEXT,
        height_lift TEXT,
        max_reach TEXT,
        max_capacity TEXT,
        lift_type TEXT,
        transport_length TEXT,
        transport_height TEXT,
        width TEXT,
        boom_rotation_angle TEXT,
        basket_rotation_angle TEXT,
        basket_size TEXT,
        voltage TEXT,
        maneuverability TEXT,
        setup_time TEXT,
        delivery_per_km INTEGER DEFAULT 85,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('❌ Ошибка при создании таблицы services:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('✅ Таблица services создана со всеми колонками');
        checkColumns();
      });
    } else {
      // Таблица существует - проверяем колонки
      console.log('✅ Таблица services существует');
      checkColumns();
    }
  });
  
  function checkColumns() {
    // 2. Проверяем наличие всех необходимых колонок
    db.all("PRAGMA table_info(services)", [], (err, columns) => {
      if (err) {
        console.error('❌ Ошибка при проверке колонок:', err.message);
        db.close();
        process.exit(1);
      }
      
      const columnNames = columns.map(col => col.name);
      console.log(`\n📊 Найдено колонок: ${columnNames.length}`);
      
      // Список обязательных колонок
      const requiredColumns = [
        'id', 'title', 'description', 'price', 'image_url', 'specifications',
        'active', 'order_num', 'url', 'reach_diagram_url', 'reach_diagrams',
        'images', 'is_popular', 'popular_order', 'card_bullets',
        'height_lift', 'max_reach', 'max_capacity', 'lift_type',
        'transport_length', 'transport_height', 'width',
        'boom_rotation_angle', 'basket_rotation_angle',
        'basket_size', 'voltage', 'maneuverability', 'setup_time',
        'delivery_per_km', 'updated_at'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length > 0) {
        console.log(`\n⚠️  Отсутствуют колонки (${missingColumns.length}):`);
        missingColumns.forEach(col => console.log(`   - ${col}`));
        console.log('\n📝 Добавляем недостающие колонки...\n');
        addMissingColumns(missingColumns, columnNames);
      } else {
        console.log('\n✅ Все необходимые колонки присутствуют!');
        db.close();
        process.exit(0);
      }
    });
  }
  
  function addMissingColumns(missingColumns, existingColumns) {
    let added = 0;
    let errors = 0;
    
    missingColumns.forEach((col, index) => {
      let columnDef = '';
      
      // Определяем тип колонки
      if (col === 'id') {
        return; // id уже должна быть
      } else if (col === 'active' || col === 'is_popular' || col === 'popular_order' || col === 'order_num' || col === 'delivery_per_km') {
        columnDef = 'INTEGER';
        if (col === 'active') columnDef += ' DEFAULT 1';
        if (col === 'is_popular' || col === 'popular_order') columnDef += ' DEFAULT 0';
        if (col === 'delivery_per_km') columnDef += ' DEFAULT 85';
      } else if (col === 'updated_at') {
        columnDef = 'DATETIME DEFAULT CURRENT_TIMESTAMP';
      } else {
        columnDef = 'TEXT';
      }
      
      db.run(`ALTER TABLE services ADD COLUMN ${col} ${columnDef}`, (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log(`   ⚠️  Колонка ${col} уже существует (игнорируем)`);
          } else {
            console.error(`   ❌ Ошибка при добавлении колонки ${col}:`, err.message);
            errors++;
          }
        } else {
          console.log(`   ✅ Добавлена колонка: ${col}`);
          added++;
        }
        
        // Проверяем, все ли колонки обработаны
        if (added + errors >= missingColumns.length) {
          console.log(`\n✅ Добавлено колонок: ${added}`);
          if (errors > 0) {
            console.log(`⚠️  Ошибок: ${errors}`);
          }
          console.log('\n✅ Таблица services исправлена!');
          db.close();
          process.exit(0);
        }
      });
    });
  }
});
