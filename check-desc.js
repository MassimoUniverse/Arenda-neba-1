const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));
db.all('SELECT id, title, description FROM services WHERE active = 1 ORDER BY order_num', [], function(err, rows) {
  if (err) { console.error(err); process.exit(1); }
  rows.forEach(function(r) {
    console.log('ID ' + r.id + ' [' + r.title + ']: ' + r.description);
    console.log('---');
  });
  db.close();
});
