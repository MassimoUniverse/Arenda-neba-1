const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./database.db');

console.log('🔍 Проверка изображений в базе данных...\n');

// Сначала проверяем, существует ли таблица services
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='services'", [], (err, row) => {
  if (err) {
    console.error('❌ Ошибка при проверке таблицы services:', err.message);
    db.close();
    process.exit(1);
  }

  if (!row) {
    console.log('⚠️  Таблица services не найдена в базе данных!');
    console.log('💡 Запустите сначала: node init-database-safe.js');
    db.close();
    process.exit(1);
  }

  console.log('✅ Таблица services найдена\n');

  // Проверяем популярные карточки
  db.all('SELECT id, title, image_url, images, is_popular, active FROM services WHERE is_popular = 1', [], (err, popularServices) => {
    if (err) {
      console.error('❌ Ошибка при получении популярных карточек:', err.message);
      db.close();
      process.exit(1);
    }

  console.log(`📸 Найдено ${popularServices.length} популярных карточек\n`);

  let fixed = 0;
  let errors = 0;

  popularServices.forEach((service, index) => {
    console.log(`\n${index + 1}. ${service.title || 'Без названия'} (ID: ${service.id})`);
    console.log(`   image_url: ${service.image_url || '(НЕТ)'}`);
    console.log(`   images: ${service.images || '(НЕТ)'}`);
    console.log(`   Активна: ${service.active === 1 ? 'Да' : 'Нет'}`);

    // Проверяем, существует ли файл
    if (service.image_url) {
      let imagePath = service.image_url;
      
      // Убираем localhost и домен
      if (imagePath.startsWith('http://localhost:3000/')) {
        imagePath = imagePath.replace('http://localhost:3000', '');
      }
      if (imagePath.startsWith('https://') || imagePath.startsWith('http://')) {
        try {
          const urlObj = new URL(imagePath);
          imagePath = urlObj.pathname;
        } catch (e) {
          // Не удалось распарсить URL
        }
      }

      // Проверяем существование файла с разными расширениями
      const imageDir = path.dirname(imagePath);
      const imageBase = path.basename(imagePath, path.extname(imagePath));
      const extensions = ['.webp', '.jpg', '.png', '.jpeg'];
      
      let foundFile = null;
      let foundPath = null;
      
      // Сначала проверяем оригинальный путь
      const fullPath = path.join(__dirname, 'public', imagePath.startsWith('/') ? imagePath.substring(1) : imagePath);
      if (fs.existsSync(fullPath)) {
        foundFile = imagePath;
        foundPath = fullPath;
      } else {
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
      }

      if (foundFile && foundPath) {
        if (foundFile !== service.image_url) {
          console.log(`   ⚠️  Файл найден, но путь отличается`);
          console.log(`      Текущий: ${service.image_url}`);
          console.log(`      Найден: ${foundFile}`);
          // Обновляем путь в базе
          db.run('UPDATE services SET image_url = ? WHERE id = ?', [foundFile, service.id], (err) => {
            if (err) {
              console.error(`   ❌ Ошибка при обновлении: ${err.message}`);
              errors++;
            } else {
              console.log(`   ✅ Исправлен путь: ${foundFile}`);
              fixed++;
            }
          });
        } else {
          console.log(`   ✅ Файл существует: ${foundPath}`);
        }
      } else {
        console.log(`   ❌ Файл не найден: ${imagePath}`);
        console.log(`      Проверено: ${fullPath}`);
        // Показываем, что пробовали
        extensions.forEach(ext => {
          const testPath = path.join(__dirname, 'public', imageDir.startsWith('/') ? imageDir.substring(1) : imageDir, imageBase + ext);
          if (!fs.existsSync(testPath)) {
            console.log(`      Проверено: ${testPath} (не найден)`);
          }
        });
      }
    } else {
      console.log(`   ⚠️  Нет image_url`);
    }
  });

  // Ждем завершения всех обновлений
  setTimeout(() => {
    console.log(`\n✅ Исправлено: ${fixed} изображений`);
    if (errors > 0) {
      console.log(`❌ Ошибок: ${errors}`);
    }

    // Проверяем все услуги
    db.all('SELECT id, title, image_url FROM services WHERE active = 1', [], (err, allServices) => {
      if (err) {
        console.error('❌ Ошибка при получении всех услуг:', err.message);
      } else {
        console.log(`\n📊 Всего активных услуг: ${allServices.length}`);
        const withImages = allServices.filter(s => s.image_url).length;
        console.log(`📸 С изображениями: ${withImages}`);
        console.log(`❌ Без изображений: ${allServices.length - withImages}`);
      }

      db.close();
      console.log('\n💾 Проверка завершена');
      process.exit(0);
    });
  }, 2000);
  });
});
