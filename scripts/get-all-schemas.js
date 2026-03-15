
const Database = require('better-sqlite3');
const db = new Database('dev.db');

const tables = ['User', 'Category', 'Product', 'ProductVariant', 'ProductItem'];

try {
  tables.forEach(table => {
    console.log(`--- ${table} ---`);
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    info.forEach(c => console.log(`- ${c.name}`));
  });
} finally {
  db.close();
}
