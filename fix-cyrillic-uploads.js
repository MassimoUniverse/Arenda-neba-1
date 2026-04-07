const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { slugifyAsciiFilename } = require('./lib/slugify-filename');

const uploadsDir = path.join(__dirname, 'uploads');
const db = new sqlite3.Database('./database.db');
const renames = {};

// 1. Переименовываем кириллические файлы в ASCII
const files = fs.readdirSync(uploadsDir);
for (const file of files) {
  if (file.split('').some(c => c.charCodeAt(0) > 127)) {
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const newBase = slugifyAsciiFilename(base);
    const newFile = newBase + ext.toLowerCase();
    const oldPath = path.join(uploadsDir, file);
    const newPath = path.join(uploadsDir, newFile);
    if (newFile === file) continue;
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(oldPath);
      console.log('Merged (dup):', file, '->', newFile);
    } else {
      fs.renameSync(oldPath, newPath);
      console.log('Renamed:', file, '->', newFile);
    }
    renames['/uploads/' + file] = '/uploads/' + newFile;
  }
}
console.log('Total renames:', Object.keys(renames).length);
if (Object.keys(renames).length === 0) { db.close(); process.exit(0); }

// 2. Обновляем пути в базе данных
const cols = ['image_url', 'images', 'reach_diagram_url', 'reach_diagrams'];
db.serialize(() => {
  db.all('SELECT id FROM services', (err, rows) => {
    rows.forEach(({ id }) => {
      cols.forEach(col => {
        db.get(`SELECT ${col} FROM services WHERE id=?`, [id], (e, r) => {
          if (!r || !r[col]) return;
          let val = r[col];
          let changed = false;
          for (const [oldUrl, newUrl] of Object.entries(renames)) {
            if (val.includes(oldUrl)) { val = val.split(oldUrl).join(newUrl); changed = true; }
          }
          if (changed) {
            db.run(`UPDATE services SET ${col}=? WHERE id=?`, [val, id]);
            console.log(`DB updated: service ${id} col=${col}`);
          }
        });
      });
    });
    setTimeout(() => { console.log('Done.'); db.close(); }, 2000);
  });
});
