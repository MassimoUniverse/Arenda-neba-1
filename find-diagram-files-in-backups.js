const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🔍 Поиск файлов схем вылета стрелы в бэкапах...\n');

// Список отсутствующих файлов из вывода check-missing-upload-files.js
const missingFiles = [
  '1767022553265-595670874.webp',
  '1767022553271-193881137.webp',
  '1766906990333-634761041.webp',
  '1766906990340-898445275.webp',
  '1767020992801-610915876.jpeg',
  '1767020992806-447552058.jpeg'
];

// Ищем все .db файлы в текущей директории
let dbFiles = [];
try {
  const files = fs.readdirSync(__dirname);
  dbFiles = files.filter(f => f.endsWith('.db') && (f.includes('backup') || f.includes('temp') || f === 'database.db'));
} catch (err) {
  console.error('❌ Ошибка при чтении директории:', err.message);
  process.exit(1);
}

const backupFiles = dbFiles.filter(f => f !== 'database.db');

console.log(`📂 Найдено файлов БД: ${dbFiles.length}`);
console.log(`📦 Найдено бэкапов: ${backupFiles.length}\n`);

if (backupFiles.length === 0) {
  console.log('⚠️  Бэкапы не найдены в текущей директории');
  console.log('💡 Попробуйте найти бэкапы вручную:');
  console.log('   find /opt/arenda-neba -name "*.db" -type f');
  process.exit(0);
}

let foundInBackups = [];

backupFiles.forEach(backupFile => {
  const backupPath = path.join(__dirname, backupFile);
  console.log(`\n📂 Проверяем: ${backupFile}`);
  
  const backupDb = new sqlite3.Database(backupPath);
  
  // Проверяем наличие таблицы services
  backupDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='services'", (err, tableExists) => {
    if (err || !tableExists) {
      console.log(`   ⚠️  Таблица services не найдена в этом бэкапе`);
      backupDb.close();
      return;
    }
    
    // Получаем все услуги с схемами
    backupDb.all('SELECT id, title, reach_diagrams, reach_diagram_url FROM services', [], (err, services) => {
      if (err) {
        console.log(`   ❌ Ошибка при чтении: ${err.message}`);
        backupDb.close();
        return;
      }
      
      let foundInThisBackup = [];
      
      services.forEach(service => {
        let diagrams = [];
        
        // Парсим reach_diagrams
        if (service.reach_diagrams && service.reach_diagrams.trim()) {
          try {
            const parsed = JSON.parse(service.reach_diagrams);
            if (Array.isArray(parsed)) {
              diagrams = parsed.map(d => {
                if (typeof d === 'string') return d;
                return d.url || d;
              });
            }
          } catch (e) {
            // Игнорируем ошибки парсинга
          }
        }
        
        // Добавляем reach_diagram_url
        if (service.reach_diagram_url && service.reach_diagram_url.trim()) {
          diagrams.push(service.reach_diagram_url.trim());
        }
        
        // Проверяем каждый файл
        diagrams.forEach(diagramUrl => {
          let fileName = diagramUrl;
          if (fileName.startsWith('/uploads/')) {
            fileName = fileName.substring('/uploads/'.length);
          } else if (fileName.startsWith('uploads/')) {
            fileName = fileName.substring('uploads/'.length);
          }
          
          if (missingFiles.includes(fileName)) {
            foundInThisBackup.push({
              service: service.title,
              serviceId: service.id,
              file: fileName,
              url: diagramUrl
            });
          }
        });
      });
      
      if (foundInThisBackup.length > 0) {
        console.log(`   ✅ Найдено схем в этом бэкапе: ${foundInThisBackup.length}`);
        foundInThisBackup.forEach(item => {
          console.log(`      - ${item.file} (Услуга: "${item.service}")`);
        });
        foundInBackups.push({
          backup: backupFile,
          backupPath: backupPath,
          files: foundInThisBackup
        });
      } else {
        console.log(`   ⚠️  Схемы в этом бэкапе не найдены`);
      }
      
      backupDb.close();
      
      // Проверяем, все ли бэкапы проверены
      if (backupFiles.indexOf(backupFile) === backupFiles.length - 1) {
        printSummary();
      }
    });
  });
});

function printSummary() {
  console.log('\n\n📊 Итоговая статистика:');
  console.log(`   Отсутствует файлов: ${missingFiles.length}`);
  console.log(`   Найдено в бэкапах: ${foundInBackups.reduce((sum, b) => sum + b.files.length, 0)}`);
  
  if (foundInBackups.length > 0) {
    console.log('\n✅ Бэкапы со схемами:');
    foundInBackups.forEach(backup => {
      console.log(`\n   📦 ${backup.backup}`);
      console.log(`      Найдено файлов: ${backup.files.length}`);
      console.log(`      Команда для восстановления:`);
      console.log(`      node restore-all-images-and-diagrams.js "${backup.backupPath}"`);
    });
    
    // Рекомендуем лучший бэкап (с наибольшим количеством файлов)
    const bestBackup = foundInBackups.reduce((best, current) => 
      current.files.length > best.files.length ? current : best
    );
    
    console.log('\n💡 Рекомендуемый бэкап для восстановления:');
    console.log(`   ${bestBackup.backup} (${bestBackup.files.length} файлов)`);
    console.log(`   Команда: node restore-all-images-and-diagrams.js "${bestBackup.backupPath}"`);
  } else {
    console.log('\n❌ Схемы не найдены ни в одном бэкапе');
    console.log('\n💡 Рекомендации:');
    console.log('   1. Загрузите схемы заново через админ-панель');
    console.log('   2. Или проверьте другие бэкапы в других директориях');
  }
  
  process.exit(0);
}

// Если бэкапов нет, выходим сразу
if (backupFiles.length === 0) {
  process.exit(0);
}
