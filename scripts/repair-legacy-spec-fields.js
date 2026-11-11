// Пересчитывает служебные поля техники (высота, вылет, грузоподъёмность…) из списка характеристик.
// Нужен один раз после перехода на расчёт этих полей на сервере (lib/spec-fields.js): в базе
// остались значения, которые старая админка заполнила с ошибками.
//
//   node scripts/repair-legacy-spec-fields.js            — только показать, что изменится
//   node scripts/repair-legacy-spec-fields.js --apply    — записать в базу
//   node scripts/repair-legacy-spec-fields.js --db <путь> [--apply]   — другая база (для проверки на копии)
//
// Технику без списка характеристик не трогает. Поле updated_at не меняет.

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { LEGACY_SPEC_FIELDS, deriveLegacySpecFields } = require('../lib/spec-fields');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dbArg = args.indexOf('--db');
const dbPath = dbArg >= 0 ? args[dbArg + 1] : path.join(__dirname, '..', 'database.db');

const db = new sqlite3.Database(dbPath);
db.all(`SELECT id, title, custom_specs, ${LEGACY_SPEC_FIELDS.join(', ')} FROM services ORDER BY order_num`, [], (err, rows) => {
  if (err) { console.error('Ошибка чтения базы:', err.message); process.exit(1); }
  const updates = [];
  rows.forEach((row) => {
    let specs = [];
    try { specs = JSON.parse(row.custom_specs || '[]'); } catch (e) { specs = []; }
    if (!Array.isArray(specs) || !specs.length) {
      console.log(`${row.id} ${row.title}: характеристик нет — пропускаю`);
      return;
    }
    const derived = deriveLegacySpecFields(specs);
    const changed = LEGACY_SPEC_FIELDS.filter((f) => String(row[f] || '') !== derived[f]);
    if (!changed.length) {
      console.log(`${row.id} ${row.title}: без изменений`);
      return;
    }
    console.log(`${row.id} ${row.title}:`);
    changed.forEach((f) => console.log(`    ${f}: ${JSON.stringify(row[f] || '')} -> ${JSON.stringify(derived[f])}`));
    updates.push({ id: row.id, derived });
  });

  if (!apply) {
    console.log(`\nИзменилось бы записей: ${updates.length}. Это пробный запуск; для записи добавьте --apply.`);
    db.close();
    return;
  }
  if (!updates.length) { console.log('\nМенять нечего.'); db.close(); return; }

  const sql = `UPDATE services SET ${LEGACY_SPEC_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`;
  db.serialize(() => {
    updates.forEach((u) => {
      db.run(sql, [...LEGACY_SPEC_FIELDS.map((f) => u.derived[f]), u.id], (e) => {
        if (e) console.error(`Ошибка записи ${u.id}:`, e.message);
      });
    });
    db.close(() => console.log(`\nЗаписано записей: ${updates.length}.`));
  });
});
