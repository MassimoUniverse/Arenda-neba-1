const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка проблем с загрузкой файлов...\n');

// 1. Проверяем папку uploads
const uploadsDir = path.join(__dirname, 'uploads');
console.log('📁 Проверка папки uploads:');
console.log(`   Путь: ${uploadsDir}`);

if (!fs.existsSync(uploadsDir)) {
  console.log('   ❌ Папка uploads не существует!');
  console.log('   💡 Создаём папку...');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('   ✅ Папка создана');
  } catch (err) {
    console.error('   ❌ Ошибка при создании папки:', err.message);
    process.exit(1);
  }
} else {
  console.log('   ✅ Папка существует');
}

// 2. Проверяем права доступа
try {
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log('   ✅ Папка доступна для записи');
} catch (err) {
  console.error('   ❌ Папка НЕ доступна для записи!');
  console.error('   💡 Исправьте права: chmod 755 uploads');
  process.exit(1);
}

// 3. Проверяем размер диска
try {
  const stats = fs.statSync(uploadsDir);
  console.log('   ✅ Права доступа OK');
} catch (err) {
  console.error('   ❌ Ошибка при проверке прав:', err.message);
}

// 4. Проверяем наличие sharp
console.log('\n📦 Проверка зависимостей:');
try {
  require('sharp');
  console.log('   ✅ sharp установлен');
} catch (err) {
  console.error('   ❌ sharp НЕ установлен!');
  console.error('   💡 Установите: npm install sharp');
  process.exit(1);
}

// 5. Проверяем multer
try {
  require('multer');
  console.log('   ✅ multer установлен');
} catch (err) {
  console.error('   ❌ multer НЕ установлен!');
  console.error('   💡 Установите: npm install multer');
  process.exit(1);
}

// 6. Проверяем таблицу admins (для аутентификации)
console.log('\n🔐 Проверка аутентификации:');
const db = new sqlite3.Database('./database.db');

db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'", (err, row) => {
  if (err) {
    console.error('   ❌ Ошибка при проверке таблицы admins:', err.message);
    db.close();
    process.exit(1);
  }
  
  if (!row) {
    console.error('   ❌ Таблица admins не существует!');
    console.error('   💡 Запустите: node init-database-safe.js');
    db.close();
    process.exit(1);
  }
  
  console.log('   ✅ Таблица admins существует');
  
  // Проверяем наличие админа
  db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
    if (err) {
      console.error('   ❌ Ошибка при проверке админов:', err.message);
      db.close();
      process.exit(1);
    }
    
    if (row.count === 0) {
      console.error('   ⚠️  Нет администраторов в базе!');
      console.error('   💡 Запустите: node fix-admin-login.js');
    } else {
      console.log(`   ✅ Найдено администраторов: ${row.count}`);
    }
    
    db.close();
    
    console.log('\n✅ Проверка завершена');
    console.log('\n💡 Если все проверки пройдены, но загрузка не работает:');
    console.log('   1. Проверьте логи сервера: pm2 logs arenda-neba --lines 50');
    console.log('   2. Проверьте консоль браузера (F12) при загрузке файла');
    console.log('   3. Убедитесь, что файл не превышает 30MB');
    console.log('   4. Убедитесь, что формат файла: JPG, PNG, GIF или WebP');
  });
});
