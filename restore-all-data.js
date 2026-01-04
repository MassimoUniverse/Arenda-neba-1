const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🚀 Восстановление всех данных: услуги и отзывы\n');

// Импортируем функции восстановления
require('./restore-services.js');
require('./restore-reviews.js');

// Этот скрипт можно использовать для восстановления всего сразу
// Но лучше запускать restore-services.js и restore-reviews.js отдельно

