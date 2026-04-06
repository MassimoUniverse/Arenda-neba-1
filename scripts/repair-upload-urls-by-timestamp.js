/**
 * Подставляет в БД актуальные имена файлов в /uploads/ по совпадению timestamp в имени
 * (после переименования кириллица→латиница на диске).
 *
 * node scripts/repair-upload-urls-by-timestamp.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const root = path.join(__dirname, '..');
const uploadsDir = path.join(root, 'uploads');
const dbPath = path.join(root, 'database.db');

const TS_RE = /-(\d{13,})\.[a-z0-9]+$/i;

function buildTimestampToFile() {
  const map = new Map();
  if (!fs.existsSync(uploadsDir)) return map;
  for (const f of fs.readdirSync(uploadsDir)) {
    const m = f.match(TS_RE);
    if (m) map.set(m[1], f);
  }
  return map;
}

function basenameFromUrl(u) {
  if (!u || typeof u !== 'string') return '';
  try {
    const noq = u.split('?')[0];
    const dec = decodeURIComponent(noq);
    return path.basename(dec);
  } catch (e) {
    return path.basename(u.split('?')[0]);
  }
}

function extractTs(fname) {
  const m = String(fname).match(TS_RE);
  return m ? m[1] : null;
}

async function tableColumns(db, table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((r) => r.name));
    });
  });
}

function collectBasenamesFromString(s, out) {
  if (!s || typeof s !== 'string') return;
  const re = /\/uploads\/[^\s"'<>?]+\.(jpg|jpeg|png|webp|JPG)/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    const full = m[0];
    out.add(basenameFromUrl(full));
  }
}

async function run() {
  const byTs = buildTimestampToFile();
  console.log('Timestamp index in uploads/:', byTs.size);

  const basenames = new Set();

  const db = new sqlite3.Database(dbPath);
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT image_url, images, reach_diagram_url, reach_diagrams, description, specifications FROM services', [], (e, r) =>
      e ? reject(e) : resolve(r || [])
    );
  });

  for (const row of rows) {
    if (row.image_url) basenames.add(basenameFromUrl(row.image_url));
    if (row.reach_diagram_url) basenames.add(basenameFromUrl(row.reach_diagram_url));
    if (row.images) {
      try {
        const arr = JSON.parse(row.images);
        if (Array.isArray(arr)) {
          for (const item of arr) {
            const u = typeof item === 'string' ? item : item && item.url;
            if (u) basenames.add(basenameFromUrl(u));
          }
        }
      } catch (e) { /* ignore */ }
    }
    collectBasenamesFromString(row.description || '', basenames);
    collectBasenamesFromString(row.specifications || '', basenames);
  }

  const revRows = await new Promise((resolve, reject) => {
    db.all('SELECT image_url, text FROM reviews', [], (e, r) => (e ? reject(e) : resolve(r || [])));
  });
  for (const row of revRows) {
    if (row.image_url) basenames.add(basenameFromUrl(row.image_url));
    collectBasenamesFromString(row.text || '', basenames);
  }

  const contentRows = await new Promise((resolve, reject) => {
    db.all('SELECT image_url, description, title, subtitle FROM content', [], (e, r) => (e ? reject(e) : resolve(r || [])));
  });
  for (const row of contentRows) {
    if (row.image_url) basenames.add(basenameFromUrl(row.image_url));
    collectBasenamesFromString((row.description || '') + (row.title || '') + (row.subtitle || ''), basenames);
  }

  const homeRows = await new Promise((resolve, reject) => {
    db.all('SELECT video_url FROM homepage', [], (e, r) => (e ? reject(e) : resolve(r || [])));
  });
  for (const row of homeRows) {
    if (row.video_url && row.video_url.includes('uploads')) basenames.add(basenameFromUrl(row.video_url));
  }

  const pairs = [];
  for (const base of basenames) {
    if (!base) continue;
    const ts = extractTs(base);
    if (!ts) continue;
    const newFile = byTs.get(ts);
    if (!newFile || base === newFile) continue;
    pairs.push(['/uploads/' + base, '/uploads/' + newFile]);
    pairs.push(['uploads/' + base, 'uploads/' + newFile]);
    try {
      pairs.push(['/uploads/' + encodeURIComponent(base), '/uploads/' + newFile]);
    } catch (e) { /* ignore */ }
  }

  const m = new Map();
  for (const [a, b] of pairs) {
    if (a && b && a !== b) m.set(a, b);
  }
  const sorted = [...m.entries()].sort((x, y) => y[0].length - x[0].length);
  console.log('Replacement pairs:', sorted.length);
  if (sorted.length === 0) {
    await new Promise((resolve, reject) => db.close((err) => (err ? reject(err) : resolve())));
    return;
  }

  const runSql = (sql, params) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

  async function runUpdates(table, desiredCols) {
    const existing = await tableColumns(db, table);
    const cols = desiredCols.filter((c) => existing.includes(c));
    for (const [oldS, newS] of sorted) {
      for (const col of cols) {
        const n = await runSql(
          `UPDATE ${table} SET ${col} = REPLACE(${col}, ?, ?) WHERE ${col} LIKE '%' || ? || '%'`,
          [oldS, newS, oldS]
        );
        if (n) console.log(`${table}.${col}: ${n}`);
      }
    }
  }

  try {
    await runUpdates('services', ['image_url', 'images', 'reach_diagram_url', 'reach_diagrams', 'description', 'specifications']);
    await runUpdates('reviews', ['image_url', 'text', 'review_text']);
    await runUpdates('content', ['description', 'image_url', 'title', 'subtitle']);
    await runUpdates('homepage', ['video_url']);
  } finally {
    await new Promise((resolve, reject) => db.close((err) => (err ? reject(err) : resolve())));
  }
  console.log('Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
