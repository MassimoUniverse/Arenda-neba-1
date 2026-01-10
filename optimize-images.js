const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Конфигурация оптимизации
const CONFIG = {
  maxWidth: 1920,  // Максимальная ширина для карточек
  quality: 85,     // Качество WebP (85 = отличное качество, малый размер)
  formats: ['webp', 'jpg'], // Создаем WebP + JPEG fallback
};

// Папки для обработки
const FOLDERS = [
  'public/images',
  'uploads'
];

async function optimizeImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const stats = fs.statSync(inputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`📸 Обрабатываю: ${path.basename(inputPath)} (${sizeMB} MB)`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Создаем WebP версию
    const webpPath = path.join(outputDir, `${filename}.webp`);
    await image
      .resize(CONFIG.maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: CONFIG.quality })
      .toFile(webpPath);
    
    const webpStats = fs.statSync(webpPath);
    const webpSizeMB = (webpStats.size / (1024 * 1024)).toFixed(2);
    
    // Создаем JPEG fallback (для старых браузеров)
    const jpgPath = path.join(outputDir, `${filename}.jpg`);
    await image
      .resize(CONFIG.maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: CONFIG.quality })
      .toFile(jpgPath);
    
    const jpgStats = fs.statSync(jpgPath);
    const jpgSizeMB = (jpgStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`  ✅ WebP: ${webpSizeMB} MB (сжатие ${((1 - webpStats.size / stats.size) * 100).toFixed(1)}%)`);
    console.log(`  ✅ JPEG: ${jpgSizeMB} MB (сжатие ${((1 - jpgStats.size / stats.size) * 100).toFixed(1)}%)`);
    
    return {
      original: inputPath,
      webp: webpPath,
      jpg: jpgPath,
      originalSize: stats.size,
      webpSize: webpStats.size,
      jpgSize: jpgStats.size
    };
  } catch (error) {
    console.error(`  ❌ Ошибка: ${error.message}`);
    return null;
  }
}

async function optimizeFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  Папка не найдена: ${folderPath}`);
    return;
  }
  
  console.log(`\n📁 Обрабатываю папку: ${folderPath}`);
  
  // Создаем папку для оптимизированных изображений
  const optimizedDir = path.join(folderPath, 'optimized');
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }
  
  // Создаем папку для бэкапа оригиналов
  const backupDir = path.join(folderPath, 'originals-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const files = fs.readdirSync(folderPath);
  const imageFiles = files.filter(file => 
    /\.(png|jpg|jpeg)$/i.test(file) && 
    !file.startsWith('optimized_')
  );
  
  console.log(`Найдено изображений: ${imageFiles.length}`);
  
  const results = [];
  for (const file of imageFiles) {
    const inputPath = path.join(folderPath, file);
    const result = await optimizeImage(inputPath, optimizedDir);
    if (result) {
      results.push(result);
      
      // Копируем оригинал в backup
      const backupPath = path.join(backupDir, file);
      fs.copyFileSync(inputPath, backupPath);
    }
  }
  
  // Статистика
  if (results.length > 0) {
    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalWebp = results.reduce((sum, r) => sum + r.webpSize, 0);
    const totalJpg = results.reduce((sum, r) => sum + r.jpgSize, 0);
    
    console.log(`\n📊 Статистика для ${folderPath}:`);
    console.log(`  Оригинал: ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  WebP: ${(totalWebp / (1024 * 1024)).toFixed(2)} MB (экономия ${((1 - totalWebp / totalOriginal) * 100).toFixed(1)}%)`);
    console.log(`  JPEG: ${(totalJpg / (1024 * 1024)).toFixed(2)} MB (экономия ${((1 - totalJpg / totalOriginal) * 100).toFixed(1)}%)`);
    console.log(`  💾 Оригиналы сохранены в: ${backupDir}`);
    console.log(`  ✨ Оптимизированные в: ${optimizedDir}`);
  }
}

async function main() {
  console.log('🚀 Запуск оптимизации изображений...\n');
  console.log(`Настройки:`);
  console.log(`  - Максимальная ширина: ${CONFIG.maxWidth}px`);
  console.log(`  - Качество: ${CONFIG.quality}%`);
  console.log(`  - Форматы: ${CONFIG.formats.join(', ')}\n`);
  
  for (const folder of FOLDERS) {
    await optimizeFolder(folder);
  }
  
  console.log('\n✅ Оптимизация завершена!');
  console.log('\n📝 Следующие шаги:');
  console.log('1. Проверьте качество изображений в папках "optimized"');
  console.log('2. Если всё ОК - замените оригиналы оптимизированными');
  console.log('3. Оригиналы сохранены в папках "originals-backup"');
}

main().catch(console.error);
