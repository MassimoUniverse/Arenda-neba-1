const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Путь к текущей базе
const currentDbPath = path.join(__dirname, 'database.db');

// Если путь к бэкапу указан в аргументах
let backupDbPath = process.argv[2];

// Если путь не указан, ищем бэкап в разных возможных местах
if (!backupDbPath) {
  const possibleBackupPaths = [
    path.join(__dirname, 'database.db.backup'),
    path.join(__dirname, '..', 'backups', 'slightly done', 'database.db'),
    path.join(__dirname, '..', '..', 'backups', 'slightly done', 'database.db'),
    path.join('/opt', 'backups', 'slightly done', 'database.db'),
    path.join('/root', 'backups', 'slightly done', 'database.db'),
    path.join(__dirname, '..', 'slightly done', 'database.db'),
  ];

  for (const possiblePath of possibleBackupPaths) {
    if (fs.existsSync(possiblePath)) {
      backupDbPath = possiblePath;
      console.log('✅ Бэкап найден:', backupDbPath);
      break;
    }
  }
}

if (!backupDbPath || !fs.existsSync(backupDbPath)) {
  console.error('❌ Бэкап не найден в стандартных местах');
  console.log('\n📋 Ищем доступные бэкапы...');
  
  const possibleBackupDirs = [
    path.join(__dirname, '..', 'backups'),
    path.join(__dirname, '..', '..', 'backups'),
    '/opt/backups',
    '/root/backups',
    __dirname,
  ];
  
  let foundAny = false;
  for (const backupDir of possibleBackupDirs) {
    if (fs.existsSync(backupDir)) {
      console.log(`\n📁 Проверяем: ${backupDir}`);
      try {
        const items = fs.readdirSync(backupDir);
        items.forEach(item => {
          const itemPath = path.join(backupDir, item);
          if (fs.statSync(itemPath).isFile() && item.includes('database') && item.includes('backup')) {
            console.log(`   ✅ ${item}`);
            foundAny = true;
          } else if (fs.statSync(itemPath).isDirectory()) {
            const dbPath = path.join(itemPath, 'database.db');
            if (fs.existsSync(dbPath)) {
              console.log(`   ✅ ${item}/database.db`);
              foundAny = true;
            }
          }
        });
      } catch (e) {
        // Игнорируем ошибки доступа
      }
    }
  }
  
  if (!foundAny) {
    console.log('\n❌ Бэкапы не найдены.');
  }
  
  console.log('\n💡 Укажите путь к бэкапу вручную:');
  console.log('   node restore-all-images-and-diagrams.js /path/to/backup/database.db');
  console.log('\n   Или скопируйте бэкап в одно из мест:');
  [
    path.join(__dirname, 'database.db.backup'),
    path.join(__dirname, '..', 'backups', 'slightly done', 'database.db'),
  ].forEach(p => console.log(`   - ${p}`));
  
  process.exit(1);
}

console.log('📦 Восстановление изображений и схем вылета стрелы из бэкапа...\n');
console.log('📂 Используем бэкап:', backupDbPath);

// Открываем бэкап
const backupDb = new sqlite3.Database(backupDbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Ошибка открытия бэкапа:', err.message);
    process.exit(1);
  }
  console.log('✅ Бэкап открыт');
});

// Проверяем наличие текущей базы
if (!fs.existsSync(currentDbPath)) {
  console.error('❌ База данных не найдена:', currentDbPath);
  console.log('\n💡 Запустите сначала: node init-database-safe.js');
  backupDb.close();
  process.exit(1);
}

// Открываем текущую базу
const currentDb = new sqlite3.Database(currentDbPath, (err) => {
  if (err) {
    console.error('❌ Ошибка открытия текущей БД:', err.message);
    backupDb.close();
    process.exit(1);
  }
  console.log('✅ Текущая БД открыта\n');
});

// Сначала проверяем, есть ли таблица services в бэкапе
backupDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name='services'", [], (err, tables) => {
  if (err) {
    console.error('❌ Ошибка проверки таблиц:', err.message);
    backupDb.close();
    currentDb.close();
    return;
  }
  
  if (tables.length === 0) {
    console.error('❌ Таблица "services" не найдена в бэкапе!');
    console.log('\n💡 Возможные варианты:');
    console.log('   1. Проверьте структуру бэкапа: node check-backup-structure.js ' + backupDbPath);
    console.log('   2. Используйте другой бэкап');
    console.log('   3. Восстановите данные вручную через админ-панель');
    backupDb.close();
    currentDb.close();
    return;
  }
  
  // Получаем данные из бэкапа
  backupDb.all('SELECT id, title, url, image_url, images, reach_diagrams, reach_diagram_url FROM services WHERE active = 1', [], (err, backupRows) => {
    if (err) {
      console.error('❌ Ошибка чтения бэкапа:', err.message);
      backupDb.close();
      currentDb.close();
      return;
    }

  console.log(`📊 Найдено услуг в бэкапе: ${backupRows.length}\n`);

  // Получаем текущие данные
  currentDb.all('SELECT id, title, url FROM services WHERE active = 1', [], (err, currentRows) => {
    if (err) {
      console.error('❌ Ошибка чтения текущей БД:', err.message);
      backupDb.close();
      currentDb.close();
      return;
    }

    let restoredImages = 0;
    let restoredDiagrams = 0;
    let skipped = 0;
    let notFound = 0;

    // Создаем мапу текущих услуг по URL
    const currentMap = new Map();
    currentRows.forEach(row => {
      currentMap.set(row.url, row);
    });

    // Восстанавливаем данные
    backupRows.forEach((backupRow) => {
      const currentRow = currentMap.get(backupRow.url);
      
      if (!currentRow) {
        notFound++;
        console.log(`⚠️  Не найдено в текущей БД: ${backupRow.title} (${backupRow.url})`);
        return;
      }

      let hasUpdates = false;
      const updates = {};
      
      // Восстанавливаем image_url
      if (backupRow.image_url && backupRow.image_url.trim()) {
        updates.image_url = backupRow.image_url;
        hasUpdates = true;
        restoredImages++;
        console.log(`📸 Восстановлено изображение: ${backupRow.title}`);
      }
      
      // Восстанавливаем images (массив изображений)
      if (backupRow.images && backupRow.images.trim()) {
        updates.images = backupRow.images;
        hasUpdates = true;
        if (!updates.image_url) {
          restoredImages++;
          console.log(`📸 Восстановлен массив изображений: ${backupRow.title}`);
        }
      }
      
      // Восстанавливаем схемы вылета стрелы
      let diagrams = [];
      let hasDiagrams = false;

      // Проверяем reach_diagrams (новый формат)
      if (backupRow.reach_diagrams && backupRow.reach_diagrams.trim()) {
        try {
          const parsed = JSON.parse(backupRow.reach_diagrams);
          if (Array.isArray(parsed) && parsed.length > 0) {
            diagrams = parsed;
            hasDiagrams = true;
          }
        } catch (e) {
          // Не JSON
        }
      }

      // Проверяем reach_diagram_url (старый формат)
      if (!hasDiagrams && backupRow.reach_diagram_url && backupRow.reach_diagram_url.trim()) {
        diagrams = [{ url: backupRow.reach_diagram_url, title: 'Схема вылета стрелы' }];
        hasDiagrams = true;
      }

      if (hasDiagrams) {
        const diagramsJson = JSON.stringify(diagrams);
        updates.reach_diagrams = diagramsJson;
        updates.reach_diagram_url = diagrams.length > 0 ? (typeof diagrams[0] === 'string' ? diagrams[0] : diagrams[0].url) : '';
        hasUpdates = true;
        restoredDiagrams++;
        console.log(`📐 Восстановлены схемы: ${backupRow.title} (${diagrams.length} схем)`);
      }

      if (!hasUpdates) {
        skipped++;
        return;
      }

      // Формируем SQL запрос для обновления
      const updateFields = [];
      const updateValues = [];
      
      if (updates.image_url) {
        updateFields.push('image_url = ?');
        updateValues.push(updates.image_url);
      }
      
      if (updates.images) {
        updateFields.push('images = ?');
        updateValues.push(updates.images);
      }
      
      if (updates.reach_diagrams) {
        updateFields.push('reach_diagrams = ?');
        updateValues.push(updates.reach_diagrams);
      }
      
      if (updates.reach_diagram_url) {
        updateFields.push('reach_diagram_url = ?');
        updateValues.push(updates.reach_diagram_url);
      }
      
      // Добавляем updated_at для обновления кэша
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      updateValues.push(currentRow.id);

      // Обновляем текущую БД
      const sql = `UPDATE services SET ${updateFields.join(', ')} WHERE id = ?`;
      currentDb.run(sql, updateValues, (err) => {
        if (err) {
          console.error(`❌ Ошибка обновления ${backupRow.title}:`, err.message);
        }
      });
    });

    // Ждем завершения всех обновлений
    setTimeout(() => {
      console.log('\n📈 Итого:');
      console.log(`   📸 Восстановлено изображений: ${restoredImages}`);
      console.log(`   📐 Восстановлено схем: ${restoredDiagrams}`);
      console.log(`   ⏭️  Пропущено (нет данных): ${skipped}`);
      console.log(`   ⚠️  Не найдено: ${notFound}`);
      console.log(`   📊 Всего обработано: ${backupRows.length}\n`);

      backupDb.close();
      currentDb.close();
      console.log('✅ Готово!');
      console.log('\n🔄 Теперь перегенерируйте страницы автовышек через админ-панель');
      console.log('   или перезапустите приложение: pm2 restart arenda-neba');
    }, 2000);
  });
  });
});
