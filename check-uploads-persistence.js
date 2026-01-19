// Скрипт для проверки сохранности загруженных изображений
// Использование: node check-uploads-persistence.js

const fs = require('fs');
const path = require('path');

// Проверяем наличие sqlite3
let sqlite3;
let db;
try {
  sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database('./database.db');
} catch (err) {
  console.error('⚠️  Модуль sqlite3 не найден. Проверка базы данных будет пропущена.');
  console.error('   Решение: npm install sqlite3 --build-from-source');
  console.error('   Или запустите: ./install-sqlite3.sh');
  console.log('');
  db = null;
}

console.log('🔍 ПРОВЕРКА СОХРАННОСТИ ЗАГРУЖЕННЫХ ИЗОБРАЖЕНИЙ');
console.log('================================================');
console.log('');

// 1. Проверка папки uploads
console.log('1️⃣  ПРОВЕРКА ПАПКИ UPLOADS');
console.log('--------------------------');
const uploadsDir = path.join(__dirname, 'uploads');

if (fs.existsSync(uploadsDir)) {
  console.log('✅ Папка uploads существует');
  
  const files = fs.readdirSync(uploadsDir, { withFileTypes: true });
  const imageFiles = files.filter(f => f.isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name));
  
  console.log(`   Всего файлов: ${files.length}`);
  console.log(`   Изображений: ${imageFiles.length}`);
  
  if (imageFiles.length > 0) {
    console.log('\n   Последние 10 загруженных файлов:');
    imageFiles
      .map(f => {
        const filePath = path.join(uploadsDir, f.name);
        const stats = fs.statSync(filePath);
        return {
          name: f.name,
          size: stats.size,
          mtime: stats.mtime
        };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 10)
      .forEach((file, idx) => {
        const sizeKB = (file.size / 1024).toFixed(2);
        const date = file.mtime.toISOString().split('T')[0];
        const time = file.mtime.toTimeString().split(' ')[0];
        console.log(`   ${idx + 1}. ${file.name} (${sizeKB} KB, ${date} ${time})`);
      });
  } else {
    console.log('   ⚠️  Папка uploads пуста!');
  }
} else {
  console.log('❌ Папка uploads не существует!');
  console.log('   Создаем папку...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Папка uploads создана');
}

console.log('');

// 2. Проверка image_url в базе данных
console.log('2️⃣  ПРОВЕРКА IMAGE_URL В БАЗЕ ДАННЫХ');
console.log('------------------------------------');

if (!db) {
  console.log('⚠️  База данных недоступна (sqlite3 не установлен)');
  console.log('   Пропускаем проверку базы данных.');
  console.log('');
  console.log('✅ Проверка завершена (только файлы)');
  process.exit(0);
}

db.all('SELECT id, title, image_url, updated_at FROM services WHERE image_url IS NOT NULL AND image_url != "" ORDER BY updated_at DESC LIMIT 20', [], (err, rows) => {
  if (err) {
    console.error('❌ Ошибка при чтении базы данных:', err);
    db.close();
    return;
  }
  
  console.log(`   Найдено услуг с image_url: ${rows.length}`);
  
  if (rows.length > 0) {
    console.log('\n   Последние 10 услуг с изображениями:');
    rows.forEach((row, idx) => {
      const imageUrl = row.image_url || '(пусто)';
      const updatedAt = row.updated_at || '(нет даты)';
      const isUploads = imageUrl.includes('/uploads/');
      const exists = isUploads ? fs.existsSync(path.join(__dirname, imageUrl.replace(/^\//, ''))) : false;
      
      const status = isUploads 
        ? (exists ? '✅' : '❌ ФАЙЛ НЕ НАЙДЕН!')
        : '📁 (старый путь)';
      
      console.log(`   ${idx + 1}. ID=${row.id}, "${row.title}"`);
      console.log(`      image_url: ${imageUrl}`);
      console.log(`      updated_at: ${updatedAt}`);
      console.log(`      Статус: ${status}`);
      console.log('');
    });
    
    // Проверка несоответствий
    console.log('3️⃣  ПРОВЕРКА НЕСООТВЕТСТВИЙ');
    console.log('----------------------------');
    
    let missingFiles = 0;
    let oldPaths = 0;
    let correctFiles = 0;
    
    rows.forEach(row => {
      const imageUrl = row.image_url;
      if (imageUrl.includes('/uploads/')) {
        const filePath = path.join(__dirname, imageUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          correctFiles++;
        } else {
          missingFiles++;
          console.log(`   ❌ Файл не найден: ${imageUrl}`);
        }
      } else {
        oldPaths++;
      }
    });
    
    console.log(`\n   Статистика:`);
    console.log(`   ✅ Корректные файлы из /uploads/: ${correctFiles}`);
    console.log(`   ❌ Отсутствующие файлы из /uploads/: ${missingFiles}`);
    console.log(`   📁 Старые пути (/images/): ${oldPaths}`);
    
    if (missingFiles > 0) {
      console.log('\n   ⚠️  ВНИМАНИЕ: Найдены записи в базе данных, указывающие на несуществующие файлы!');
      console.log('   Это может означать, что файлы были удалены или не были сохранены.');
    }
  } else {
    console.log('   ⚠️  В базе данных нет услуг с image_url!');
  }
  
  console.log('');
  
  // 3. Проверка популярных карточек
  console.log('4️⃣  ПРОВЕРКА ПОПУЛЯРНЫХ КАРТОЧЕК');
  console.log('--------------------------------');
  
  db.all('SELECT id, title, image_url, is_popular, updated_at FROM services WHERE is_popular = 1 ORDER BY popular_order', [], (err, popularRows) => {
    if (err) {
      console.error('❌ Ошибка при чтении популярных карточек:', err);
      db.close();
      return;
    }
    
    console.log(`   Найдено популярных карточек: ${popularRows.length}`);
    
    if (popularRows.length > 0) {
      popularRows.forEach((row, idx) => {
        const imageUrl = row.image_url || '(НЕТ ИЗОБРАЖЕНИЯ!)';
        const isUploads = imageUrl.includes('/uploads/');
        const exists = isUploads ? fs.existsSync(path.join(__dirname, imageUrl.replace(/^\//, ''))) : false;
        
        const status = !row.image_url 
          ? '❌ НЕТ IMAGE_URL!'
          : isUploads 
            ? (exists ? '✅' : '❌ ФАЙЛ НЕ НАЙДЕН!')
            : '📁 (старый путь)';
        
        console.log(`   ${idx + 1}. "${row.title}"`);
        console.log(`      image_url: ${imageUrl}`);
        console.log(`      Статус: ${status}`);
        console.log('');
      });
    }
    
    db.close();
    console.log('✅ Проверка завершена');
  });
});
