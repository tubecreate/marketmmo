
const Database = require('better-sqlite3');
const db = new Database('dev.db');

try {
  const tableNames = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  console.log('Tables:', tableNames.join(', '));
  
  if (tableNames.includes('Order')) {
    const count = db.prepare('SELECT COUNT(*) as count FROM "Order"').get();
    console.log(`Order table row count: ${count.count}`);
    const columns = db.prepare('PRAGMA table_info("Order")').all();
    console.log('Order columns:', columns.map(c => c.name).join(', '));
  } else {
    console.log('Order table does NOT exist!');
  }
} catch (e) {
  console.error('Error:', e.message);
} finally {
  db.close();
}
