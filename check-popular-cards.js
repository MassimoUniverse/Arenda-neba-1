#!/usr/bin/env node

// Скрипт для проверки популярных карточек в базе данных
// Использование: node check-popular-cards.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔍 Проверка популярных карточек в базе данных');
console.log('==============================================');
console.log('');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
    process.exit(1);
  }
  console.log('✅ Подключено к базе данных');
  console.log('');
});

// Проверяем структуру таблицы services
db.all("PRAGMA table_info(services)", [], (err, rows) => {
  if (err) {
    console.error('❌ Ошибка при проверке структуры таблицы:', err.message);
    db.close();
    return;
  }
  
  console.log('📊 Структура таблицы services:');
  const hasIsPopular = rows.some(r => r.name === 'is_popular');
  const hasPopularOrder = rows.some(r => r.name === 'popular_order');
  console.log(`   is_popular: ${hasIsPopular ? '✅' : '❌'}`);
  console.log(`   popular_order: ${hasPopularOrder ? '✅' : '❌'}`);
  console.log('');
  
  if (!hasIsPopular) {
    console.log('⚠️  Колонка is_popular отсутствует! Добавляем...');
    db.run("ALTER TABLE services ADD COLUMN is_popular INTEGER DEFAULT 0", (err) => {
      if (err) {
        console.error('❌ Ошибка при добавлении колонки:', err.message);
      } else {
        console.log('✅ Колонка is_popular добавлена');
      }
      checkPopularCards();
    });
  } else {
    checkPopularCards();
  }
});

function checkPopularCards() {
  // Проверяем все услуги
  db.all("SELECT id, title, is_popular, popular_order, image_url, active FROM services ORDER BY id", [], (err, rows) => {
    if (err) {
      console.error('❌ Ошибка при чтении услуг:', err.message);
      db.close();
      return;
    }
    
    console.log(`📋 Всего услуг в базе: ${rows.length}`);
    console.log('');
    
    // Проверяем популярные карточки
    db.all("SELECT id, title, is_popular, popular_order, image_url, active, updated_at FROM services WHERE is_popular = 1 ORDER BY popular_order", [], (err, popularRows) => {
      if (err) {
        console.error('❌ Ошибка при чтении популярных карточек:', err.message);
        db.close();
        return;
      }
      
      console.log(`⭐ Популярных карточек: ${popularRows.length}`);
      console.log('');
      
      if (popularRows.length === 0) {
        console.log('⚠️  ПРОБЛЕМА: Нет популярных карточек!');
        console.log('');
        console.log('📝 Все услуги:');
        rows.forEach((row, idx) => {
          console.log(`   ${idx + 1}. ID=${row.id}, title="${row.title}", is_popular=${row.is_popular || 0}, active=${row.active || 0}`);
        });
        console.log('');
        console.log('💡 Решение:');
        console.log('   1. Откройте админ панель: http://localhost:3000/admin.html');
        console.log('   2. Найдите вышку 13 метров');
        console.log('   3. Включите чекбокс "Популярное оборудование"');
        console.log('   4. Установите порядок (например, 1)');
        console.log('   5. Сохраните изменения');
      } else {
        console.log('✅ Популярные карточки:');
        popularRows.forEach((row, idx) => {
          console.log(`   ${idx + 1}. ID=${row.id}, title="${row.title}"`);
          console.log(`      is_popular=${row.is_popular}, popular_order=${row.popular_order || 0}`);
          console.log(`      image_url="${row.image_url || '(НЕТ)'}"`);
          console.log(`      active=${row.active || 0}, updated_at="${row.updated_at || '(НЕТ)'}"`);
          console.log('');
        });
        
        // Проверяем активные популярные карточки
        const activePopular = popularRows.filter(r => r.active === 1 || r.active === '1');
        console.log(`✅ Активных популярных карточек: ${activePopular.length}`);
        
        if (activePopular.length === 0) {
          console.log('');
          console.log('⚠️  ПРОБЛЕМА: Все популярные карточки неактивны!');
          console.log('💡 Решение: Включите активность для популярных карточек в админ панели');
        }
      }
      
      // Проверяем вышку 13 метров отдельно
      const service13m = rows.find(r => r.title && r.title.toLowerCase().includes('13'));
      if (service13m) {
        console.log('');
        console.log('🔍 Проверка вышки 13 метров:');
        console.log(`   ID: ${service13m.id}`);
        console.log(`   Title: "${service13m.title}"`);
        console.log(`   is_popular: ${service13m.is_popular || 0}`);
        console.log(`   popular_order: ${service13m.popular_order || 0}`);
        console.log(`   image_url: "${service13m.image_url || '(НЕТ)'}"`);
        console.log(`   active: ${service13m.active || 0}`);
        
        if (!service13m.is_popular) {
          console.log('');
          console.log('⚠️  Вышка 13 метров НЕ помечена как популярная!');
          console.log('💡 Решение: Включите "Популярное оборудование" для этой вышки в админ панели');
        }
      } else {
        console.log('');
        console.log('⚠️  Вышка 13 метров не найдена в базе данных!');
      }
      
      db.close();
      console.log('');
      console.log('✅ Проверка завершена');
    });
  });
}
