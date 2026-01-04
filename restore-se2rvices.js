const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./database.db');

// Все услуги которые должны быть в каталоге
const services = [
  {
    title: 'Автовышка 13м',
    description: 'Компактная автовышка для работ на малой высоте. Идеально подходит для ремонта фасадов, установки рекламы, обрезки деревьев.',
    price: '20 000 ₽/смена',
    image_url: '/images/avtovyshka-13m.png',
    order_num: 1,
    url: '/equipment/avtovyshka-13m.html',
    height_lift: '13 метров',
    max_reach: '8 метров',
    max_capacity: '400 кг',
    lift_type: 'Автовышка',
    transport_length: '6.5 метров',
    transport_height: '2.5 метров',
    width: '2.2 метров',
    boom_rotation_angle: '360°',
    basket_rotation_angle: '360°'
  },
  {
    title: 'Автовышка 15м',
    description: 'Универсальная автовышка для работ на средней высоте. Подходит для большинства фасадных и монтажных работ.',
    price: '20 000 ₽/смена',
    image_url: '/images/avtovyshka-15m.png',
    order_num: 2,
    url: '/equipment/avtovyshka-15m.html',
    height_lift: '15 метров',
    max_reach: '11 метров',
    max_capacity: '200 кг',
    lift_type: 'ГАЗ-3309',
    transport_length: '',
    transport_height: '',
    width: '1.2 x 0.7 м',
    boom_rotation_angle: '',
    basket_rotation_angle: ''
  },
  {
    title: 'Автовышка 16м',
    description: 'Надежная автовышка для работ на высоте до 16 метров. Отличный выбор для ремонта и обслуживания зданий.',
    price: '20 000 ₽/смена',
    image_url: '/images/avtovyshka-13m.png',
    order_num: 3,
    url: '/equipment/avtovyshka-16m.html',
    height_lift: '16 м',
    max_reach: '11 м',
    max_capacity: '1000 кг',
    lift_type: 'Автовышка',
    transport_length: '6.5 метров',
    transport_height: '3.5 метров',
    width: '2.0 метров',
    boom_rotation_angle: '360°',
    basket_rotation_angle: '360°'
  },
  {
    title: 'Автовышка 18м',
    description: 'Профессиональная автовышка для высотных работ. Идеальна для строительства, монтажа конструкций и фасадных работ.',
    price: '22 000 ₽/смена',
    image_url: '/images/avtovyshka-18m.png',
    order_num: 4,
    url: '/equipment/avtovyshka-18m.html',
    height_lift: '18 метров',
    max_reach: '11 метров',
    max_capacity: '220 кг',
    lift_type: 'ГАЗ-3309',
    transport_length: '',
    transport_height: '',
    width: '1.2 x 0.7 м',
    boom_rotation_angle: '',
    basket_rotation_angle: ''
  },
  {
    title: 'Автовышка 21м',
    description: 'Мощная автовышка для работ на высоте до 21 метра. Подходит для многоэтажного строительства и сложных монтажных работ.',
    price: '22 000 ₽/смена',
    image_url: '/images/avtovyshka-21m.png',
    order_num: 5,
    url: '/equipment/avtovyshka-21m.html',
    height_lift: '21 м',
    max_reach: '11 м',
    max_capacity: '1000 кг',
    lift_type: 'Автовышка',
    transport_length: '7.4 метров',
    transport_height: '3.5 метров',
    width: '2.2 метров',
    boom_rotation_angle: '360°',
    basket_rotation_angle: '360°'
  },
  {
    title: 'Автовышка 25м',
    description: 'Высокопроизводительная автовышка для серьезных высотных работ. Отличный выбор для строительства и промышленного монтажа.',
    price: '24 000 ₽/смена',
    image_url: '/images/avtovyshka-25m.png',
    order_num: 6,
    url: '/equipment/avtovyshka-25m.html',
    height_lift: '25 метров',
    max_reach: '13,5 метров',
    max_capacity: '250 кг',
    lift_type: '',
    transport_length: '',
    transport_height: '3500 мм',
    width: '1.2 x 0.7 м',
    boom_rotation_angle: '',
    basket_rotation_angle: ''
  },
  {
    title: 'Автовышка 29м',
    description: 'Профессиональная автовышка для сложных высотных работ. Идеальна для многоэтажного строительства и ремонта высоких зданий.',
    price: '26 000 ₽/смена',
    image_url: '/images/avtovyshka-29m.png',
    order_num: 7,
    url: '/equipment/avtovyshka-29m.html',
    height_lift: '29 метров',
    max_reach: '14 метров',
    max_capacity: '200 кг',
    lift_type: '',
    transport_length: '',
    transport_height: '3300 мм',
    width: '1.2 x 0.7 м',
    boom_rotation_angle: '',
    basket_rotation_angle: ''
  },
  {
    title: 'Автовышка 45м',
    description: 'Мощная автовышка для самых сложных высотных работ. Для многоэтажного строительства, монтажа промышленного оборудования, ремонта высоких зданий.',
    price: '28 000 ₽/смена',
    image_url: '/images/avtovyshka-13m.png',
    order_num: 8,
    url: '/equipment/avtovyshka-45m.html',
    height_lift: '45 м',
    max_reach: '25 м',
    max_capacity: '300 кг',
    lift_type: 'Телескопическая',
    transport_length: '',
    transport_height: '',
    width: '',
    boom_rotation_angle: '',
    basket_rotation_angle: ''
  },
  {
    title: 'Автовышка вездеход 35 метров',
    description: 'Уникальная вездеходная техника 4x4 для труднодоступных мест и бездорожья. Идеальна для лесных массивов, строек, горных работ.',
    price: '32 000 ₽/смена',
    image_url: '/images/avtovyshka-vezdehod-30m.png',
    order_num: 9,
    url: '/equipment/avtovyshka-vezdehod-35m.html',
    height_lift: '25 метров',
    max_reach: '14 метров',
    max_capacity: '250 кг',
    lift_type: 'КАМАЗ-43253',
    transport_length: '',
    transport_height: '',
    width: '1.2 x 0.7 м',
    boom_rotation_angle: '',
    basket_rotation_angle: ''
  },
  {
    title: 'Самоходная автовышка',
    description: 'Компактная электрическая автовышка для работы внутри помещений. Бесшумная, экологичная, ширина всего 0.76м. Идеальна для складов и производственных помещений.',
    price: '18 000 ₽/смена',
    image_url: '/images/avtovyshka-13m.png',
    order_num: 10,
    url: '/equipment/samohodnaya-avtovyshka.html',
    height_lift: '21.38 м',
    max_reach: '12.3 м',
    max_capacity: '250/360 кг',
    lift_type: 'Самоходная автовышка',
    transport_length: '8.82 м',
    transport_height: '2.52 м',
    width: '2.46 м',
    boom_rotation_angle: '360°',
    basket_rotation_angle: '±90°'
  },
  {
    title: 'Телескопический погрузчик',
    description: 'Универсальная техника с высотой подъема 17м и грузоподъемностью 3500кг. Навесное оборудование: вилы, ковш, люлька. Идеален для складов и строительных площадок.',
    price: '25 000 ₽/смена',
    image_url: '/images/avtovyshka-13m.png',
    order_num: 11,
    url: '/equipment/teleskopicheskiy-pogruzchik.html',
    height_lift: '17м',
    max_reach: '',
    max_capacity: '3500кг',
    lift_type: 'Телескопический погрузчик',
    transport_length: '',
    transport_height: '',
    width: '',
    boom_rotation_angle: '',
    basket_rotation_angle: ''
  }
];

db.serialize(() => {
  console.log('🔄 Начинаем восстановление услуг...\n');

  // Удаляем старые базовые услуги (если есть)
  db.run('DELETE FROM services WHERE title IN (?, ?, ?)', 
    ['Автовышка 12-18 метров', 'Автовышка 20-28 метров', 'Автовышка 30-45 метров'],
    function(err) {
      if (err) {
        console.error('❌ Ошибка при удалении старых услуг:', err);
      } else {
        console.log(`✅ Удалено ${this.changes} старых услуг`);
      }
    }
  );

  // Сначала добавляем колонки для технических характеристик (если их нет)
  // Игнорируем ошибки, если колонки уже существуют
  db.run(`ALTER TABLE services ADD COLUMN height_lift TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: height_lift column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN max_reach TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: max_reach column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN max_capacity TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: max_capacity column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN lift_type TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: lift_type column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN transport_length TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: transport_length column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN transport_height TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: transport_height column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN width TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: width column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN boom_rotation_angle TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: boom_rotation_angle column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN basket_rotation_angle TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: basket_rotation_angle column may already exist'); });
  db.run(`ALTER TABLE services ADD COLUMN url TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Note: url column may already exist'); });

  // Добавляем все услуги
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO services 
    (title, description, price, image_url, order_num, url, active, height_lift, max_reach, max_capacity, lift_type, transport_length, transport_height, width, boom_rotation_angle, basket_rotation_angle) 
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let added = 0;
  services.forEach((service, index) => {
    stmt.run(
      service.title,
      service.description,
      service.price,
      service.image_url,
      service.order_num,
      service.url,
      service.height_lift || '',
      service.max_reach || '',
      service.max_capacity || '',
      service.lift_type || '',
      service.transport_length || '',
      service.transport_height || '',
      service.width || '',
      service.boom_rotation_angle || '',
      service.basket_rotation_angle || '',
      function(err) {
        if (err) {
          console.error(`❌ Ошибка при добавлении "${service.title}":`, err);
        } else {
          added++;
          console.log(`✅ ${index + 1}. ${service.title} - добавлена (характеристики: ${service.height_lift || 'нет'})`);
        }
      }
    );
  });

  stmt.finalize(() => {
    console.log(`\n✅ Всего восстановлено: ${added} из ${services.length} услуг`);
    console.log('✅ Восстановление услуг завершено!\n');
    
    db.close((err) => {
      if (err) {
        console.error('❌ Ошибка при закрытии базы:', err);
      } else {
        console.log('💾 База данных сохранена');
        console.log('\n💡 Теперь запустите: node restore-reviews.js');
        console.log('🔄 Затем перезапустите приложение: pm2 restart arenda-neba');
      }
    });
  });
});

