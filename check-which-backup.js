const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Пути к найденным базам
const databases = [
  { name: 'Текущая база', path: '/opt/arenda-neba/database.db' },
  { name: 'База в /root/New-arenda-neba', path: '/root/New-arenda-neba/database.db' },
];

console.log('🔍 Проверка баз данных на наличие схем вылета стрелы...\n');

let checked = 0;
databases.forEach((dbInfo, index) => {
  const db = new sqlite3.Database(dbInfo.path, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.log(`❌ ${dbInfo.name}: Не удалось открыть (${err.message})`);
      checked++;
      if (checked === databases.length) {
        process.exit(0);
      }
      return;
    }

    // Проверяем наличие таблицы services
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='services'", [], (err, row) => {
      if (err || !row) {
        console.log(`❌ ${dbInfo.name}: Таблица services не найдена`);
        db.close();
        checked++;
        if (checked === databases.length) {
          process.exit(0);
        }
        return;
      }

      // Проверяем схемы вылета стрелы
      db.all('SELECT id, title, url, reach_diagrams, reach_diagram_url FROM services WHERE active = 1', [], (err, rows) => {
        if (err) {
          console.log(`❌ ${dbInfo.name}: Ошибка при запросе (${err.message})`);
          db.close();
          checked++;
          if (checked === databases.length) {
            process.exit(0);
          }
          return;
        }

        console.log(`\n📊 ${dbInfo.name}:`);
        console.log(`   Путь: ${dbInfo.path}`);
        console.log(`   Услуг: ${rows.length}`);

        let withDiagrams = 0;
        let totalDiagrams = 0;

        rows.forEach(row => {
          let hasDiagrams = false;
          let count = 0;

          // Проверяем reach_diagrams
          if (row.reach_diagrams && row.reach_diagrams.trim()) {
            try {
              const parsed = JSON.parse(row.reach_diagrams);
              if (Array.isArray(parsed) && parsed.length > 0) {
                hasDiagrams = true;
                count = parsed.length;
              }
            } catch (e) {
              // Не JSON
            }
          }

          // Проверяем reach_diagram_url
          if (!hasDiagrams && row.reach_diagram_url && row.reach_diagram_url.trim()) {
            hasDiagrams = true;
            count = 1;
          }

          if (hasDiagrams) {
            withDiagrams++;
            totalDiagrams += count;
          }
        });

        console.log(`   Услуг со схемами: ${withDiagrams}`);
        console.log(`   Всего схем: ${totalDiagrams}`);

        if (withDiagrams > 0) {
          console.log(`   ✅ ЭТА БАЗА СОДЕРЖИТ СХЕМЫ!`);
        } else {
          console.log(`   ❌ Схемы не найдены`);
        }

        db.close();
        checked++;
        if (checked === databases.length) {
          console.log('\n💡 Используйте базу со схемами для восстановления:');
          console.log('   node restore-reach-diagrams.js /path/to/database.db');
          process.exit(0);
        }
      });
    });
  });
});

