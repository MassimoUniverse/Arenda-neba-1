const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./database.db');

console.log('🔍 Исправление путей к изображениям в базе данных...\n');

// Получаем все услуги
db.all('SELECT id, title, image_url FROM services WHERE active = 1', [], (err, services) => {
  if (err) {
    console.error('❌ Ошибка при получении услуг:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`📊 Найдено ${services.length} активных услуг\n`);

  let fixed = 0;
  let errors = 0;
  let notFound = 0;

  services.forEach((service, index) => {
    if (!service.image_url) {
      console.log(`${index + 1}. ${service.title || 'Без названия'} (ID: ${service.id})`);
      console.log(`   ⚠️  Нет image_url`);
      return;
    }

    const imagePath = service.image_url;
    const imageDir = path.dirname(imagePath);
    const imageBase = path.basename(imagePath, path.extname(imagePath));
    const extensions = ['.webp', '.jpg', '.png', '.jpeg'];
    
    let foundFile = null;
    let foundPath = null;
    
    // Проверяем оригинальный путь
    const fullPath = path.join(__dirname, 'public', imagePath.startsWith('/') ? imagePath.substring(1) : imagePath);
    if (fs.existsSync(fullPath)) {
      // Файл существует с текущим путем
      console.log(`${index + 1}. ${service.title || 'Без названия'} (ID: ${service.id})`);
      console.log(`   ✅ Файл существует: ${imagePath}`);
      return;
    }
    
    // Пробуем разные расширения
    for (const ext of extensions) {
      const testPath = path.join(__dirname, 'public', imageDir.startsWith('/') ? imageDir.substring(1) : imageDir, imageBase + ext);
      if (fs.existsSync(testPath)) {
        foundFile = (imageDir.startsWith('/') ? imageDir : '/' + imageDir) + '/' + imageBase + ext;
        foundPath = testPath;
        break;
      }
    }
    
    // Если не нашли в public, проверяем uploads
    if (!foundFile) {
      const uploadsPath = path.join(__dirname, 'uploads', path.basename(imagePath));
      if (fs.existsSync(uploadsPath)) {
        foundFile = '/uploads/' + path.basename(imagePath);
        foundPath = uploadsPath;
      } else {
        // Пробуем разные расширения в uploads
        for (const ext of extensions) {
          const testPath = path.join(__dirname, 'uploads', imageBase + ext);
          if (fs.existsSync(testPath)) {
            foundFile = '/uploads/' + imageBase + ext;
            foundPath = testPath;
            break;
          }
        }
      }
    }

    console.log(`${index + 1}. ${service.title || 'Без названия'} (ID: ${service.id})`);
    console.log(`   Текущий путь: ${imagePath}`);

    if (foundFile && foundPath) {
      console.log(`   ✅ Найден файл: ${foundFile}`);
      // Обновляем путь в базе
      db.run('UPDATE services SET image_url = ? WHERE id = ?', [foundFile, service.id], (err) => {
        if (err) {
          console.error(`   ❌ Ошибка при обновлении: ${err.message}`);
          errors++;
        } else {
          console.log(`   ✅ Обновлен путь: ${foundFile}`);
          fixed++;
        }

        // Когда все услуги обработаны
        if (index === services.length - 1) {
          setTimeout(() => {
            console.log(`\n📊 Итоги:`);
            console.log(`   ✅ Исправлено: ${fixed} путей`);
            console.log(`   ❌ Ошибок: ${errors}`);
            console.log(`   ⚠️  Не найдено: ${notFound}`);

            db.close();
            console.log('\n💾 База данных сохранена');
            console.log('\n🔄 Перезапустите приложение: pm2 restart arenda-neba');
            process.exit(0);
          }, 1000);
        }
      });
    } else {
      console.log(`   ❌ Файл не найден`);
      notFound++;
      
      // Когда все услуги обработаны
      if (index === services.length - 1) {
        setTimeout(() => {
          console.log(`\n📊 Итоги:`);
          console.log(`   ✅ Исправлено: ${fixed} путей`);
          console.log(`   ❌ Ошибок: ${errors}`);
          console.log(`   ⚠️  Не найдено: ${notFound}`);

          db.close();
          console.log('\n💾 База данных сохранена');
          console.log('\n🔄 Перезапустите приложение: pm2 restart arenda-neba');
          process.exit(0);
        }, 1000);
      }
    }
  });

  if (services.length === 0) {
    console.log('⚠️  Нет активных услуг для проверки');
    db.close();
    process.exit(0);
  }
});
