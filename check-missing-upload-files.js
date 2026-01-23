const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./database.db');
const uploadsDir = path.join(__dirname, 'uploads');

console.log('🔍 Проверка отсутствующих файлов схем вылета стрелы...\n');
console.log(`📁 Папка uploads: ${uploadsDir}\n`);

// Проверяем существование папки uploads
if (!fs.existsSync(uploadsDir)) {
  console.error('❌ Папка uploads не существует!');
  process.exit(1);
}

// Получаем все услуги с схемами вылета стрелы
db.all('SELECT id, title, url, reach_diagrams, reach_diagram_url FROM services WHERE active = 1', [], (err, services) => {
  if (err) {
    console.error('❌ Ошибка при получении услуг:', err);
    db.close();
    process.exit(1);
  }
  
  if (services.length === 0) {
    console.log('⚠️  Активных услуг не найдено');
    db.close();
    process.exit(0);
  }
  
  console.log(`📊 Найдено активных услуг: ${services.length}\n`);
  
  let totalDiagrams = 0;
  let missingFiles = [];
  let foundFiles = [];
  
  services.forEach(service => {
    let diagrams = [];
    
    // Парсим reach_diagrams (новый формат)
    if (service.reach_diagrams && service.reach_diagrams.trim()) {
      try {
        const parsed = JSON.parse(service.reach_diagrams);
        if (Array.isArray(parsed)) {
          diagrams = parsed.map(d => {
            if (typeof d === 'string') {
              return { url: d, title: 'Схема вылета стрелы' };
            }
            return { url: d.url || d, title: d.title || 'Схема вылета стрелы' };
          });
        }
      } catch (e) {
        console.error(`⚠️  Ошибка парсинга reach_diagrams для услуги ${service.id}:`, e.message);
      }
    }
    
    // Добавляем reach_diagram_url (старый формат)
    if (service.reach_diagram_url && service.reach_diagram_url.trim()) {
      const url = service.reach_diagram_url.trim();
      if (!diagrams.some(d => d.url === url)) {
        diagrams.push({ url: url, title: 'Схема вылета стрелы' });
      }
    }
    
    if (diagrams.length > 0) {
      totalDiagrams += diagrams.length;
      console.log(`📐 Услуга "${service.title}" (ID: ${service.id}):`);
      console.log(`   Схем: ${diagrams.length}`);
      
      diagrams.forEach((diagram, index) => {
        let filePath = diagram.url;
        
        // Убираем начальный слэш и префикс uploads/
        if (filePath.startsWith('/uploads/')) {
          filePath = filePath.substring('/uploads/'.length);
        } else if (filePath.startsWith('uploads/')) {
          filePath = filePath.substring('uploads/'.length);
        } else if (filePath.startsWith('/')) {
          filePath = filePath.substring(1);
        }
        
        const fullPath = path.join(uploadsDir, filePath);
        const exists = fs.existsSync(fullPath);
        
        if (exists) {
          const stats = fs.statSync(fullPath);
          console.log(`   ✅ ${index + 1}. ${filePath} (${(stats.size / 1024).toFixed(2)} KB)`);
          foundFiles.push({ service: service.title, file: filePath, path: fullPath });
        } else {
          console.log(`   ❌ ${index + 1}. ${filePath} - ФАЙЛ НЕ НАЙДЕН`);
          missingFiles.push({ 
            service: service.title, 
            serviceId: service.id,
            file: filePath, 
            url: diagram.url,
            title: diagram.title 
          });
          
          // Проверяем альтернативные расширения
          const baseName = path.parse(filePath).name;
          const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          let foundAlternative = false;
          
          for (const ext of extensions) {
            const altPath = path.join(uploadsDir, baseName + ext);
            if (fs.existsSync(altPath)) {
              console.log(`      💡 Найден альтернативный файл: ${baseName}${ext}`);
              foundAlternative = true;
              break;
            }
          }
          
          if (!foundAlternative) {
            // Ищем файлы с похожим именем
            try {
              const files = fs.readdirSync(uploadsDir);
              const similarFiles = files.filter(f => f.includes(baseName.substring(0, 10)));
              if (similarFiles.length > 0) {
                console.log(`      💡 Похожие файлы: ${similarFiles.join(', ')}`);
              }
            } catch (e) {
              // Игнорируем ошибки чтения директории
            }
          }
        }
      });
      console.log('');
    }
  });
  
  console.log('\n📊 Итоговая статистика:');
  console.log(`   Всего схем: ${totalDiagrams}`);
  console.log(`   ✅ Найдено файлов: ${foundFiles.length}`);
  console.log(`   ❌ Отсутствует файлов: ${missingFiles.length}`);
  
  if (missingFiles.length > 0) {
    console.log('\n❌ Отсутствующие файлы:');
    missingFiles.forEach((item, index) => {
      console.log(`   ${index + 1}. Услуга: "${item.service}" (ID: ${item.serviceId})`);
      console.log(`      Файл: ${item.file}`);
      console.log(`      URL в БД: ${item.url}`);
    });
    
    console.log('\n💡 Рекомендации:');
    console.log('   1. Проверьте, были ли файлы загружены на сервер');
    console.log('   2. Если файлы есть в бэкапе, восстановите их:');
    console.log('      node restore-all-images-and-diagrams.js "/path/to/backup.db"');
    console.log('   3. Или загрузите схемы заново через админ-панель');
  } else {
    console.log('\n✅ Все файлы схем вылета стрелы найдены!');
  }
  
  db.close();
  process.exit(0);
});
