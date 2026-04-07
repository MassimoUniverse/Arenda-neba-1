/**
 * Применяет data/equipment-custom-specs-preset.json к таблице services.
 * Запуск: node scripts/apply-equipment-specs-preset.js
 */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const root = path.join(__dirname, '..');
const dbPath = path.join(root, 'database.db');
const presetPath = path.join(root, 'data', 'equipment-custom-specs-preset.json');

function norm(s) {
  return (s || '').toLowerCase().replace(/ё/g, 'е');
}

function deriveLegacy(specs) {
  let height_lift = '';
  let max_reach = '';
  let max_capacity = '';
  let width = '';
  let transport_length = '';
  let transport_height = '';
  let lift_type = '';
  let boom_rotation_angle = '';
  let basket_rotation_angle = '';

  for (const row of specs) {
    const L = norm(row.label);
    const v = row.value || '';
    if ((L.includes('высота подъема') || L.includes('высота подъёма')) && !L.includes('транспорт')) height_lift = v;
    if (L.includes('вылет')) max_reach = v;
    if (
      !max_capacity &&
      (L.includes('грузоподъемность') || L.includes('грузоподъёмность')) &&
      !L.includes('лебедки') &&
      !L.includes('масса')
    ) {
      max_capacity = v;
    }
    if (L === 'ширина' || (L.startsWith('ширина') && !L.includes('транспорт'))) width = v;
    if (L.includes('длина в транспортном')) transport_length = v;
    if (L.includes('высота в транспортном')) transport_height = v;
    if (L.includes('тип подъ') || L.includes('тип подъе')) lift_type = v;
    if (L.includes('поворот') && L.includes('стрел')) boom_rotation_angle = v;
    if (L.includes('поворот') && (L.includes('корзин') || L.includes('люльки'))) basket_rotation_angle = v;
  }

  return {
    height_lift,
    max_reach,
    max_capacity,
    width,
    transport_length,
    transport_height,
    lift_type,
    boom_rotation_angle,
    basket_rotation_angle
  };
}

function cardBulletsFromSpecs(specs) {
  const lines = [];
  for (const row of specs) {
    const L = norm(row.label);
    if (L.includes('грузоподъемность') || L.includes('грузоподъёмность')) {
      if (L.includes('люльки') || L.includes('корзины') || L.includes('корзины')) {
        lines.push(`${row.label}: ${row.value}`);
        break;
      }
    }
  }
  if (!lines.length) {
    for (const row of specs) {
      const L = norm(row.label);
      if (L.includes('грузоподъемность') || L.includes('грузоподъёмность')) {
        lines.push(`${row.label}: ${row.value}`);
        break;
      }
    }
  }
  for (const row of specs) {
    const L = norm(row.label);
    if (L.includes('большая корзина') && L.includes('супердек')) {
      lines.push(`Размеры корзины (платформы): ${row.value}`);
      break;
    }
  }
  if (lines.length < 2) {
    for (const row of specs) {
      const L = norm(row.label);
      if (L.includes('размеры корзины')) {
        lines.push(`${row.label}: ${row.value}`);
        break;
      }
    }
  }
  return lines.slice(0, 2);
}

function main() {
  if (!fs.existsSync(dbPath)) {
    console.error('Нет database.db — запустите на сервере: cd /opt/arenda-neba && node scripts/apply-equipment-specs-preset.js');
    process.exit(1);
  }
  const preset = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
  const db = new sqlite3.Database(dbPath);

  db.all('SELECT id, title FROM services WHERE active = 1', [], (err, rows) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    const byTitle = {};
    rows.forEach((r) => {
      byTitle[r.title] = r.id;
    });

    const titles = Object.keys(preset);
    const missing = titles.filter((t) => !byTitle[t]);
    if (missing.length) console.warn('Не найдены по названию:', missing.join(', '));

    let idx = 0;
    function next() {
      if (idx >= titles.length) {
        db.close();
        console.log('\nГотово.');
        return;
      }
      const title = titles[idx++];
      const id = byTitle[title];
      if (!id) return next();

      const specs = preset[title];
      const json = JSON.stringify(specs);
      const leg = deriveLegacy(specs);
      const bullets = cardBulletsFromSpecs(specs);
      const cardJson = JSON.stringify(bullets);

      db.run(
        `UPDATE services SET
          custom_specs = ?,
          height_lift = ?, max_reach = ?, max_capacity = ?,
          width = ?, transport_length = ?, transport_height = ?,
          lift_type = ?, boom_rotation_angle = ?, basket_rotation_angle = ?,
          card_bullets = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          json,
          leg.height_lift,
          leg.max_reach,
          leg.max_capacity,
          leg.width,
          leg.transport_length,
          leg.transport_height,
          leg.lift_type,
          leg.boom_rotation_angle,
          leg.basket_rotation_angle,
          cardJson,
          id
        ],
        (e) => {
          if (e) console.error('Ошибка', title, e.message);
          else console.log('OK:', title);
          next();
        }
      );
    }
    next();
  });
}

main();
