const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🔄 Начинаем удаление дубликатов услуг...\n');

db.serialize(() => {
  // Сначала посмотрим, сколько дубликатов есть
  db.all(`
    SELECT title, COUNT(*) as count 
    FROM services 
    GROUP BY title 
    HAVING COUNT(*) > 1
    ORDER BY title
  `, [], (err, duplicates) => {
    if (err) {
      console.error('❌ Ошибка при поиске дубликатов:', err);
      db.close();
      return;
    }

    if (duplicates.length === 0) {
      console.log('✅ Дубликатов не найдено!\n');
      db.close();
      return;
    }

    console.log(`📊 Найдено ${duplicates.length} услуг с дубликатами:\n`);
    duplicates.forEach(dup => {
      console.log(`  - ${dup.title}: ${dup.count} записей`);
    });
    console.log('\n');

    // Для каждой услуги с дубликатами оставляем только одну запись
    // Оставляем запись с наибольшим id (последнюю добавленную)
    const deleteStmt = db.prepare(`
      DELETE FROM services 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM services 
        WHERE title = ?
      ) 
      AND title = ?
    `);

    let deleted = 0;
    let processed = 0;

    duplicates.forEach((dup, index) => {
      deleteStmt.run(dup.title, dup.title, function(err) {
        if (err) {
          console.error(`❌ Ошибка при удалении дубликатов для "${dup.title}":`, err);
        } else {
          deleted += this.changes;
          console.log(`✅ ${index + 1}. "${dup.title}": удалено ${this.changes} дубликатов, оставлена 1 запись`);
        }

        processed++;
        if (processed === duplicates.length) {
          deleteStmt.finalize(() => {
            console.log(`\n✅ Всего удалено: ${deleted} дубликатов`);
            console.log('✅ Удаление дубликатов завершено!\n');

            // Проверяем результат
            db.all(`
              SELECT title, COUNT(*) as count 
              FROM services 
              GROUP BY title 
              HAVING COUNT(*) > 1
            `, [], (err, remaining) => {
              if (err) {
                console.error('❌ Ошибка при проверке:', err);
              } else if (remaining.length === 0) {
                console.log('✅ Проверка: дубликатов больше нет!');
              } else {
                console.log('⚠️  Внимание: остались дубликаты:', remaining);
              }

              db.close((err) => {
                if (err) {
                  console.error('❌ Ошибка при закрытии базы:', err);
                } else {
                  console.log('💾 База данных сохранена');
                  console.log('\n🔄 Перезапустите приложение: pm2 restart arenda-neba');
                }
              });
            });
          });
        }
      });
    });
  });
});

