#!/usr/bin/env node
/**
 * Скрипт для оптимизации изображений в папке uploads
 * Конвертирует все PNG в WebP и обновляет пути в базе данных
 * 
 * Запуск: node optimize-uploads.js
 */

const sqlite3 = require('sqlite3').verbose();
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const db = new sqlite3.Database('./database.db');

console.log('🔄 Оптимизация изображений в папке uploads...\n');

async function optimizeImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const filename = path.basename(inputPath, ext);
  const outputDir = path.dirname(inputPath);
  
  // Пропускаем уже оптимизированные
  if (ext === '.webp') {
    console.log(`  ⏭️  Пропускаем (уже webp): ${path.basename(inputPath)}`);
    return null;
  }
  
  const stats = fs.statSync(inputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`  📸 ${path.basename(inputPath)} (${sizeMB} MB)`);
  
  try {
    const webpPath = path.join(outputDir, `${filename}.webp`);
    const jpgPath = path.join(outputDir, `${filename}.jpg`);
    
    // Создаем WebP версию
    await sharp(inputPath)
      .resize(1920, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(webpPath);
    
    const webpStats = fs.statSync(webpPath);
    const webpSizeMB = (webpStats.size / (1024 * 1024)).toFixed(2);
    console.log(`     ✅ WebP: ${webpSizeMB} MB (сжатие ${((1 - webpStats.size / stats.size) * 100).toFixed(1)}%)`);
    
    // Создаем JPG fallback
    await sharp(inputPath)
      .resize(1920, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(jpgPath);
    
    const jpgStats = fs.statSync(jpgPath);
    const jpgSizeMB = (jpgStats.size / (1024 * 1024)).toFixed(2);
    console.log(`     ✅ JPG: ${jpgSizeMB} MB`);
    
    // Удаляем оригинальный PNG
    if (ext === '.png') {
      fs.unlinkSync(inputPath);
      console.log(`     🗑️  Удалён оригинал: ${path.basename(inputPath)}`);
    }
    
    return {
      original: inputPath,
      webp: webpPath,
      oldUrl: `/uploads/${path.basename(inputPath)}`,
      newUrl: `/uploads/${filename}.webp`
    };
  } catch (error) {
    console.error(`     ❌ Ошибка: ${error.message}`);
    return null;
  }
}

async function updateDatabase(oldUrl, newUrl) {
  return new Promise((resolve, reject) => {
    // Обновляем image_url
    db.run(
      `UPDATE services SET image_url = ? WHERE image_url = ?`,
      [newUrl, oldUrl],
      function(err) {
        if (err) {
          console.error(`     ❌ Ошибка БД: ${err.message}`);
          reject(err);
        } else if (this.changes > 0) {
          console.log(`     📝 Обновлён image_url в БД: ${oldUrl} → ${newUrl}`);
        }
        resolve();
      }
    );
  });
}

async function updateImagesArrayInDb(oldUrl, newUrl) {
  return new Promise((resolve) => {
    db.all(`SELECT id, images FROM services WHERE images LIKE ?`, [`%${oldUrl}%`], async (err, rows) => {
      if (err || !rows || rows.length === 0) {
        resolve();
        return;
      }
      
      for (const row of rows) {
        try {
          let images = JSON.parse(row.images);
          let changed = false;
          
          images = images.map(url => {
            if (url === oldUrl || url.includes(path.basename(oldUrl))) {
              changed = true;
              return newUrl;
            }
            return url;
          });
          
          if (changed) {
            await new Promise((res, rej) => {
              db.run(`UPDATE services SET images = ? WHERE id = ?`, [JSON.stringify(images), row.id], (err) => {
                if (err) rej(err);
                else {
                  console.log(`     📝 Обновлён images для ID ${row.id}`);
                  res();
                }
              });
            });
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      resolve();
    });
  });
}

async function updateReachDiagramsInDb(oldUrl, newUrl) {
  return new Promise((resolve) => {
    db.all(`SELECT id, reach_diagrams FROM services WHERE reach_diagrams LIKE ?`, [`%${oldUrl}%`], async (err, rows) => {
      if (err || !rows || rows.length === 0) {
        resolve();
        return;
      }
      
      for (const row of rows) {
        try {
          let diagrams = JSON.parse(row.reach_diagrams);
          let changed = false;
          
          diagrams = diagrams.map(diagram => {
            // Если элемент - строка
            if (typeof diagram === 'string') {
              if (diagram === oldUrl || diagram.includes(path.basename(oldUrl))) {
                changed = true;
                return newUrl;
              }
              return diagram;
            }
            // Если элемент - объект с url
            else if (typeof diagram === 'object' && diagram !== null && diagram.url) {
              if (diagram.url === oldUrl || diagram.url.includes(path.basename(oldUrl))) {
                changed = true;
                return { ...diagram, url: newUrl };
              }
              return diagram;
            }
            return diagram;
          });
          
          if (changed) {
            await new Promise((res, rej) => {
              db.run(`UPDATE services SET reach_diagrams = ? WHERE id = ?`, [JSON.stringify(diagrams), row.id], (err) => {
                if (err) rej(err);
                else {
                  console.log(`     📝 Обновлён reach_diagrams для ID ${row.id}`);
                  res();
                }
              });
            });
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      resolve();
    });
  });
}

async function updateReachDiagramUrlInDb(oldUrl, newUrl) {
  return new Promise((resolve) => {
    db.run(
      `UPDATE services SET reach_diagram_url = ? WHERE reach_diagram_url = ?`,
      [newUrl, oldUrl],
      function(err) {
        if (err) {
          console.error(`     ❌ Ошибка БД: ${err.message}`);
        } else if (this.changes > 0) {
          console.log(`     📝 Обновлён reach_diagram_url в БД: ${oldUrl} → ${newUrl}`);
        }
        resolve();
      }
    );
  });
}

async function main() {
  // Читаем все файлы в uploads
  const files = fs.readdirSync(UPLOADS_DIR);
  const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));
  
  console.log(`📂 Найдено ${pngFiles.length} PNG файлов для оптимизации\n`);
  
  if (pngFiles.length === 0) {
    console.log('✅ Все изображения уже оптимизированы!');
    db.close();
    return;
  }
  
  let optimized = 0;
  
  for (const file of pngFiles) {
    const filePath = path.join(UPLOADS_DIR, file);
    const result = await optimizeImage(filePath);
    
    if (result) {
      await updateDatabase(result.oldUrl, result.newUrl);
      await updateImagesArrayInDb(result.oldUrl, result.newUrl);
      await updateReachDiagramsInDb(result.oldUrl, result.newUrl);
      await updateReachDiagramUrlInDb(result.oldUrl, result.newUrl);
      optimized++;
    }
    
    console.log('');
  }
  
  console.log(`\n✅ Оптимизировано: ${optimized} файлов`);
  console.log('💾 База данных закрыта\n');
  db.close();
}

main().catch(err => {
  console.error('❌ Ошибка:', err);
  db.close();
  process.exit(1);
});
