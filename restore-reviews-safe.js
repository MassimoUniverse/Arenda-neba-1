const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

// Отзывы для восстановления (только 6 основных отзывов)
const reviews = [
  {
    client_name: 'Широбоков В. К.',
    company: '',
    rating: 5,
    text: 'Вчера заказывали небольшую автовышку 15 метров для установки кондиционеров. Проехала в очень узкую арку, места для работы катастрофически не хватало, но благодаря небольшим размерам машины и опыту оператора, работа была выполнена качественно и быстро. Работой оператора на 100% довольны. Обратимся еще раз.',
    date: '2024-12-15',
    active: 1
  },
  {
    client_name: 'Дегтярев Олег',
    company: '',
    rating: 5,
    text: 'Хотим выразить благодарность компании "СК-Эксперт". Использовали услугу автовышки с краном-балкой для установки опор светофоров. Удобно, не нужно заказывать манипулятор. Спасибо!',
    date: '2024-12-10',
    active: 1
  },
  {
    client_name: 'Логунов С.',
    company: '',
    rating: 5,
    text: 'Оператор Дмитрий, который работает на автовышке, настоящий профессионал своего дела. Понял задачу с полуслова и выполнил. Так держать.',
    date: '2024-12-08',
    active: 1
  },
  {
    client_name: 'Трусов Д.Г.',
    company: '',
    rating: 5,
    text: 'Брал в аренду автокран для строительства загородного дома. Претензий нет. Сделали все в срок.',
    date: '2024-11-25',
    active: 1
  },
  {
    client_name: 'Валерий',
    company: '',
    rating: 5,
    text: 'Делал предложение своей девушке, которая живет на 11 этаже с помощью автовышки 50 м. Все прошло круто.',
    date: '2024-11-20',
    active: 1
  },
  {
    client_name: 'Дружинина Татьяна',
    company: '',
    rating: 5,
    text: 'Требовался монтаж металлоконструкций. Операторы по телефону грамотно проконсультировали, ответили на все вопросы, подобрали и оперативно предоставили необходимую спецтехнику автокран 25 т. и автовышку 50 м. для выполнения конкретных задач. Еще и дополнительную скидку предоставили. Надеемся на сотрудничество и в будущем.',
    date: '2024-11-15',
    active: 1
  }
];

db.serialize(() => {
  console.log('🔄 Начинаем восстановление отзывов...\n');

  // Сначала проверяем, существует ли таблица reviews
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='reviews'", [], (err, row) => {
    if (err) {
      console.error('❌ Ошибка при проверке таблицы:', err.message);
      db.close();
      process.exit(1);
    }

    if (!row) {
      console.log('⚠️  Таблица reviews не найдена. Создаём таблицу...\n');
      
      // Создаём таблицу reviews
      db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT NOT NULL,
        company TEXT,
        rating INTEGER DEFAULT 5,
        text TEXT,
        review_text TEXT,
        image_url TEXT,
        date TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('❌ Ошибка при создании таблицы:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('✅ Таблица reviews создана\n');
        addReviews();
      });
    } else {
      console.log('✅ Таблица reviews найдена\n');
      addReviews();
    }
  });

  function addReviews() {
    // Удаляем все старые отзывы перед добавлением новых
    console.log('🗑️  Удаляем все старые отзывы...\n');
    db.run('DELETE FROM reviews', (err) => {
      if (err) {
        console.error('❌ Ошибка при удалении старых отзывов:', err.message);
        db.close();
        process.exit(1);
      }
      console.log('✅ Старые отзывы удалены\n');

      // Добавляем все отзывы
      const stmt = db.prepare(`
        INSERT INTO reviews 
        (client_name, company, rating, text, review_text, date, active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let added = 0;
      let errors = 0;

      reviews.forEach((review, index) => {
        stmt.run(
          review.client_name,
          review.company,
          review.rating,
          review.text,
          review.text, // review_text = text
          review.date,
          review.active,
          function(err) {
            if (err) {
              errors++;
              console.error(`❌ Ошибка при добавлении отзыва "${review.client_name}":`, err.message);
            } else {
              added++;
              console.log(`✅ ${index + 1}. ${review.client_name} - добавлен`);
            }

            // Когда все отзывы обработаны
            if (added + errors === reviews.length) {
              stmt.finalize(() => {
                console.log(`\n✅ Всего добавлено: ${added} из ${reviews.length} отзывов`);
                if (errors > 0) {
                  console.log(`❌ Ошибок: ${errors}`);
                }

                // Проверяем итоговое количество
                db.get('SELECT COUNT(*) as count FROM reviews WHERE active = 1', [], (err, finalRow) => {
                  if (err) {
                    console.error('❌ Ошибка при проверке:', err.message);
                  } else {
                    console.log(`📊 Активных отзывов в базе: ${finalRow.count}`);
                  }

                  db.close();
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
  }
});
