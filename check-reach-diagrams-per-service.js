const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🔍 Проверка схем вылета стрелы для каждой услуги...\n');

db.all('SELECT id, title, url, reach_diagrams, reach_diagram_url FROM services WHERE active = 1 ORDER BY id', [], (err, services) => {
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
  
  const diagramsMap = new Map(); // Для поиска дубликатов
  const servicesWithDiagrams = [];
  const servicesWithoutDiagrams = [];
  const duplicateDiagrams = [];
  
  services.forEach(service => {
    let diagrams = [];
    let diagramsStr = '';
    
    // Парсим reach_diagrams (новый формат)
    if (service.reach_diagrams && service.reach_diagrams.trim()) {
      try {
        const parsed = JSON.parse(service.reach_diagrams);
        if (Array.isArray(parsed) && parsed.length > 0) {
          diagrams = parsed.map(d => {
            if (typeof d === 'string') return d;
            return d.url || d;
          });
          diagramsStr = JSON.stringify(diagrams.sort());
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }
    
    // Добавляем reach_diagram_url (старый формат)
    if (diagrams.length === 0 && service.reach_diagram_url && service.reach_diagram_url.trim()) {
      diagrams = [service.reach_diagram_url.trim()];
      diagramsStr = JSON.stringify(diagrams);
    }
    
    if (diagrams.length > 0) {
      servicesWithDiagrams.push({
        id: service.id,
        title: service.title,
        url: service.url,
        diagrams: diagrams,
        diagramsStr: diagramsStr
      });
      
      // Проверяем на дубликаты
      if (diagramsMap.has(diagramsStr)) {
        duplicateDiagrams.push({
          service1: diagramsMap.get(diagramsStr),
          service2: { id: service.id, title: service.title, url: service.url },
          diagrams: diagrams
        });
      } else {
        diagramsMap.set(diagramsStr, { id: service.id, title: service.title, url: service.url });
      }
    } else {
      servicesWithoutDiagrams.push({
        id: service.id,
        title: service.title,
        url: service.url
      });
    }
  });
  
  console.log('📊 Статистика:');
  console.log(`   ✅ Услуг со схемами: ${servicesWithDiagrams.length}`);
  console.log(`   ❌ Услуг без схем: ${servicesWithoutDiagrams.length}`);
  console.log(`   ⚠️  Дубликаты схем: ${duplicateDiagrams.length}\n`);
  
  if (duplicateDiagrams.length > 0) {
    console.log('❌ НАЙДЕНЫ ДУБЛИКАТЫ СХЕМ:\n');
    duplicateDiagrams.forEach((dup, index) => {
      console.log(`   ${index + 1}. Одинаковые схемы у:`);
      console.log(`      - "${dup.service1.title}" (ID: ${dup.service1.id}, URL: ${dup.service1.url})`);
      console.log(`      - "${dup.service2.title}" (ID: ${dup.service2.id}, URL: ${dup.service2.url})`);
      console.log(`      Схемы: ${dup.diagrams.map(d => typeof d === 'string' ? d : d.url || d).join(', ')}\n`);
    });
    
    console.log('💡 Рекомендации:');
    console.log('   1. У каждой услуги должны быть свои уникальные схемы вылета стрелы');
    console.log('   2. Загрузите правильные схемы для каждой услуги через админ-панель');
    console.log('   3. Или восстановите схемы из бэкапа, если они там есть');
  } else if (servicesWithDiagrams.length > 0) {
    console.log('✅ Все услуги имеют уникальные схемы!\n');
    console.log('📋 Схемы по услугам:');
    servicesWithDiagrams.forEach(service => {
      console.log(`\n   ${service.title} (ID: ${service.id}):`);
      service.diagrams.forEach((diagram, index) => {
        const url = typeof diagram === 'string' ? diagram : diagram.url || diagram;
        console.log(`      ${index + 1}. ${url}`);
      });
    });
  }
  
  if (servicesWithoutDiagrams.length > 0) {
    console.log('\n⚠️  Услуги без схем вылета стрелы:');
    servicesWithoutDiagrams.forEach(service => {
      console.log(`   - "${service.title}" (ID: ${service.id}, URL: ${service.url})`);
    });
  }
  
  db.close();
  process.exit(0);
});
