const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🔄 Полное восстановление данных...\n');

// Сначала проверяем, существует ли таблица services
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='services'", [], (err, row) => {
  if (err) {
    console.error('❌ Ошибка при проверке таблицы services:', err.message);
    db.close();
    process.exit(1);
  }

  if (!row) {
    console.log('⚠️  Таблица services не найдена!');
    console.log('💡 Запустите сначала: node init-database-safe.js');
    db.close();
    process.exit(1);
  }

  console.log('✅ Таблица services найдена\n');
  console.log('📊 Проверяем текущее состояние базы...\n');

  // Проверяем количество услуг
  db.get('SELECT COUNT(*) as count FROM services WHERE active = 1', [], (err, row) => {
    if (err) {
      console.error('❌ Ошибка при проверке услуг:', err.message);
      db.close();
      process.exit(1);
    }

    const servicesCount = row.count;
    console.log(`📦 Активных услуг: ${servicesCount}`);

    if (servicesCount === 0) {
      console.log('\n⚠️  В базе нет активных услуг!');
      console.log('💡 Запустите: node restore-se2rvices.js');
      console.log('   (или используйте правильное имя файла, если оно отличается)');
    } else {
      console.log(`✅ Найдено ${servicesCount} активных услуг`);
    }

    // Проверяем популярные карточки
    db.get('SELECT COUNT(*) as count FROM services WHERE is_popular = 1 AND active = 1', [], (err, row) => {
      if (err) {
        console.error('❌ Ошибка при проверке популярных карточек:', err.message);
        db.close();
        process.exit(1);
      }

      const popularCount = row.count;
      console.log(`⭐ Популярных карточек: ${popularCount}`);

      if (popularCount === 0 && servicesCount > 0) {
        console.log('\n⚠️  Нет популярных карточек!');
        console.log('💡 Запустите: node update-popular-cards.js');
      } else if (popularCount > 0) {
        console.log(`✅ Найдено ${popularCount} популярных карточек`);
      }

      // Проверяем отзывы
      db.get('SELECT COUNT(*) as count FROM reviews WHERE active = 1', [], (err, row) => {
        if (err) {
          console.error('❌ Ошибка при проверке отзывов:', err.message);
          db.close();
          process.exit(1);
        }

        const reviewsCount = row.count;
        console.log(`💬 Активных отзывов: ${reviewsCount}`);

        if (reviewsCount === 0) {
          console.log('\n⚠️  В базе нет активных отзывов!');
          console.log('💡 Запустите: node restore-reviews-safe.js');
        } else {
          console.log(`✅ Найдено ${reviewsCount} отзывов`);
        }

        console.log('\n📋 Итоговая статистика:');
        console.log(`   📦 Услуг: ${servicesCount}`);
        console.log(`   ⭐ Популярных карточек: ${popularCount}`);
        console.log(`   💬 Отзывов: ${reviewsCount}`);

        if (servicesCount === 0) {
          console.log('\n🔧 Рекомендуемый порядок действий:');
          console.log('   1. node restore-se2rvices.js  (восстановить услуги)');
          console.log('   2. node update-popular-cards.js  (установить популярные карточки)');
          console.log('   3. node restore-reviews-safe.js  (восстановить отзывы)');
          console.log('   4. node check-and-fix-images.js  (проверить изображения)');
          console.log('   5. pm2 restart arenda-neba  (перезапустить приложение)');
        } else if (popularCount === 0) {
          console.log('\n🔧 Рекомендуемый порядок действий:');
          console.log('   1. node update-popular-cards.js  (установить популярные карточки)');
          console.log('   2. node restore-reviews-safe.js  (восстановить отзывы, если нужно)');
          console.log('   3. node check-and-fix-images.js  (проверить изображения)');
          console.log('   4. pm2 restart arenda-neba  (перезапустить приложение)');
        } else if (reviewsCount === 0) {
          console.log('\n🔧 Рекомендуемый порядок действий:');
          console.log('   1. node restore-reviews-safe.js  (восстановить отзывы)');
          console.log('   2. node check-and-fix-images.js  (проверить изображения)');
          console.log('   3. pm2 restart arenda-neba  (перезапустить приложение)');
        } else {
          console.log('\n✅ Все данные на месте!');
          console.log('💡 Если есть проблемы с изображениями, запустите:');
          console.log('   node check-and-fix-images.js');
        }

        db.close();
        process.exit(0);
      });
    });
  });
});
