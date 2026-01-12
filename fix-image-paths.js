#!/usr/bin/env node
/**
 * Скрипт для исправления путей к изображениям в базе данных
 * Заменяет .png на .webp и localhost URL на относительные пути
 * 
 * Запуск: node fix-image-paths.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./database.db');

console.log('🔄 Исправляем пути к изображениям в базе данных...\n');

// Функция для исправления URL изображения
function fixImageUrl(url) {
  if (!url) return url;
  
  let fixed = url;
  
  // 1. Удаляем localhost URL
  fixed = fixed.replace(/http:\/\/localhost:\d+/g, '');
  fixed = fixed.replace(/https:\/\/localhost:\d+/g, '');
  
  // 2. Удаляем домен сервера (если есть)
  fixed = fixed.replace(/https?:\/\/[^\/]+/g, '');
  
  // 3. Заменяем .png на .webp (если файл существует)
  if (fixed.includes('.png')) {
    const webpPath = fixed.replace('.png', '.webp');
    const fullPath = path.join(__dirname, 'public', webpPath.replace(/^\//, ''));
    
    if (fs.existsSync(fullPath)) {
      fixed = webpPath;
      console.log(`  📸 PNG → WebP: ${url} → ${fixed}`);
    } else {
      // Проверяем jpg
      const jpgPath = fixed.replace('.png', '.jpg');
      const jpgFullPath = path.join(__dirname, 'public', jpgPath.replace(/^\//, ''));
      
      if (fs.existsSync(jpgFullPath)) {
        fixed = jpgPath;
        console.log(`  📸 PNG → JPG: ${url} → ${fixed}`);
      } else {
        console.log(`  ⚠️  Файл не найден: ${fullPath}`);
      }
    }
  }
  
  return fixed;
}

// Функция для исправления JSON массива (images, reach_diagrams)
function fixJsonArray(jsonStr) {
  if (!jsonStr) return jsonStr;
  
  try {
    let arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) return jsonStr;
    
    arr = arr.map(url => fixImageUrl(url));
    return JSON.stringify(arr);
  } catch (e) {
    return jsonStr;
  }
}

db.serialize(() => {
  // Получаем все услуги
  db.all('SELECT id, title, image_url, images, reach_diagrams FROM services', [], (err, services) => {
    if (err) {
      console.error('❌ Ошибка при получении услуг:', err);
      db.close();
      return;
    }

    console.log(`📊 Найдено ${services.length} услуг\n`);

    let updatedCount = 0;

    services.forEach((service) => {
      let needUpdate = false;
      const updates = {};
      
      // Исправляем image_url
      const fixedImageUrl = fixImageUrl(service.image_url);
      if (fixedImageUrl !== service.image_url) {
        updates.image_url = fixedImageUrl;
        needUpdate = true;
      }
      
      // Исправляем images (JSON массив)
      const fixedImages = fixJsonArray(service.images);
      if (fixedImages !== service.images) {
        updates.images = fixedImages;
        needUpdate = true;
      }
      
      // Исправляем reach_diagrams (JSON массив)
      const fixedDiagrams = fixJsonArray(service.reach_diagrams);
      if (fixedDiagrams !== service.reach_diagrams) {
        updates.reach_diagrams = fixedDiagrams;
        needUpdate = true;
      }
      
      if (needUpdate) {
        updatedCount++;
        console.log(`\n🔧 Обновляем: ${service.title} (ID: ${service.id})`);
        
        // Формируем SQL запрос
        const setClauses = [];
        const params = [];
        
        if (updates.image_url !== undefined) {
          setClauses.push('image_url = ?');
          params.push(updates.image_url);
        }
        if (updates.images !== undefined) {
          setClauses.push('images = ?');
          params.push(updates.images);
        }
        if (updates.reach_diagrams !== undefined) {
          setClauses.push('reach_diagrams = ?');
          params.push(updates.reach_diagrams);
        }
        
        params.push(service.id);
        
        const sql = `UPDATE services SET ${setClauses.join(', ')} WHERE id = ?`;
        
        db.run(sql, params, function(err) {
          if (err) {
            console.error(`  ❌ Ошибка обновления: ${err.message}`);
          } else {
            console.log(`  ✅ Обновлено`);
          }
        });
      }
    });

    // Закрываем базу после всех операций
    setTimeout(() => {
      console.log(`\n✅ Обновлено записей: ${updatedCount}`);
      console.log('💾 База данных закрыта\n');
      db.close();
    }, 1000);
  });
});
