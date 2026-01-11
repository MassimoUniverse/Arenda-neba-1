const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Конфигурация оптимизации
const CONFIG = {
  maxWidth: 1920,  // Максимальная ширина для карточек
  quality: 85,     // Качество WebP (85 = отличное качество, малый размер)
};

// Папки для обработки
const FOLDERS = [
  'public/images',
  'uploads'
];

async function optimizeAndReplaceImage(inputPath, backupDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath).toLowerCase();
  const stats = fs.statSync(inputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`📸 Обрабатываю: ${path.basename(inputPath)} (${sizeMB} MB)`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Создаем backup оригинала
    const backupPath = path.join(backupDir, path.basename(inputPath));
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
      console.log(`💾 Backup создан: ${path.basename(backupPath)}`);
    }
    
    // Создаем WebP версию (заменяем оригинал)
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
    
    console.log(`   ✅ WebP создан: ${webpSizeMB} MB (экономия ${savings}%)`);
    
    // Создаем JPEG fallback
    const jpegPath = path.join(dir, `${filename}.jpg`);
    await image
      .resize(CONFIG.maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: CONFIG.quality })
      .toFile(jpegPath);
    
    const jpegStats = fs.statSync(jpegPath);
    const jpegSizeMB = (jpegStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`   ✅ JPEG создан: ${jpegSizeMB} MB (fallback)`);
    
    // Удаляем оригинал если это не webp/jpg
    if (ext !== '.webp' && ext !== '.jpg' && ext !== '.jpeg') {
      fs.unlinkSync(inputPath);
      console.log(`   🗑️  Оригинал удален: ${path.basename(inputPath)}`);
    }
    
    return {
      success: true,
      original: sizeMB,
      webp: webpSizeMB,
      jpeg: jpegSizeMB,
      savings
    };
  } catch (error) {
    console.error(`❌ Ошибка обработки ${path.basename(inputPath)}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function processFolder(folderPath) {
  console.log(`\n📂 Обработка папки: ${folderPath}`);
  console.log('='.repeat(60));
  
  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  Папка не найдена, пропускаю...`);
    return;
  }
  
  // Создаем папку для backup
  const backupDir = path.join(folderPath, 'originals-backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Получаем все файлы изображений
  const files = fs.readdirSync(folderPath);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg'].includes(ext);
  });
  
  console.log(`Найдено изображений: ${imageFiles.length}`);
  
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let totalOriginalSize = 0;
  let totalWebpSize = 0;
  
  for (const file of imageFiles) {
    const filePath = path.join(folderPath, file);
    
    // Пропускаем если это файл из backup папки
    if (filePath.includes('originals-backup')) {
      continue;
    }
    
    const result = await optimizeAndReplaceImage(filePath, backupDir);
    
    if (result.success) {
      processed++;
      totalOriginalSize += parseFloat(result.original);
      totalWebpSize += parseFloat(result.webp);
    } else if (result.error) {
      errors++;
    } else {
      skipped++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 СТАТИСТИКА:');
  console.log(`   ✅ Обработано: ${processed}`);
  console.log(`   ⏭️  Пропущено: ${skipped}`);
  console.log(`   ❌ Ошибок: ${errors}`);
  console.log(`   💾 Было: ${totalOriginalSize.toFixed(2)} MB`);
  console.log(`   ✨ Стало: ${totalWebpSize.toFixed(2)} MB`);
  const totalSavings = ((1 - totalWebpSize / totalOriginalSize) * 100).toFixed(1);
  console.log(`   🎉 Экономия: ${totalSavings}%`);
}

async function main() {
  console.log('🚀 АВТОМАТИЧЕСКАЯ ОПТИМИЗАЦИЯ И ЗАМЕНА ИЗОБРАЖЕНИЙ');
  console.log('='.repeat(60));
  console.log(`⚙️  Настройки:`);
  console.log(`   - Макс. ширина: ${CONFIG.maxWidth}px`);
  console.log(`   - Качество: ${CONFIG.quality}%`);
  console.log(`   - Оригиналы сохраняются в: originals-backup/`);
  console.log('='.repeat(60));
  
  for (const folder of FOLDERS) {
    await processFolder(folder);
  }
  
  console.log('\n✅ Оптимизация завершена!');
  console.log('📋 Следующие шаги:');
  console.log('   1. Оригиналы сохранены в папках "originals-backup"');
  console.log('   2. WebP и JPEG файлы созданы и готовы к использованию');
  console.log('   3. Перезапусти сервер: pm2 restart arenda-neba');
}

main().catch(console.error);
