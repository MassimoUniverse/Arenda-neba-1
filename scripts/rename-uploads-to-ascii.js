/**
 * Переименование файлов в uploads/ (кириллица → латиница) и обновление путей в БД.
 * Сделайте копию database.db перед первым запуском.
 *
 * node scripts/rename-uploads-to-ascii.js           — переименовать + обновить БД
 * node scripts/rename-uploads-to-ascii.js --retry-db — только БД из .rename-upload-cache.json
 */
'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { slugifyAsciiFilename } = require('../lib/slugify-filename.js');

const CYR = /[\u0400-\u04FF]/;
const root = path.join(__dirname, '..');
const uploadsDir = path.join(root, 'uploads');
const publicDir = path.join(root, 'public');
const dbPath = path.join(root, 'database.db');
const cachePath = path.join(root, 'scripts', '.rename-upload-cache.json');

function uniqueName(dir, base, ext) {
  let name = base + ext;
  let n = 0;
  while (fs.existsSync(path.join(dir, name))) {
    n += 1;
    name = `${base}-${n}${ext}`;
  }
  return name;
}

function collectRenames(dir, urlPrefix, filterFn) {
  const pairs = [];
  if (!fs.existsSync(dir)) return pairs;
  for (const fname of fs.readdirSync(dir)) {
    if (!CYR.test(fname)) continue;
    if (filterFn && !filterFn(fname)) continue;
    const ext = path.extname(fname);
    const base = path.basename(fname, ext);
    let newBase = slugifyAsciiFilename(base, 80);
    if (!newBase || newBase === 'file') newBase = 'file-' + Date.now();
    const newName = uniqueName(dir, newBase, ext);
    const oldPath = path.join(dir, fname);
    const newPath = path.join(dir, newName);
    fs.renameSync(oldPath, newPath);
    console.log('Renamed:', fname, '->', newName);
    const oldUrl = urlPrefix + fname;
    const newUrl = urlPrefix + newName;
    pairs.push([oldUrl, newUrl]);
    pairs.push([oldUrl.replace(/^\//, ''), newUrl.replace(/^\//, '')]);
    try {
      const enc = urlPrefix + encodeURIComponent(fname);
      if (enc !== oldUrl) pairs.push([enc, newUrl]);
    } catch (e) { /* ignore */ }
  }
  return pairs;
}

function dedupePairs(pairs) {
  const m = new Map();
  for (const [a, b] of pairs) {
    if (a && b && a !== b) m.set(a, b);
  }
  return [...m.entries()].sort((x, y) => y[0].length - x[0].length);
}

function tableColumns(db, table) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((r) => r.name));
    });
  });
}

async function runUpdates(db, table, desiredCols, sorted) {
  const existing = await tableColumns(db, table);
  const cols = desiredCols.filter((c) => existing.includes(c));
  if (cols.length === 0) {
    console.warn(`Table ${table}: no matching columns, skip`);
    return;
  }

  const run = (sql, params) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

  for (const [oldS, newS] of sorted) {
    for (const col of cols) {
      const n = await run(
        `UPDATE ${table} SET ${col} = REPLACE(${col}, ?, ?) WHERE ${col} LIKE '%' || ? || '%'`,
        [oldS, newS, oldS]
      );
      if (n) console.log(`${table}.${col}: ${n} row(s)`);
    }
  }
}

async function main() {
  const retryDb = process.argv.includes('--retry-db');

  let sorted;
  if (retryDb) {
    if (!fs.existsSync(cachePath)) {
      console.error('No cache file. Run once without --retry-db or copy cache to', cachePath);
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    sorted = dedupePairs(raw.map(([a, b]) => [a, b]));
    console.log('Loaded pairs from', cachePath, 'count:', sorted.length);
  } else {
    const replacePairs = [];
    replacePairs.push(...collectRenames(uploadsDir, '/uploads/', null));
    replacePairs.push(
      ...collectRenames(publicDir, '/', (f) => /\.(mp4|webm|ogg)$/i.test(f))
    );
    sorted = dedupePairs(replacePairs);
    if (sorted.length > 0) {
      try {
        fs.mkdirSync(path.dirname(cachePath), { recursive: true });
        fs.writeFileSync(cachePath, JSON.stringify(sorted), 'utf8');
        console.log('Saved pair cache:', cachePath);
      } catch (e) {
        console.warn('Could not write cache:', e.message);
      }
    }
  }

  if (sorted.length === 0) {
    console.log('No URL replacement pairs.');
    return;
  }

  const db = new sqlite3.Database(dbPath);
  try {
    await runUpdates(
      db,
      'services',
      ['image_url', 'images', 'reach_diagram_url', 'reach_diagrams', 'description', 'specifications'],
      sorted
    );
    await runUpdates(db, 'reviews', ['image_url', 'text', 'review_text'], sorted);
    await runUpdates(db, 'content', ['description', 'image_url', 'title', 'subtitle'], sorted);
    await runUpdates(db, 'homepage', ['video_url'], sorted);
  } finally {
    await new Promise((resolve, reject) => db.close((err) => (err ? reject(err) : resolve())));
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
