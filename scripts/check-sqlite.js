
const Database = require('better-sqlite3');
const db = new Database('dev.db');

try {
  const rowCount = db.prepare('SELECT count(*) as count FROM User').get();
  console.log(`Users in dev.db: ${rowCount.count}`);
  const shopCount = db.prepare('SELECT count(*) as count FROM Product').get();
  console.log(`Products in dev.db: ${shopCount.count}`);
} catch (err) {
  console.error('Error reading dev.db:', err);
} finally {
  db.close();
}
