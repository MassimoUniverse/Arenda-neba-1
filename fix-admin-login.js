const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db');

console.log('🔧 Исправление входа в админ-панель...\n');

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

db.serialize(() => {
  // 1. Создаём таблицу admins, если её нет
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Ошибка при создании таблицы admins:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('✅ Таблица admins проверена/создана');
    
    // 2. Проверяем существование админа
    db.get('SELECT * FROM admins WHERE username = ?', [adminUsername], async (err, admin) => {
      if (err) {
        console.error('❌ Ошибка при проверке админа:', err);
        db.close();
        process.exit(1);
      }
      
      // 3. Хешируем пароль
      bcrypt.hash(adminPassword, 10, (err, hash) => {
        if (err) {
          console.error('❌ Ошибка при хешировании пароля:', err);
          db.close();
          process.exit(1);
        }
        
        if (!admin) {
          // Админа нет - создаём
          db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', 
            [adminUsername, hash], function(err) {
            if (err) {
              console.error('❌ Ошибка при создании админа:', err);
              db.close();
              process.exit(1);
            }
            
            console.log('✅ Админ создан успешно!');
            console.log('\n📝 Учетные данные для входа:');
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Password: ${adminPassword}`);
            console.log('\n💡 Теперь вы можете войти в админ-панель с этими данными.');
            db.close();
            process.exit(0);
          });
        } else {
          // Админ есть - сбрасываем пароль
          db.run('UPDATE admins SET password_hash = ? WHERE username = ?', 
            [hash, adminUsername], function(err) {
            if (err) {
              console.error('❌ Ошибка при обновлении пароля:', err);
              db.close();
              process.exit(1);
            }
            
            console.log('✅ Пароль админа сброшен!');
            console.log('\n📝 Учетные данные для входа:');
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Password: ${adminPassword}`);
            console.log('\n💡 Теперь вы можете войти в админ-панель с этими данными.');
            db.close();
            process.exit(0);
          });
        }
      });
    });
  });
});
