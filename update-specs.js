const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./database.db');

// Все услуги с полными характеристиками
const services = [
  {
    title: 'Автовышка 13м',
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
  console.log('🔄 Обновляем технические характеристики...\n');

  let updated = 0;
  let errors = 0;

  services.forEach((service, index) => {
    const stmt = db.prepare(`
      UPDATE services 
      SET height_lift = ?, 
          max_reach = ?, 
          max_capacity = ?, 
          lift_type = ?, 
          transport_length = ?, 
          transport_height = ?, 
          width = ?, 
          boom_rotation_angle = ?, 
          basket_rotation_angle = ?
      WHERE title = ?
    `);

    stmt.run(
      service.height_lift || '',
      service.max_reach || '',
      service.max_capacity || '',
      service.lift_type || '',
      service.transport_length || '',
      service.transport_height || '',
      service.width || '',
      service.boom_rotation_angle || '',
      service.basket_rotation_angle || '',
      service.title,
      function(err) {
        if (err) {
          errors++;
          console.error(`❌ Ошибка при обновлении "${service.title}":`, err);
        } else {
          if (this.changes > 0) {
            updated++;
            console.log(`✅ ${index + 1}. ${service.title} - характеристики обновлены`);
            console.log(`   Высота: ${service.height_lift || 'нет'}, Вылет: ${service.max_reach || 'нет'}, Груз: ${service.max_capacity || 'нет'}`);
          } else {
            console.log(`⚠️  ${index + 1}. ${service.title} - не найдена в базе`);
          }
        }
        stmt.finalize();
      }
    );
  });

  // Ждем завершения всех обновлений
  setTimeout(() => {
    console.log(`\n✅ Всего обновлено: ${updated} из ${services.length} услуг`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log('\n💡 Теперь перезапустите сервер для пересоздания страниц:');
    console.log('   pm2 restart arenda-neba');
    console.log('\n   Страницы будут автоматически пересозданы с новыми характеристиками!');
    
    db.close((err) => {
      if (err) {
        console.error('❌ Ошибка при закрытии базы:', err);
      } else {
        console.log('\n💾 База данных сохранена');
      }
    });
  }, 2000);
});

