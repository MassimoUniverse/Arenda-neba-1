const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db');

console.log('🔍 Проверяем админа в базе данных...\n');

db.get('SELECT * FROM admins WHERE username = ?', ['admin'], async (err, admin) => {
  if (err) {
    console.error('❌ Ошибка при проверке:', err);
    db.close();
    return;
  }

  if (!admin) {
    console.log('⚠️  Админ не найден! Создаем нового...\n');
    
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    bcrypt.hash(adminPassword, 10, (err, hash) => {
      if (err) {
        console.error('❌ Ошибка при хешировании пароля:', err);
        db.close();
        return;
      }
      
      db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash], function(err) {
        if (err) {
          console.error('❌ Ошибка при создании админа:', err);
        } else {
          console.log('✅ Админ создан успешно!');
          console.log('\n📝 Учетные данные:');
          console.log('   Username: admin');
          console.log('   Password: admin123');
        }
        db.close();
      });
    });
  } else {
    console.log('✅ Админ найден в базе данных');
    console.log(`   Username: ${admin.username}`);
    console.log(`   ID: ${admin.id}`);
    console.log('\n💡 Если не можете войти, попробуйте:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
    // Проверяем пароль
    const testPassword = 'admin123';
    bcrypt.compare(testPassword, admin.password_hash, (err, result) => {
      if (err) {
        console.error('❌ Ошибка при проверке пароля:', err);
      } else if (result) {
        console.log('\n✅ Пароль "admin123" правильный!');
      } else {
        console.log('\n⚠️  Пароль "admin123" не подходит. Возможно пароль был изменен.');
        console.log('   Попробуйте сбросить пароль (см. reset-admin.js)');
      }
      db.close();
    });
  }
});

