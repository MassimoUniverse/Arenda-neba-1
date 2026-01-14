const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./database.db');

console.log('🔧 Исправление путей к схемам вылета стрелы в базе данных...\n');

db.serialize(() => {
  db.all('SELECT id, title, reach_diagrams, reach_diagram_url FROM services', [], (err, services) => {
    if (err) {
      console.error('❌ Ошибка при получении услуг:', err);
      db.close();
      return;
    }

    if (services.length === 0) {
      console.log('⚠️  Услуги не найдены в базе данных');
      db.close();
      return;
    }

    console.log(`📊 Найдено ${services.length} услуг для проверки\n`);

    let fixed = 0;
    let errors = 0;

    services.forEach((service) => {
      try {
        let needsUpdate = false;
        let fixedReachDiagrams = null;
        let fixedReachDiagramUrl = null;

        // Исправляем reach_diagrams (массив)
        if (service.reach_diagrams) {
          try {
            let diagrams = JSON.parse(service.reach_diagrams);
            if (Array.isArray(diagrams) && diagrams.length > 0) {
              const fixedDiagrams = diagrams.map(diagram => {
                let url = typeof diagram === 'string' ? diagram : (diagram.url || '');
                
                if (!url) return diagram;
                
                // Удаляем localhost
                url = url.replace(/http:\/\/localhost:\d+/g, '');
                url = url.replace(/https:\/\/localhost:\d+/g, '');
                url = url.replace(/http:\/\/127\.0\.0\.1:\d+/g, '');
                
                // Удаляем любой домен
                url = url.replace(/https?:\/\/[^\/]+/g, '');
                
                // Убеждаемся, что путь начинается с /
                if (url && !url.startsWith('/') && !url.startsWith('../')) {
                  url = '/' + url;
                }
                
                // Проверяем существование файла и конвертируем .png в .webp если нужно
                if (url.startsWith('/uploads/')) {
                  const filePath = path.join(__dirname, 'uploads', path.basename(url));
                  const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
                  
                  if (fs.existsSync(webpPath)) {
                    url = url.replace(/\.(png|jpg|jpeg)$/i, '.webp');
                  } else if (fs.existsSync(filePath)) {
                    // Файл существует, оставляем как есть
                  } else {
                    console.log(`⚠️  Файл не найден: ${url}`);
                  }
                }
                
                if (typeof diagram === 'string') {
                  return url;
                } else {
                  return { ...diagram, url: url };
                }
              });
              
              fixedReachDiagrams = JSON.stringify(fixedDiagrams);
              if (fixedReachDiagrams !== service.reach_diagrams) {
                needsUpdate = true;
                console.log(`✅ Исправлены схемы вылета для: ${service.title}`);
                console.log(`   Было: ${service.reach_diagrams.substring(0, 100)}...`);
                console.log(`   Стало: ${fixedReachDiagrams.substring(0, 100)}...`);
              }
            }
          } catch (e) {
            console.error(`❌ Ошибка парсинга reach_diagrams для "${service.title}":`, e.message);
          }
        }

        // Исправляем reach_diagram_url (старый формат)
        if (service.reach_diagram_url) {
          let url = service.reach_diagram_url;
          
          // Удаляем localhost
          url = url.replace(/http:\/\/localhost:\d+/g, '');
          url = url.replace(/https:\/\/localhost:\d+/g, '');
          url = url.replace(/http:\/\/127\.0\.0\.1:\d+/g, '');
          
          // Удаляем любой домен
          url = url.replace(/https?:\/\/[^\/]+/g, '');
          
          // Убеждаемся, что путь начинается с /
          if (url && !url.startsWith('/') && !url.startsWith('../')) {
            url = '/' + url;
          }
          
          // Проверяем существование файла и конвертируем .png в .webp если нужно
          if (url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, 'uploads', path.basename(url));
            const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            
            if (fs.existsSync(webpPath)) {
              url = url.replace(/\.(png|jpg|jpeg)$/i, '.webp');
            }
          }
          
          if (url !== service.reach_diagram_url) {
            fixedReachDiagramUrl = url;
            needsUpdate = true;
            console.log(`✅ Исправлен reach_diagram_url для: ${service.title}`);
            console.log(`   Было: ${service.reach_diagram_url}`);
            console.log(`   Стало: ${fixedReachDiagramUrl}`);
          }
        }

        // Обновляем запись в базе данных
        if (needsUpdate) {
          db.run(
            'UPDATE services SET reach_diagrams = ?, reach_diagram_url = ? WHERE id = ?',
            [
              fixedReachDiagrams !== null ? fixedReachDiagrams : service.reach_diagrams,
              fixedReachDiagramUrl !== null ? fixedReachDiagramUrl : service.reach_diagram_url,
              service.id
            ],
            function(updateErr) {
              if (updateErr) {
                console.error(`❌ Ошибка обновления "${service.title}":`, updateErr.message);
                errors++;
              } else {
                fixed++;
              }
            }
          );
        }
      } catch (error) {
        console.error(`❌ Ошибка при обработке "${service.title}":`, error.message);
        errors++;
      }
    });

    // Ждем завершения всех обновлений
    setTimeout(() => {
      console.log(`\n✅ Исправлено: ${fixed} записей`);
      if (errors > 0) {
        console.log(`❌ Ошибок: ${errors}`);
      }
      console.log('\n💾 База данных закрыта');
      db.close();
    }, 1000);
  });
});
