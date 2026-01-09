const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const iconv = require('iconv-lite');

// Подключение к базе данных
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Функция fixEncoding из server.js
function fixEncoding(text) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    let fixed = text;
    
    // Универсальная функция для удаления искаженных последовательностей
    const removeCorruptedSequences = (str) => {
      // Удаляем последовательности типа: РС"РС, PjPC-PC, PC"PC и т.д.
      str = str.replace(/[РС]"[РС][^А-Яа-яЁё\s]*/g, '');
      str = str.replace(/P[SCj]PC[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
      str = str.replace(/\[PjPC[^\]]*\][^А-Яа-яЁё\s]*/g, '');
      
      // Удаляем последовательности после нормальных слов, которые содержат искаженные символы
      str = str.replace(/([А-Яа-яЁёA-Za-z0-9]+)[РС"РС•РС\-\[\],\sPjPC-PC[•P\sB»\-\[\],]+/g, '$1');
      
      // Удаляем последовательности, которые начинаются с квадратных скобок и содержат искаженные символы
      str = str.replace(/\[[^\]]*[РСPjPC][^\]]*\][\s,•\-]*/g, '');
      
      // Удаляем последовательности с повторяющимися РС, PC, PjPC
      str = str.replace(/[РС]{2,}[^А-Яа-яЁё\s]*/g, '');
      str = str.replace(/P[SCj]{2,}P[SCj]*[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
      
      // Удаляем последовательности с кавычками и спецсимволами после кириллических букв Р и С
      str = str.replace(/[РС]"[РС][•\-\[\],\s]*/g, '');
      str = str.replace(/[РС]•[РС][\-\[\],\s]*/g, '');
      
      return str;
    };
    
    // Применяем универсальную очистку
    fixed = removeCorruptedSequences(fixed);
    
    // Проверяем, есть ли признаки неправильной кодировки
    const hasBadEncoding = /Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /РІ,Р/.test(fixed) || 
                          /Р\s+[Р-Я]/.test(fixed) || /С\s+[Р-Я]/.test(fixed) ||
                          /P[SC]P/.test(fixed) || /PC"PC/.test(fixed) || /PµPSP/.test(fixed) ||
                          /CЋСЂС‹/.test(fixed) || /PSCЂP/.test(fixed) || /CŕP»/.test(fixed) ||
                          /РС"РС/.test(fixed) || /PjPC-PC/.test(fixed);
    
    if (hasBadEncoding) {
      // Удаляем пробелы между символами
      fixed = fixed.replace(/([Р-Я])\s+([Р-Я])/g, '$1$2');
      fixed = fixed.replace(/([PC])\s+([PC])/g, '$1$2');
      
      // Удаляем проблемные последовательности перед декодированием
      fixed = fixed.replace(/PC"PC[PC\s-\[\],•]*/g, '');
      fixed = fixed.replace(/РС"РС[•РС\-\[\],\s]*/g, '');
      fixed = fixed.replace(/\[PjPC-PC[•P\sB»\-\[\],]*/g, '');
      fixed = fixed.replace(/PjPC-PC[•P\sB»\-\[\],]*/g, '');
      fixed = fixed.replace(/PSCЂP[°PSPJPµPIP°CЏ\s]*/g, '');
      fixed = fixed.replace(/CŕP»CFCFC/g, '');
      fixed = fixed.replace(/PµPSP[°\s]*PsP[+CЂР°P+PSC,\s]*/g, '');
      fixed = fixed.replace(/PëCЃPEP°PJPµPSPSPsPiPs\s*C/g, '');
      fixed = fixed.replace(/,PµPECЃC,\s*Po/g, '');
      fixed = fixed.replace(/C,CЋСЂС‹,/g, '');
      
      // Пробуем исправить через декодирование из latin1 в utf8
      try {
        const buffer = Buffer.from(fixed, 'latin1');
        const decoded = buffer.toString('utf8');
        if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded) && !/P[SC]P/.test(decoded)) {
          fixed = decoded;
        }
      } catch (e) {
        // Игнорируем ошибки
      }
      
      // Если все еще есть проблемы, пробуем через win1251
      if (/Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /Р\s+[Р-Я]/.test(fixed) || /P[SC]P/.test(fixed)) {
        try {
          let cleaned = fixed.replace(/([Р-Я])\s+([Р-Я])/g, '$1$2');
          cleaned = cleaned.replace(/([PC])\s+([PC])/g, '$1$2');
          cleaned = cleaned.replace(/PC"PC[PC\s-\[\],]*/g, '');
          cleaned = cleaned.replace(/P[SC]P[°µPSPJPIPCЏ\s]*/g, '');
          
          const utf8Bytes = Buffer.from(cleaned, 'utf8');
          const decoded = iconv.decode(utf8Bytes, 'win1251');
          if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded) && !/P[SC]P/.test(decoded)) {
            fixed = decoded;
          }
        } catch (e) {
          // Игнорируем ошибки
        }
      }
    }
    
    // Исправляем различные варианты неправильной кодировки "₽/смена"
    fixed = fixed.replace(/в,Ѕ\/смена/gi, '₽/смена');
    fixed = fixed.replace(/Р\/смена/gi, '₽/смена');
    fixed = fixed.replace(/в,Ѕ\/СЃРјРµРЅа/gi, '₽/смена');
    fixed = fixed.replace(/в,Ѕ\/СЃРјРµРЅР°/gi, '₽/смена');
    fixed = fixed.replace(/в,Ѕ\/СЃРмРµРЅ/gi, '₽/смен');
    fixed = fixed.replace(/СЃРјРµРЅа/gi, 'смена');
    fixed = fixed.replace(/СЃРмРµРЅР°/gi, 'смена');
    fixed = fixed.replace(/СЃРмРµРЅ/gi, 'смен');
    
    // Исправляем только символ рубля
    fixed = fixed.replace(/в,Ѕ/gi, '₽');
    fixed = fixed.replace(/Р\//g, '₽/');
    
    // Исправляем другие проблемные последовательности
    fixed = fixed.replace(/РІ,Р/gi, '₽');
    fixed = fixed.replace(/РІ,РЅ/gi, '₽');
    
    // Проверяем, есть ли признаки двойной кодировки
    const hasDoubleEncoding = /Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /Р\s+[Р-Я]/.test(fixed);
    
    if (hasDoubleEncoding) {
      fixed = fixed.replace(/([Р-Я])\s+([Р-Я])/g, '$1$2');
      
      try {
        const utf8Bytes = Buffer.from(fixed, 'utf8');
        const decoded = iconv.decode(utf8Bytes, 'win1251');
        if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded)) {
          fixed = decoded;
        }
      } catch (e) {
        // Игнорируем ошибки
      }
      
      if (/Р[Р-Я]/.test(fixed) || /Р\s+[Р-Я]/.test(fixed)) {
        try {
          const buffer = Buffer.from(fixed, 'latin1');
          const decoded = buffer.toString('utf8');
          if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded)) {
            fixed = decoded;
          }
        } catch (e2) {
          // Игнорируем ошибки
        }
      }
    }
    
    // Финальная проверка - если все еще есть искаженные символы
    const stillHasBadEncoding = /Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /Р\s+[Р-Я]/.test(fixed) || 
                                /РЎР/.test(fixed) || /PC"PC/.test(fixed) || /P[SC]P/.test(fixed) ||
                                /PµPSP/.test(fixed) || /CЋСЂС‹/.test(fixed) || /PSCЂP/.test(fixed) ||
                                /CŕP»/.test(fixed) || /PëCЃ/.test(fixed) ||
                                /РС"РС/.test(fixed) || /PjPC-PC/.test(fixed);
    
    if (stillHasBadEncoding) {
      let cleaned = fixed.replace(/([Р-Я])\s+([Р-Я])/g, '$1$2');
      cleaned = cleaned.replace(/([PC])\s+([PC])/g, '$1$2');
      cleaned = cleaned.replace(/PC"PC[PC\s-\[\],•]*/g, '');
      cleaned = cleaned.replace(/РС"РС[•РС\-\[\],\s]*/g, '');
      cleaned = cleaned.replace(/\[PjPC-PC[•P\sB»\-\[\],]*/g, '');
      cleaned = cleaned.replace(/PjPC-PC[•P\sB»\-\[\],]*/g, '');
      cleaned = cleaned.replace(/PSCЂP[°PSPJPµPIP°CЏ\s]*/g, '');
      cleaned = cleaned.replace(/CŕP»CFCFC/g, '');
      cleaned = cleaned.replace(/PµPSP[°\s]*PsP[+CЂР°P+PSC,\s]*/g, '');
      cleaned = cleaned.replace(/PëCЃPEP°PJPµPSPSPsPiPs\s*C/g, '');
      cleaned = cleaned.replace(/,PµPECЃC,\s*Po/g, '');
      cleaned = cleaned.replace(/C,CЋСЂС‹,/g, '');
      cleaned = cleaned.replace(/РЎР\s*ВµР\s*В»Р\s*ВµРЎРѓ/g, 'Телескопический');
      cleaned = cleaned.replace(/Телескопический[РС"РС•РС\-\[\],\s]*/gi, 'Телескопический');
      cleaned = cleaned.replace(/Телескопический\[PjPC-PC[•P\sB»\-\[\],]*/gi, 'Телескопический');
      
      // Пробуем разные варианты декодирования
      const attempts = [
        () => {
          const buf = Buffer.from(cleaned, 'utf8');
          return iconv.decode(buf, 'win1251');
        },
        () => {
          const buf = Buffer.from(cleaned, 'latin1');
          return buf.toString('utf8');
        },
        () => {
          return iconv.decode(Buffer.from(cleaned, 'utf8'), 'win1251');
        }
      ];
      
      for (const attempt of attempts) {
        try {
          const decoded = attempt();
          if (decoded && /[А-Яа-яЁё]/.test(decoded) && 
              !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded) && 
              !/PC"PC/.test(decoded) && !/P[SC]P/.test(decoded) &&
              !/PµPSP/.test(decoded) && !/CЋСЂС‹/.test(decoded)) {
            fixed = decoded;
            break;
          }
        } catch (e) {
          // Продолжаем попытки
        }
      }
      
      // Если все еще есть проблемные последовательности, удаляем их
      if (/РЎР/.test(fixed) || /PC"PC/.test(fixed) || /Р\s*ВµР/.test(fixed) || 
          /-],\s*\[PjPC/.test(fixed) || /P[SC]P/.test(fixed) || /PµPSP/.test(fixed) ||
          /CЋСЂС‹/.test(fixed) || /PSCЂP/.test(fixed) || /CŕP»/.test(fixed)) {
        fixed = fixed.replace(/РЎР\s*ВµР\s*В»Р\s*ВµРЎРѓ[PC"PC\s-\[\],•]*/gi, 'Телескопический');
        fixed = fixed.replace(/PC"PC[PC\s-\[\],•]*/gi, '');
        fixed = fixed.replace(/РС"РС[•РС\-\[\],\s]*/gi, '');
        fixed = fixed.replace(/\[PjPC-PC[•P\sB»\-\[\],]*/gi, '');
        fixed = fixed.replace(/PjPC-PC[•P\sB»\-\[\],]*/gi, '');
        fixed = fixed.replace(/Р\s*ВµР\s*В»Р\s*ВµРЎРѓ/gi, 'Телескопический');
        fixed = fixed.replace(/Р\s*ВµР\s*В»Р\s*ВµРЎРѓPC"PC-PC/gi, 'Телескопический');
        fixed = fixed.replace(/-],\s*\[PjPC-PC-Р\s*В»/gi, '');
        fixed = fixed.replace(/Телескопический[РС"РС•РС\-\[\],\s]*/gi, 'Телескопический');
        fixed = fixed.replace(/Телескопический\[PjPC-PC[•P\sB»\-\[\],]*/gi, 'Телескопический');
        fixed = fixed.replace(/C,CЋСЂС‹,\s*PSCЂP[°PSPJPµPIP°CЏ\s]*СЂР°PjPEP°\s*Pë\s*CŕP»CFCFC/gi, '');
        fixed = fixed.replace(/€PµPSP[°\s]*PsP[+CЂР°P+PSC,\s]*PEP°\s*PëCЃPEP°PJPµPSPSPsPiPs\s*C/gi, '');
        fixed = fixed.replace(/,PµPECЃC,\s*Po/gi, '');
        fixed = fixed.replace(/Р[СЎ]\s*Р\s*[Вµ]\s*Р\s*[В»]\s*Р\s*[Вµ]\s*Р[ЎС]\s*Р[Сѓ][PC"PC\s-\[\],•]*/gi, 'Телескопический');
        fixed = fixed.replace(/PC"PC-PC/gi, '');
        fixed = fixed.replace(/\[PjPC-PC-Р\s*В»/gi, '');
        fixed = fixed.replace(/P[SC]P[°µPSPJPIPCЏ\s]*/gi, '');
        fixed = fixed.replace(/PµPSP[°\s]*/gi, '');
        fixed = fixed.replace(/CЋСЂС‹/gi, '');
        fixed = fixed.replace(/PSCЂP[°PSPJPµPIP°CЏ\s]*/gi, '');
        fixed = fixed.replace(/CŕP»CFCFC/gi, '');
        fixed = fixed.replace(/PëCЃPEP°PJPµPSPSPsPiPs/gi, '');
        if (!/[А-Яа-яЁёA-Za-z0-9]/.test(fixed) && /[Р-ЯPSCµ€°]/.test(fixed)) {
          fixed = '';
        }
      }
    }
    
    // Финальная универсальная очистка - удаляем ВСЕ искаженные последовательности автоматически
    fixed = fixed.replace(/([А-Яа-яЁёA-Za-z0-9]+)([РС"РС•РС\-\[\],\sPjPC-PC[•P\sB»\-\[\],]+)/g, '$1');
    fixed = fixed.replace(/[РС]"[РС][^А-Яа-яЁё\s]*/g, '');
    fixed = fixed.replace(/P[SCj]PC[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
    fixed = fixed.replace(/\[[^\]]*[РСPjPC][^\]]*\][\s,•\-]*/g, '');
    fixed = fixed.replace(/[РС]{2,}[^А-Яа-яЁё\s]*/g, '');
    fixed = fixed.replace(/P[SCj]{2,}P[SCj]*[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
    fixed = fixed.replace(/[РС]"[РС]/g, '');
    fixed = fixed.replace(/PjPC-PC/g, '');
    fixed = fixed.replace(/PC"PC/g, '');
    fixed = fixed.replace(/[РСPjPC][•\-\[\],\s]+/g, '');
    
    // Финальная проверка: если остались только искаженные символы без нормального текста, удаляем их
    const cleanedParts = fixed.split(/([А-Яа-яЁёA-Za-z0-9]+)/);
    fixed = cleanedParts.filter(part => {
      if (/[А-Яа-яЁёA-Za-z0-9]/.test(part)) return true;
      if (/[РСPjPC•"\-\[\],]/.test(part) && !/[А-Яа-яЁёA-Za-z0-9]/.test(part)) return false;
      return true;
    }).join('');
    
    // Удаляем множественные пробелы
    fixed = fixed.replace(/\s{2,}/g, ' ').trim();
    
    return fixed;
  } catch (error) {
    return text;
  }
}

// Функция для обновления записей в таблице
function updateTable(tableName, textFields, callback) {
  console.log(`\n📋 Обработка таблицы: ${tableName}`);
  console.log(`   Текстовые поля: ${textFields.join(', ')}`);
  
  db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
    if (err) {
      console.error(`❌ Ошибка при чтении таблицы ${tableName}:`, err.message);
      callback(err);
      return;
    }
    
    if (rows.length === 0) {
      console.log(`   ℹ️  Таблица пуста, пропускаем`);
      callback(null, 0);
      return;
    }
    
    let updatedCount = 0;
    let processedCount = 0;
    const totalRows = rows.length;
    
    console.log(`   📊 Найдено записей: ${totalRows}`);
    
    rows.forEach((row, index) => {
      const updates = {};
      let hasChanges = false;
      
      // Обрабатываем каждое текстовое поле
      textFields.forEach(field => {
        if (row[field] !== null && row[field] !== undefined) {
          const original = String(row[field]);
          const fixed = fixEncoding(original);
          
          if (original !== fixed) {
            updates[field] = fixed;
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        // Формируем SQL запрос для обновления
        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(row.id); // Добавляем ID для WHERE условия
        
        db.run(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`, values, (err) => {
          processedCount++;
          
          if (err) {
            console.error(`   ❌ Ошибка при обновлении записи ID ${row.id}:`, err.message);
          } else {
            updatedCount++;
            if (updatedCount % 10 === 0) {
              console.log(`   ✅ Обновлено записей: ${updatedCount}/${totalRows}`);
            }
          }
          
          // Когда обработали все записи
          if (processedCount === totalRows) {
            console.log(`   ✅ Завершено. Обновлено записей: ${updatedCount} из ${totalRows}`);
            callback(null, updatedCount);
          }
        });
      } else {
        processedCount++;
        if (processedCount === totalRows) {
          console.log(`   ✅ Завершено. Обновлено записей: ${updatedCount} из ${totalRows}`);
          callback(null, updatedCount);
        }
      }
    });
  });
}

// Главная функция
function main() {
  console.log('🚀 Запуск массового исправления кодировки в базе данных');
  console.log('=' .repeat(60));
  
  // Определяем таблицы и их текстовые поля
  const tables = [
    {
      name: 'services',
      fields: [
        'title', 'subtitle', 'description', 'specifications', 'price',
        'height_lift', 'max_reach', 'max_capacity', 'lift_type',
        'transport_length', 'transport_height', 'width',
        'boom_rotation_angle', 'basket_rotation_angle'
      ]
    },
    {
      name: 'projects',
      fields: ['title', 'subtitle', 'description']
    },
    {
      name: 'reviews',
      fields: ['client_name', 'company', 'text']
    }
  ];
  
  let completedTables = 0;
  let totalUpdated = 0;
  
  // Обрабатываем каждую таблицу последовательно
  function processNextTable(index) {
    if (index >= tables.length) {
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Массовое исправление завершено!`);
      console.log(`   Всего обновлено записей: ${totalUpdated}`);
      db.close((err) => {
        if (err) {
          console.error('❌ Ошибка при закрытии базы данных:', err.message);
          process.exit(1);
        } else {
          console.log('✅ База данных закрыта');
          process.exit(0);
        }
      });
      return;
    }
    
    const table = tables[index];
    updateTable(table.name, table.fields, (err, updatedCount) => {
      if (err) {
        console.error(`❌ Ошибка при обработке таблицы ${table.name}:`, err.message);
        processNextTable(index + 1);
        return;
      }
      
      totalUpdated += updatedCount;
      completedTables++;
      processNextTable(index + 1);
    });
  }
  
  // Начинаем обработку
  processNextTable(0);
}

// Запускаем скрипт
main();
