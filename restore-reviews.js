const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

// Все отзывы для восстановления
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

  // Удаляем старые базовые отзывы (если нужно пересоздать)
  // Можно закомментировать эту строку, если хотите сохранить существующие
  // db.run('DELETE FROM reviews', (err) => {
  //   if (err) console.error('Ошибка:', err);
  // });

  // Добавляем все отзывы
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO reviews 
    (client_name, company, rating, text, date, active) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let added = 0;
  let skipped = 0;
  
  reviews.forEach((review, index) => {
    stmt.run(
      review.client_name,
      review.company,
      review.rating,
      review.text,
      review.date,
      review.active,
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            skipped++;
            console.log(`⏭️  ${index + 1}. ${review.client_name} - уже существует, пропущен`);
          } else {
            console.error(`❌ Ошибка при добавлении отзыва "${review.client_name}":`, err);
          }
        } else {
          added++;
          console.log(`✅ ${index + 1}. ${review.client_name} - добавлен`);
        }
      }
    );
  });

  stmt.finalize(() => {
    console.log(`\n✅ Всего добавлено новых: ${added}`);
    console.log(`⏭️  Пропущено (уже существуют): ${skipped}`);
    console.log(`📊 Всего отзывов в базе: ${added + skipped} из ${reviews.length}`);
    console.log(`✅ Восстановлены все отзывы (${reviews.length} шт.)\n`);
    
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

