const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Конфигурация
const CONFIG = {
  maxWidth: 1920,
  quality: 85,
  dbPath: 'database.db'
};

const FOLDERS = ['public/images', 'uploads'];

// Функция для оптимизации изображения
async function optimizeAndReplaceImage(inputPath, backupDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath).toLowerCase();
  const stats = fs.statSync(inputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`📸 Обрабатываю: ${path.basename(inputPath)} (${sizeMB} MB)`);
  
  try {
    const image = sharp(inputPath);
    
    // Создаем backup
    const backupPath = path.join(backupDir, path.basename(inputPath));
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
      console.log(`   💾 Backup: ${path.basename(backupPath)}`);
    }
    
    // Создаем WebP
    const webpPath = path.join(dir, `${filename}.webp`);
    await image
      .resize(CONFIG.maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: CONFIG.quality })
      .toFile(webpPath);
    
    const webpStats = fs.statSync(webpPath);
    const webpSizeMB = (webpStats.size / (1024 * 1024)).toFixed(2);
    const savings = ((1 - webpStats.size / stats.size) * 100).toFixed(1);
    console.log(`   ✅ WebP: ${webpSizeMB} MB (экономия ${savings}%)`);
    
    // Создаем JPEG
    const jpegPath = path.join(dir, `${filename}.jpg`);
    await image
      .resize(CONFIG.maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: CONFIG.quality })
      .toFile(jpegPath);
    
    console.log(`   ✅ JPEG: fallback создан`);
    
    // Удаляем оригинал если это PNG
    if (ext === '.png') {
      fs.unlinkSync(inputPath);
      console.log(`   🗑️  PNG удален`);
    }
    
    return { success: true, webpPath, jpegPath };
  } catch (error) {
    console.error(`   ❌ Ошибка: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Функция для обработки папки
async function processFolder(folderPath) {
  console.log(`\n📂 Папка: ${folderPath}`);
  console.log('='.repeat(60));
  
  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  Папка не найдена, пропускаю...`);
    return;
  }
  
  const backupDir = path.join(folderPath, 'originals-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const files = fs.readdirSync(folderPath);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg'].includes(ext);
  });
  
  console.log(`Найдено изображений: ${imageFiles.length}`);
  
  for (const file of imageFiles) {
    const filePath = path.join(folderPath, file);
    if (!filePath.includes('originals-backup')) {
      await optimizeAndReplaceImage(filePath, backupDir);
    }
  }
}

// Функция для обновления путей в базе данных
function updateDatabasePaths() {
  return new Promise((resolve, reject) => {
    console.log('\n🗄️  ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ');
    console.log('='.repeat(60));
    
    const db = new sqlite3.Database(CONFIG.dbPath, (err) => {
      if (err) {
        console.error('❌ Ошибка подключения к БД:', err);
        reject(err);
        return;
      }
      console.log('✅ Подключено к базе данных');
    });
    
    // Обновляем image_url: .png → .webp
    db.run(`
      UPDATE services 
      SET image_url = REPLACE(image_url, '.png', '.webp')
      WHERE image_url LIKE '%.png'
    `, function(err) {
      if (err) {
        console.error('❌ Ошибка обновления image_url:', err);
        db.close();
        reject(err);
        return;
      }
      console.log(`✅ Обновлено image_url: ${this.changes} записей`);
      
      // Обновляем images массив
      db.all(`SELECT id, images FROM services WHERE images IS NOT NULL AND images != ''`, (err, rows) => {
        if (err) {
          console.error('❌ Ошибка чтения images:', err);
          db.close();
          reject(err);
          return;
        }
        
        let updated = 0;
        const promises = rows.map(row => {
          return new Promise((resolveRow, rejectRow) => {
            try {
              let images = JSON.parse(row.images);
              let changed = false;
              
              if (Array.isArray(images)) {
                images = images.map(img => {
                  if (typeof img === 'string' && img.includes('.png')) {
                    changed = true;
                    return img.replace('.png', '.webp');
                  }
                  return img;
                });
                
                if (changed) {
                  db.run(
                    'UPDATE services SET images = ? WHERE id = ?',
                    [JSON.stringify(images), row.id],
                    function(err) {
                      if (err) {
                        console.error(`❌ Ошибка обновления images для ID ${row.id}:`, err);
                        rejectRow(err);
                      } else {
                        updated++;
                        resolveRow();
                      }
                    }
                  );
                } else {
                  resolveRow();
                }
              } else {
                resolveRow();
              }
            } catch (e) {
              console.error(`❌ Ошибка парсинга images для ID ${row.id}:`, e);
              resolveRow(); // Продолжаем даже если не удалось распарсить
            }
          });
        });
        
        Promise.all(promises)
          .then(() => {
            console.log(`✅ Обновлено images массивов: ${updated} записей`);
            
            // Обновляем reach_diagrams массив
            db.all(`SELECT id, reach_diagrams FROM services WHERE reach_diagrams IS NOT NULL AND reach_diagrams != ''`, (err, rows) => {
              if (err) {
                console.error('❌ Ошибка чтения reach_diagrams:', err);
                db.close();
                reject(err);
                return;
              }
              
              let updatedDiagrams = 0;
              const diagramPromises = rows.map(row => {
                return new Promise((resolveRow, rejectRow) => {
                  try {
                    let diagrams = JSON.parse(row.reach_diagrams);
                    let changed = false;
                    
                    if (Array.isArray(diagrams)) {
                      diagrams = diagrams.map(diag => {
                        if (diag && diag.url && diag.url.includes('.png')) {
                          changed = true;
                          return { ...diag, url: diag.url.replace('.png', '.webp') };
                        }
                        return diag;
                      });
                      
                      if (changed) {
                        db.run(
                          'UPDATE services SET reach_diagrams = ? WHERE id = ?',
                          [JSON.stringify(diagrams), row.id],
                          function(err) {
                            if (err) {
                              console.error(`❌ Ошибка обновления reach_diagrams для ID ${row.id}:`, err);
                              rejectRow(err);
                            } else {
                              updatedDiagrams++;
                              resolveRow();
                            }
                          }
                        );
                      } else {
                        resolveRow();
                      }
                    } else {
                      resolveRow();
                    }
                  } catch (e) {
                    console.error(`❌ Ошибка парсинга reach_diagrams для ID ${row.id}:`, e);
                    resolveRow();
                  }
                });
              });
              
              Promise.all(diagramPromises)
                .then(() => {
                  console.log(`✅ Обновлено reach_diagrams: ${updatedDiagrams} записей`);
                  db.close((err) => {
                    if (err) {
                      console.error('❌ Ошибка закрытия БД:', err);
                      reject(err);
                    } else {
                      console.log('✅ База данных обновлена!');
                      resolve();
                    }
                  });
                })
                .catch(reject);
            });
          })
          .catch(reject);
      });
    });
  });
}

// Главная функция
async function main() {
  console.log('🚀 ПОЛНАЯ АВТОМАТИЗАЦИЯ: ОПТИМИЗАЦИЯ + ОБНОВЛЕНИЕ БД');
  console.log('='.repeat(60));
  console.log(`⚙️  Настройки:`);
  console.log(`   - Макс. ширина: ${CONFIG.maxWidth}px`);
  console.log(`   - Качество: ${CONFIG.quality}%`);
  console.log(`   - База данных: ${CONFIG.dbPath}`);
  console.log('='.repeat(60));
  
  // Шаг 1: Оптимизируем изображения
  for (const folder of FOLDERS) {
    await processFolder(folder);
  }
  
  // Шаг 2: Обновляем базу данных
  try {
    await updateDatabasePaths();
  } catch (error) {
    console.error('❌ Ошибка обновления БД:', error);
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ВСЁ ГОТОВО!');
  console.log('📋 Что было сделано:');
  console.log('   1. ✅ Изображения оптимизированы (WebP + JPEG)');
  console.log('   2. ✅ Оригиналы сохранены в originals-backup/');
  console.log('   3. ✅ База данных обновлена (.png → .webp)');
  console.log('   4. ✅ Готово к использованию!');
  console.log('\n🔄 Перезапусти сервер: pm2 restart arenda-neba');
}

main().catch(console.error);
