const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../dev.db');
const db = new Database(dbPath);

try {
  const row = db.prepare('SELECT * FROM "Transaction" WHERE description = ?').get('MKT3NZ668');
  console.log('Target Transaction:', JSON.stringify(row, null, 2));

  const rows = db.prepare('SELECT * FROM "Transaction" WHERE type = \'DEPOSIT\' ORDER BY createdAt DESC LIMIT 5').all();
  console.log('Recent Deposits:', JSON.stringify(rows, null, 2));
} catch (err) {
  console.error('Diagnostic error:', err);
} finally {
  db.close();
}
