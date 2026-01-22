const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🔄 Инициализация базы данных...\n');

db.serialize(() => {
  // Создаём все необходимые таблицы
  
  // Таблица для контента сайта
  db.run(`CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT UNIQUE NOT NULL,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка при создании таблицы content:', err.message);
    } else {
      console.log('✅ Таблица content создана/проверена');
    }
  });

  // Таблица для преимуществ
  db.run(`CREATE TABLE IF NOT EXISTS advantages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    order_num INTEGER,
    active INTEGER DEFAULT 1
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка при создании таблицы advantages:', err.message);
    } else {
      console.log('✅ Таблица advantages создана/проверена');
    }
  });

  // Таблица для отзывов
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    company TEXT,
    rating INTEGER DEFAULT 5,
    text TEXT,
    review_text TEXT,
    image_url TEXT,
    date TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка при создании таблицы reviews:', err.message);
    } else {
      console.log('✅ Таблица reviews создана/проверена');
    }
  });

  // Таблица для услуг
  db.run(`CREATE TABLE IF NOT EXISTS services (
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
    } else {
      console.log('✅ Таблица services создана/проверена');
    }
  });

  // Таблица администраторов
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка при создании таблицы admins:', err.message);
    } else {
      console.log('✅ Таблица admins создана/проверена');
    }
  });

  // Таблица заявок
  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка при создании таблицы requests:', err.message);
    } else {
      console.log('✅ Таблица requests создана/проверена');
    }
  });

  // Таблица для главной страницы
  db.run(`CREATE TABLE IF NOT EXISTS homepage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    subtitle TEXT,
    video_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка при создании таблицы homepage:', err.message);
    } else {
      console.log('✅ Таблица homepage создана/проверена');
    }
  });

  // Проверяем наличие всех таблиц
  setTimeout(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error('❌ Ошибка при проверке таблиц:', err.message);
        db.close();
        process.exit(1);
      }

      console.log('\n📊 Список таблиц в базе данных:');
      tables.forEach(table => {
        console.log(`   ✅ ${table.name}`);
      });

      console.log(`\n✅ Всего таблиц: ${tables.length}`);
      console.log('\n💾 База данных инициализирована');
      console.log('\n💡 Теперь можно запустить:');
      console.log('   - node restore-reviews-safe.js (для восстановления отзывов)');
      console.log('   - node check-and-fix-images.js (для проверки изображений)');
      
      db.close();
      process.exit(0);
    });
  }, 1000);
});
