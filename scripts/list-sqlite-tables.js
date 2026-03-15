
const Database = require('better-sqlite3');
const db = new Database('dev.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'").all();
  console.log('Tables in SQLite:');
  tables.forEach(t => console.log(`- ${t.name}`));
} finally {
  db.close();
}
