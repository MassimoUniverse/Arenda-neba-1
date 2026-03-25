const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

const specs = 'Большая корзина СУПЕРДЕК: 2х4 м, Высота подъема: 16 м, Вылет максимальный: 11 м, Грузоподъемность корзины: 1000 кг, Поворот корзины: 360\u00b0';
const cardBullets = JSON.stringify([
  'Грузоподъёмность корзины: 1000 кг',
  'Размеры корзины (платформы): 2х4 м'
]);

db.run(
  `UPDATE services SET
    height_lift = ?,
    max_reach = ?,
    max_capacity = ?,
    lift_type = ?,
    width = ?,
    basket_rotation_angle = ?,
    specifications = ?,
    card_bullets = ?
  WHERE id = 20`,
  ['16 м', '11 м', '1000 кг', 'Большая корзина СУПЕРДЕК', '2х4 м', '360\u00b0', specs, cardBullets],
  function (err) {
    if (err) {
      console.error('ERROR:', err.message);
      process.exit(1);
    }
    console.log('Updated rows:', this.changes);
    db.close();
  }
);
