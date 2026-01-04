const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  // Таблица для контента сайта
  db.run(`CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT UNIQUE NOT NULL,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Таблица для преимуществ
  db.run(`CREATE TABLE IF NOT EXISTS advantages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    order_num INTEGER,
    active INTEGER DEFAULT 1
  )`);

  // Таблица для отзывов
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    company TEXT,
    rating INTEGER DEFAULT 5,
    text TEXT,
    image_url TEXT,
    date TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Таблица для услуг
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price TEXT,
    image_url TEXT,
    specifications TEXT,
    active INTEGER DEFAULT 1,
    order_num INTEGER
  )`);

  // Таблица администраторов
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Таблица заявок
  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Вставка начального контента
  const defaultContent = [
    {
      section: 'hero',
      title: 'Аренда Неба',
      subtitle: 'Профессиональная аренда автовышек',
      description: 'Безопасные высотные работы любой сложности. Современная техника и опытные операторы.',
      image_url: '/uploads/hero.jpg'
    },
    {
      section: 'about',
      title: 'О нашей компании',
      subtitle: 'Лидер в сфере аренды автовышек',
      description: 'Мы предоставляем услуги аренды автовышек с 2010 года. За это время выполнили более 5000 проектов для частных лиц и крупных компаний.',
      image_url: '/uploads/about.jpg'
    },
    {
      section: 'cta',
      title: 'Готовы начать работу?',
      subtitle: 'Получите бесплатную консультацию',
      description: 'Оставьте заявку, и наш менеджер свяжется с вами в течение 15 минут',
      image_url: ''
    }
  ];

  const insertContent = db.prepare('INSERT OR IGNORE INTO content (section, title, subtitle, description, image_url) VALUES (?, ?, ?, ?, ?)');
  defaultContent.forEach(content => {
    insertContent.run(content.section, content.title, content.subtitle, content.description, content.image_url);
  });
  insertContent.finalize();

  // Вставка начальных преимуществ
  const defaultAdvantages = [
    {
      title: 'Современная техника',
      description: 'Новейшие автовышки с высотой подъема от 12 до 45 метров',
      icon: '🚜',
      order_num: 1
    },
    {
      title: 'Опытные операторы',
      description: 'Сертифицированные специалисты с опытом работы более 10 лет',
      icon: '👷',
      order_num: 2
    },
    {
      title: 'Безопасность',
      description: 'Все работы проводятся с соблюдением норм безопасности и страхованием',
      icon: '🛡️',
      order_num: 3
    },
    {
      title: 'Доступные цены',
      description: 'Гибкая система скидок и выгодные условия для постоянных клиентов',
      icon: '💰',
      order_num: 4
    },
    {
      title: 'Работаем 24/7',
      description: 'Круглосуточная аренда и оперативная подача техники на объект',
      icon: '⏰',
      order_num: 5
    },
    {
      title: 'Полное обслуживание',
      description: 'Техническое сопровождение, консультации и помощь на всех этапах',
      icon: '🔧',
      order_num: 6
    }
  ];

  const insertAdvantage = db.prepare('INSERT INTO advantages (title, description, icon, order_num) VALUES (?, ?, ?, ?)');
  defaultAdvantages.forEach(adv => {
    insertAdvantage.run(adv.title, adv.description, adv.icon, adv.order_num);
  });
  insertAdvantage.finalize();

  // Вставка начальных отзывов
  const defaultReviews = [
    {
      client_name: 'Александр Иванов',
      company: 'ООО "СтройМастер"',
      rating: 5,
      text: 'Отличная компания! Техника в идеальном состоянии, операторы профессионалы своего дела. Работали с ними на нескольких объектах - всегда качественно и в срок.',
      date: '2024-10-15'
    },
    {
      client_name: 'Мария Петрова',
      company: 'Частное лицо',
      rating: 5,
      text: 'Спасибо за оперативность! Нужно было срочно провести работы на высоте. Автовышку подали через 2 часа после звонка. Всё прошло отлично!',
      date: '2024-10-20'
    },
    {
      client_name: 'Дмитрий Соколов',
      company: 'ЗАО "ГорСтрой"',
      rating: 5,
      text: 'Сотрудничаем уже 3 года. Надежная компания с адекватными ценами. Рекомендую!',
      date: '2024-11-01'
    }
  ];

  const insertReview = db.prepare('INSERT INTO reviews (client_name, company, rating, text, date) VALUES (?, ?, ?, ?, ?)');
  defaultReviews.forEach(review => {
    insertReview.run(review.client_name, review.company, review.rating, review.text, review.date);
  });
  insertReview.finalize();

  // Вставка начальных услуг
  const defaultServices = [
    {
      title: 'Автовышка 12-18 метров',
      description: 'Идеально подходит для работ на малой и средней высоте: ремонт фасадов, установка рекламы, обрезка деревьев',
      price: 'от 2500 руб/час',
      specifications: 'Высота: 12-18м, Грузоподъемность: 200кг, Вылет стрелы: 8м',
      order_num: 1
    },
    {
      title: 'Автовышка 20-28 метров',
      description: 'Универсальное решение для большинства высотных работ: строительство, монтаж конструкций, фасадные работы',
      price: 'от 3500 руб/час',
      specifications: 'Высота: 20-28м, Грузоподъемность: 250кг, Вылет стрелы: 12м',
      order_num: 2
    },
    {
      title: 'Автовышка 30-45 метров',
      description: 'Для сложных высотных работ: многоэтажное строительство, монтаж промышленного оборудования, ремонт высоких зданий',
      price: 'от 5000 руб/час',
      specifications: 'Высота: 30-45м, Грузоподъемность: 300кг, Вылет стрелы: 18м',
      order_num: 3
    }
  ];

  const insertService = db.prepare('INSERT INTO services (title, description, price, specifications, order_num) VALUES (?, ?, ?, ?, ?)');
  defaultServices.forEach(service => {
    insertService.run(service.title, service.description, service.price, service.specifications, service.order_num);
  });
  insertService.finalize();

  // Создание администратора по умолчанию
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  bcrypt.hash(adminPassword, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err);
      db.close();
      return;
    }
    
    db.run('INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)', [adminUsername, hash], (err) => {
      if (err) {
        console.error('Error creating admin:', err);
      } else {
        console.log(`✅ Admin user created: ${adminUsername}`);
      }
      
      // Close database after admin creation
      db.close(() => {
        console.log('✅ Database initialized successfully!');
        console.log('📝 Default admin credentials:');
        console.log(`   Username: ${adminUsername}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('⚠️  Please change these credentials after first login!');
      });
    });
  });
});

