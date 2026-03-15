
const Database = require('better-sqlite3');
const db = new Database('dev.db');

try {
  const tableInfo = db.prepare("PRAGMA table_info(Product)").all();
  console.log('Product Table Columns:');
  tableInfo.forEach(col => console.log(`- ${col.name} (${col.type})`));
  
  const sample = db.prepare("SELECT * FROM Product LIMIT 1").get();
  console.log('Sample Product Status:', sample ? sample.status : 'No products found');
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
