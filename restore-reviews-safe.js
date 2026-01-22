const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

// Отзывы для восстановления
const reviews = [
  {
    client_name: 'Алексей',
    company: 'рекламное агентство',
    rating: 5,
    text: 'Регулярно заказываем автовышку для обслуживания наружной рекламы. Всегда приезжают вовремя, техника в хорошем состоянии, операторы работают аккуратно.',
    date: '2024-12-01',
    active: 1
  },
  {
    client_name: 'Ирина',
    company: 'строительная компания',
    rating: 5,
    text: 'Нужна была автовышка 25 м для монтажа фасадных панелей. Всё сделали чётко, помогли подобрать нужную технику под объект.',
    date: '2024-12-05',
    active: 1
  },
  {
    client_name: 'Сергей',
    company: 'управляющая компания',
    rating: 5,
    text: 'Заказывали автовышку для обрезки деревьев во дворе. Приехали быстро, отработали без нареканий, помогли с оформлением перекрытия участка.',
    date: '2024-12-10',
    active: 1
  },
  {
    client_name: 'Александр Иванов',
    company: 'ООО "СтройМастер"',
    rating: 5,
    text: 'Отличная компания! Техника в идеальном состоянии, операторы профессионалы своего дела. Работали с ними на нескольких объектах - всегда качественно и в срок.',
    date: '2024-10-15',
    active: 1
  },
  {
    client_name: 'Мария Петрова',
    company: 'Частное лицо',
    rating: 5,
    text: 'Спасибо за оперативность! Нужно было срочно провести работы на высоте. Автовышку подали через 2 часа после звонка. Всё прошло отлично!',
    date: '2024-10-20',
    active: 1
  },
  {
    client_name: 'Дмитрий Соколов',
    company: 'ЗАО "ГорСтрой"',
    rating: 5,
    text: 'Сотрудничаем уже 3 года. Надежная компания с адекватными ценами. Рекомендую!',
    date: '2024-11-01',
    active: 1
  },
  {
    client_name: 'Елена Козлова',
    company: 'ООО "ФасадСтрой"',
    rating: 5,
    text: 'Работали с автовышкой 18 метров на фасаде. Машинист очень опытный, техника в отличном состоянии. Рекомендую!',
    date: '2024-11-15',
    active: 1
  },
  {
    client_name: 'Владимир Смирнов',
    company: 'ИП Смирнов',
    rating: 5,
    text: 'Заказывал автовышку для установки кондиционеров. Всё сделали быстро и качественно. Цены адекватные.',
    date: '2024-11-20',
    active: 1
  },
  {
    client_name: 'Ольга Новикова',
    company: 'Управляющая компания "Дом"',
    rating: 5,
    text: 'Регулярно пользуемся услугами для обслуживания фасада. Всегда довольны результатом. Операторы вежливые и профессиональные.',
    date: '2024-12-01',
    active: 1
  },
  {
    client_name: 'Андрей Волков',
    company: 'ООО "РекламаПлюс"',
    rating: 5,
    text: 'Отличный сервис! Автовышка приехала точно в назначенное время. Работа выполнена качественно. Обязательно обратимся ещё.',
    date: '2024-12-08',
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
    // Проверяем, сколько отзывов уже есть
    db.get('SELECT COUNT(*) as count FROM reviews', [], (err, row) => {
      if (err) {
        console.error('❌ Ошибка при проверке отзывов:', err.message);
        db.close();
        process.exit(1);
      }

      const existingCount = row.count;
      console.log(`📊 Текущее количество отзывов в базе: ${existingCount}\n`);

      if (existingCount > 0) {
        console.log('⚠️  В базе уже есть отзывы. Добавляем новые...\n');
      }

      // Добавляем все отзывы
      const stmt = db.prepare(`
        INSERT INTO reviews 
        (client_name, company, rating, text, review_text, date, active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let added = 0;
      let skipped = 0;
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
              if (err.message.includes('UNIQUE constraint')) {
                skipped++;
                console.log(`⏭️  ${index + 1}. ${review.client_name} - уже существует, пропущен`);
              } else {
                errors++;
                console.error(`❌ Ошибка при добавлении отзыва "${review.client_name}":`, err.message);
              }
            } else {
              added++;
              console.log(`✅ ${index + 1}. ${review.client_name} - добавлен`);
            }

            // Когда все отзывы обработаны
            if (added + skipped + errors === reviews.length) {
              stmt.finalize(() => {
                console.log(`\n✅ Всего добавлено новых: ${added}`);
                console.log(`⏭️  Пропущено (уже существуют): ${skipped}`);
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
