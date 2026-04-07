/**
 * Обновление цен в БД по ТЗ:
 * Полсмены только: 13,16,18,21,25 м — остальные только полная смена в строке price.
 */
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const withHalf = (half, shift) =>
  `от ${Number(half).toLocaleString('ru-RU')} ₽/полсмена, от ${Number(shift).toLocaleString('ru-RU')} ₽/смена`;

const shiftOnly = (shift) => `от ${Number(shift).toLocaleString('ru-RU')} ₽/смена`;

const updates = [
  { title: 'Автовышка 13 метров', price: withHalf(15000, 18000) },
  { title: 'Автовышка 15 метров', price: shiftOnly(20000) },
  { title: 'Автовышка 16 метров', price: withHalf(15000, 20000) },
  { title: 'Автовышка 18 метров', price: withHalf(18000, 22000) },
  { title: 'Автовышка 21 метр', price: withHalf(20000, 24000) },
  { title: 'Автовышка 25 метров', price: withHalf(20000, 23000) },
  { title: 'Автовышка 29 метров', price: shiftOnly(26000) },
  { title: 'Автовышка вездеход 30 метров', price: shiftOnly(30000) },
  { title: 'Автовышка 45 метров', price: shiftOnly(36000) }
  // самоходная и погрузчик — не трогаем цены здесь (пользователь не указал)
];

db.serialize(() => {
  let n = updates.length;
  updates.forEach((u) => {
    db.run('UPDATE services SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE title = ?', [u.price, u.title], function (err) {
      if (err) console.error(u.title, err.message);
      else if (this.changes) console.log('OK', u.title, '->', u.price);
      else console.warn('not found:', u.title);
      if (--n === 0) db.close();
    });
  });
});
