// Script to update existing services with popular card data
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Default popular cards configuration
const popularCards = [
  {
    url: '/equipment/avtovyshka-13m.html',
    order: 1,
    bullets: [
      'Грузоподъёмность корзины: 400 кг',
      'Размеры корзины (платформы): 2х4 м',
      'Высота подъема: 13 м',
      'Вылет максимальный: 8 м'
    ]
  },
  {
    url: '/equipment/avtovyshka-18m.html',
    order: 2,
    bullets: [
      'Высота подъёма: 18 м',
      'Вылет стрелы: до 11 м',
      'Грузоподъёмность: 200 кг',
      'Проезд в арку: 3000 мм'
    ]
  },
  {
    url: '/equipment/avtovyshka-21m.html',
    order: 3,
    bullets: [
      'Высота подъёма: 21 м',
      'Вылет стрелы: до 11 м',
      'Грузоподъёмность: 1000 кг',
      'Размер корзины: 2 x 4 м'
    ]
  },
  {
    url: '/equipment/avtovyshka-29m.html',
    order: 4,
    bullets: [
      'Высота подъёма: 29 м',
      'Вылет стрелы: до 14 м',
      'Грузоподъёмность: 200 кг',
      'Проезд в арку: 3300 мм'
    ]
  }
];

console.log('🔄 Updating popular cards in database...\n');

// Update each popular card
let updated = 0;
let errors = 0;

popularCards.forEach((card, index) => {
  const bulletsJson = JSON.stringify(card.bullets);
  
  db.run(
    'UPDATE services SET is_popular = 1, popular_order = ?, card_bullets = ? WHERE url = ?',
    [card.order, bulletsJson, card.url],
    function(err) {
      if (err) {
        console.error(`❌ Error updating ${card.url}:`, err.message);
        errors++;
      } else if (this.changes > 0) {
        console.log(`✅ Updated ${card.url} (order: ${card.order}, bullets: ${card.bullets.length})`);
        updated++;
      } else {
        console.log(`⚠️  No service found with URL: ${card.url}`);
      }
      
      // Close DB after last update
      if (index === popularCards.length - 1) {
        setTimeout(() => {
          console.log(`\n📊 Summary: ${updated} updated, ${errors} errors`);
          db.close();
        }, 100);
      }
    }
  );
});
