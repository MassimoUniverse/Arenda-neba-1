const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Список возможных путей к бекапам
const backupPaths = [
  './database.db.backup',
  './backups/database.db',
  '../database.db.backup',
  '/opt/arenda-neba/database.db.backup',
  '/opt/arenda-neba/backups/database.db'
];

console.log('🔍 Поиск бекапов базы данных...\n');

let backupFound = null;

// Ищем бекап
for (const backupPath of backupPaths) {
  if (fs.existsSync(backupPath)) {
    console.log(`✅ Найден бекап: ${backupPath}`);
    backupFound = backupPath;
    break;
  }
}

if (!backupFound) {
  console.log('❌ Бекап не найден. Проверяем текущую базу...\n');
  backupFound = './database.db';
}

console.log(`📂 Используем: ${backupFound}\n`);

// Открываем бекап для чтения отзывов
const backupDb = new sqlite3.Database(backupFound, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Ошибка при открытии бекапа:', err.message);
    process.exit(1);
  }
});

// Открываем текущую базу для записи
const currentDb = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('❌ Ошибка при открытии текущей базы:', err.message);
    backupDb.close();
    process.exit(1);
  }
});

console.log('📖 Читаем отзывы из бекапа...\n');

// Читаем все отзывы из бекапа
backupDb.all('SELECT * FROM reviews ORDER BY created_at DESC', [], (err, reviews) => {
  if (err) {
    console.error('❌ Ошибка при чтении отзывов из бекапа:', err.message);
    backupDb.close();
    currentDb.close();
    process.exit(1);
  }

  if (!reviews || reviews.length === 0) {
    console.log('⚠️  В бекапе нет отзывов. Проверяем текущую базу...\n');
    
    // Проверяем текущую базу
    currentDb.all('SELECT * FROM reviews WHERE active = 1', [], (err, currentReviews) => {
      if (err) {
        console.error('❌ Ошибка при чтении текущих отзывов:', err.message);
      } else {
        console.log(`📊 В текущей базе: ${currentReviews.length} активных отзывов`);
        if (currentReviews.length > 0) {
          console.log('\n📝 Список отзывов:');
          currentReviews.forEach((review, index) => {
            console.log(`   ${index + 1}. ${review.client_name || 'Без имени'} - ${review.company || 'Без компании'}`);
            console.log(`      Текст: ${(review.text || review.review_text || '').substring(0, 50)}...`);
            console.log(`      Активен: ${review.active === 1 ? 'Да' : 'Нет'}`);
          });
        }
      }
      backupDb.close();
      currentDb.close();
      process.exit(0);
    });
    return;
  }

  console.log(`✅ Найдено ${reviews.length} отзывов в бекапе\n`);

  // Показываем список отзывов
  console.log('📝 Список отзывов из бекапа:');
  reviews.forEach((review, index) => {
    console.log(`   ${index + 1}. ${review.client_name || 'Без имени'} - ${review.company || 'Без компании'}`);
    console.log(`      Текст: ${(review.text || review.review_text || '').substring(0, 50)}...`);
    console.log(`      Активен: ${review.active === 1 ? 'Да' : 'Нет'}`);
  });

  console.log('\n🔄 Восстанавливаем отзывы в текущую базу...\n');

  // Удаляем все старые отзывы
  currentDb.run('DELETE FROM reviews', (err) => {
    if (err) {
      console.error('❌ Ошибка при удалении старых отзывов:', err.message);
      backupDb.close();
      currentDb.close();
      process.exit(1);
    }

    console.log('✅ Старые отзывы удалены\n');

    // Вставляем все отзывы из бекапа
    const stmt = currentDb.prepare(`
      INSERT INTO reviews 
      (client_name, company, rating, text, review_text, date, active, created_at, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let added = 0;
    let errors = 0;

    reviews.forEach((review, index) => {
      stmt.run(
        review.client_name || '',
        review.company || '',
        review.rating || 5,
        review.text || review.review_text || '',
        review.review_text || review.text || '',
        review.date || new Date().toISOString().split('T')[0],
        review.active !== undefined ? review.active : 1,
        review.created_at || new Date().toISOString(),
        review.image_url || null,
        function(err) {
          if (err) {
            errors++;
            console.error(`❌ Ошибка при добавлении отзыва ${index + 1}:`, err.message);
          } else {
            added++;
            console.log(`✅ ${index + 1}. ${review.client_name || 'Без имени'} - восстановлен`);
          }

          // Когда все отзывы обработаны
          if (added + errors === reviews.length) {
            stmt.finalize(() => {
              console.log(`\n✅ Всего восстановлено: ${added} отзывов`);
              if (errors > 0) {
                console.log(`❌ Ошибок: ${errors}`);
              }

              // Проверяем результат
              currentDb.all('SELECT COUNT(*) as count FROM reviews WHERE active = 1', [], (err, rows) => {
                if (err) {
                  console.error('❌ Ошибка при проверке:', err.message);
                } else {
                  console.log(`\n📊 Активных отзывов в базе: ${rows[0].count}`);
                }

                backupDb.close();
                currentDb.close();
                console.log('\n💾 База данных сохранена');
                console.log('\n🔄 Перезапустите приложение: pm2 restart arenda-neba');
                process.exit(0);
              });
            });
          }
        }
      );
    });
  });
});
