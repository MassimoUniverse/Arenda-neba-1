/**
 * Скрипт для проверки загрузки изображений через админ панель
 * Использование: node test-upload.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Конфигурация
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Создаем тестовое изображение (1x1 пиксель PNG)
const createTestImage = () => {
  // Простой PNG файл (1x1 пиксель, красный)
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00,
    0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testImagePath = path.join(__dirname, 'test-upload-image.png');
  fs.writeFileSync(testImagePath, pngBuffer);
  return testImagePath;
};

function testUpload() {
  console.log('🧪 Проверка системы загрузки изображений\n');
  
  // Проверка 1: Папка uploads
  console.log('1️⃣ Проверка папки uploads...');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    console.log('✅ Папка uploads существует');
    
    // Проверяем права доступа
    try {
      fs.accessSync(uploadsDir, fs.constants.W_OK);
      console.log('✅ Папка uploads доступна для записи');
    } catch (err) {
      console.error('❌ Папка uploads НЕ доступна для записи!');
      console.error('   Исправьте: chmod 755 uploads');
    }
    
    // Считаем файлы
    const files = fs.readdirSync(uploadsDir);
    const fileCount = files.length;
    console.log(`   Файлов в папке: ${fileCount}`);
    
    if (fileCount > 0) {
      // Показываем последние 5 файлов
      const filesWithStats = files.map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return { name: file, mtime: stats.mtime, size: stats.size };
      }).sort((a, b) => b.mtime - a.mtime).slice(0, 5);
      
      console.log('   Последние загруженные файлы:');
      filesWithStats.forEach((file, idx) => {
        console.log(`     ${idx + 1}. ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.mtime.toLocaleString('ru-RU')})`);
      });
    }
  } else {
    console.error('❌ Папка uploads НЕ существует!');
    console.error('   Она должна создаваться автоматически при запуске сервера');
  }
  
  console.log('');
  
  // Проверка 2: Эндпоинт загрузки
  console.log('2️⃣ Проверка эндпоинта загрузки...');
  const serverFile = path.join(__dirname, 'server.js');
  if (fs.existsSync(serverFile)) {
    const serverContent = fs.readFileSync(serverFile, 'utf8');
    if (serverContent.includes('/api/admin/upload')) {
      console.log('✅ Эндпоинт /api/admin/upload найден в server.js');
    } else {
      console.error('❌ Эндпоинт /api/admin/upload НЕ найден в server.js');
    }
    
    if (serverContent.includes('mkdirSync(uploadsDir')) {
      console.log('✅ Автоматическое создание папки uploads настроено');
    } else {
      console.warn('⚠️ Автоматическое создание папки uploads не найдено');
    }
  } else {
    console.error('❌ server.js не найден!');
  }
  
  console.log('');
  
  // Проверка 3: Зависимости
  console.log('3️⃣ Проверка зависимостей...');
  const packageJson = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    const requiredDeps = ['multer', 'sharp', 'express'];
    const missingDeps = requiredDeps.filter(dep => !pkg.dependencies[dep]);
    
    if (missingDeps.length === 0) {
      console.log('✅ Все необходимые зависимости установлены');
    } else {
      console.error('❌ Отсутствуют зависимости:', missingDeps.join(', '));
      console.error('   Установите: npm install');
    }
  }
  
  console.log('');
  console.log('✅ Проверка завершена');
  console.log('');
  console.log('💡 Для полного тестирования загрузки:');
  console.log('   1. Откройте админ панель в браузере');
  console.log('   2. Загрузите тестовое изображение');
  console.log('   3. Проверьте логи: pm2 logs arenda-neba --lines 50');
}

// Запускаем тест
testUpload();
