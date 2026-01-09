const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db');

const newPassword = process.env.ADMIN_PASSWORD || 'admin123';

console.log('🔄 Сбрасываем пароль админа...\n');

bcrypt.hash(newPassword, 10, (err, hash) => {
  if (err) {
    console.error('❌ Ошибка при хешировании пароля:', err);
    db.close();
    return;
  }
  
  // Обновляем пароль админа
  db.run('UPDATE admins SET password_hash = ? WHERE username = ?', [hash, 'admin'], function(err) {
    if (err) {
      console.error('❌ Ошибка при обновлении пароля:', err);
      db.close();
      return;
    }
    
    if (this.changes === 0) {
      // Если админа нет, создаем
      db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash], function(err) {
        if (err) {
          console.error('❌ Ошибка при создании админа:', err);
        } else {
          console.log('✅ Админ создан!');
        }
        db.close();
      });
    } else {
      console.log('✅ Пароль админа сброшен!');
      console.log('\n📝 Новые учетные данные:');
      console.log('   Username: admin');
      console.log(`   Password: ${newPassword}`);
      db.close();
    }
  });
});

