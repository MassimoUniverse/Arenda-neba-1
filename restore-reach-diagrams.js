const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Путь к текущей базе
const currentDbPath = path.join(__dirname, 'database.db');

// Путь к бэкапу "slightly done"
const backupDbPath = path.join(__dirname, '..', 'backups', 'slightly done', 'database.db');

if (!fs.existsSync(backupDbPath)) {
  console.error('❌ Бэкап не найден:', backupDbPath);
  console.log('\n📋 Доступные бэкапы:');
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (fs.existsSync(backupsDir)) {
    const dirs = fs.readdirSync(backupsDir);
    dirs.forEach(dir => {
      const dbPath = path.join(backupsDir, dir, 'database.db');
      if (fs.existsSync(dbPath)) {
        console.log(`   - ${dir}`);
      }
    });
  }
  process.exit(1);
}

console.log('📦 Восстановление схем вылета стрелы из бэкапа "slightly done"...\n');

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
  console.log('\n💡 Запустите сначала: node fix-database.js');
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

// Получаем данные из бэкапа
backupDb.all('SELECT id, title, url, reach_diagrams, reach_diagram_url FROM services WHERE active = 1', [], (err, backupRows) => {
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

    let restored = 0;
    let skipped = 0;
    let notFound = 0;

    // Создаем мапу текущих услуг по URL
    const currentMap = new Map();
    currentRows.forEach(row => {
      currentMap.set(row.url, row);
    });

    // Восстанавливаем схемы
    backupRows.forEach((backupRow) => {
      const currentRow = currentMap.get(backupRow.url);
      
      if (!currentRow) {
        notFound++;
        console.log(`⚠️  Не найдено в текущей БД: ${backupRow.title} (${backupRow.url})`);
        return;
      }

      let diagrams = [];
      let hasData = false;

      // Проверяем reach_diagrams (новый формат)
      if (backupRow.reach_diagrams && backupRow.reach_diagrams.trim()) {
        try {
          const parsed = JSON.parse(backupRow.reach_diagrams);
          if (Array.isArray(parsed) && parsed.length > 0) {
            diagrams = parsed;
            hasData = true;
          }
        } catch (e) {
          // Не JSON
        }
      }

      // Проверяем reach_diagram_url (старый формат)
      if (!hasData && backupRow.reach_diagram_url && backupRow.reach_diagram_url.trim()) {
        diagrams = [{ url: backupRow.reach_diagram_url, title: 'Схема вылета стрелы' }];
        hasData = true;
      }

      if (!hasData) {
        skipped++;
        return;
      }

      // Обновляем текущую БД
      const diagramsJson = JSON.stringify(diagrams);
      const reachDiagramUrl = diagrams.length > 0 ? (typeof diagrams[0] === 'string' ? diagrams[0] : diagrams[0].url) : '';

      currentDb.run(
        'UPDATE services SET reach_diagrams = ?, reach_diagram_url = ? WHERE id = ?',
        [diagramsJson, reachDiagramUrl, currentRow.id],
        (err) => {
          if (err) {
            console.error(`❌ Ошибка обновления ${backupRow.title}:`, err.message);
          } else {
            restored++;
            console.log(`✅ Восстановлено: ${backupRow.title} (${diagrams.length} схем)`);
          }
        }
      );
    });

    // Ждем завершения всех обновлений
    setTimeout(() => {
      console.log('\n📈 Итого:');
      console.log(`   ✅ Восстановлено: ${restored}`);
      console.log(`   ⏭️  Пропущено (нет схем): ${skipped}`);
      console.log(`   ⚠️  Не найдено: ${notFound}`);
      console.log(`   📊 Всего обработано: ${backupRows.length}\n`);

      backupDb.close();
      currentDb.close();
      console.log('✅ Готово!');
    }, 2000);
  });
});

