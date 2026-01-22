const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./database.db');

console.log('🔍 Проверка изображений в базе данных...\n');

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

      // Проверяем существование файла
      const fullPath = path.join(__dirname, 'public', imagePath.startsWith('/') ? imagePath.substring(1) : imagePath);
      const uploadsPath = path.join(__dirname, 'uploads', path.basename(imagePath));

      if (fs.existsSync(fullPath)) {
        console.log(`   ✅ Файл существует: ${fullPath}`);
      } else if (fs.existsSync(uploadsPath)) {
        console.log(`   ⚠️  Файл в uploads: ${uploadsPath}`);
        // Исправляем путь
        const correctPath = '/uploads/' + path.basename(imagePath);
        db.run('UPDATE services SET image_url = ? WHERE id = ?', [correctPath, service.id], (err) => {
          if (err) {
            console.error(`   ❌ Ошибка при обновлении: ${err.message}`);
            errors++;
          } else {
            console.log(`   ✅ Исправлен путь: ${correctPath}`);
            fixed++;
          }
        });
      } else {
        console.log(`   ❌ Файл не найден: ${imagePath}`);
        console.log(`      Проверено: ${fullPath}`);
        console.log(`      Проверено: ${uploadsPath}`);
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
