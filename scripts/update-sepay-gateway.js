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
    // Update to EXACT credentials from user screenshot
    const update = db.prepare(`
      UPDATE "${systemConfigTable}"
      SET sepayMerchantId = ?, sepayWebhookSecret = ?, updatedAt = ?
      WHERE id = 'default'
    `);
    
    update.run('SP-TEST-TQ3B3B66', 'spsk_test_WLNWs6B2VbNGypeuscMWNYg4HqFfMZBW', Date.now());
    
    console.log('Database updated successfully with new SePay test credentials.');
    
    // Verify
    const verify = db.prepare(`SELECT sepayMerchantId, sepayWebhookSecret FROM "${systemConfigTable}" WHERE id = 'default'`).get();
    console.log('Verified data:', verify);
  }
} catch (err) {
  console.error('Operation failed:', err);
} finally {
  db.close();
}
