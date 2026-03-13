const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../dev.db');
console.log('Using database at:', dbPath);

const db = new Database(dbPath);

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const systemConfigTable = tables.find(t => t.name.toLowerCase() === 'systemconfig' || t.name.toLowerCase() === 'system_config')?.name;
  
  if (!systemConfigTable) {
    console.error('Could not find SystemConfig table');
  } else {
    // Update to ACTUAL bank details found in logs
    const update = db.prepare(`
      UPDATE "${systemConfigTable}"
      SET bankName = ?, bankAccount = ?, bankOwner = ?, updatedAt = ?
      WHERE id = 'default'
    `);
    // From first user message: bankName: 'vietcombank', bankAccount: '651000123123'
    // From screenshot: Name: 'Trương Quốc Tuân'
    update.run('Vietcombank', '651000123123', 'Trương Quốc Tuân', Date.now());
    
    console.log('Database updated successfully with actual bank details');
    
    // Verify
    const verify = db.prepare(`SELECT bankName, bankAccount, bankOwner FROM "${systemConfigTable}" WHERE id = 'default'`).get();
    console.log('Verified data:', verify);
  }
} catch (err) {
  console.error('Operation failed:', err);
} finally {
  db.close();
}
