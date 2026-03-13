const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../dev.db');
const db = new Database(dbPath);

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const systemConfigTable = tables.find(t => t.name.toLowerCase() === 'systemconfig' || t.name.toLowerCase() === 'system_config')?.name;
  
  if (systemConfigTable) {
    const update = db.prepare(`
      UPDATE "${systemConfigTable}"
      SET sepayMerchantId = ?, sepayWebhookSecret = ?, updatedAt = ?
      WHERE id = 'default'
    `);
    
    update.run('SP-LIVE-TQA292B6', 'spsk_live_oHFKksamC9FPG81JNusfEndhj24WBEcB', Date.now());
    
    console.log('Database updated successfully with LIVE SePay credentials.');
    
    // Verify
    const verify = db.prepare(`SELECT sepayMerchantId, sepayWebhookSecret FROM "${systemConfigTable}" WHERE id = 'default'`).get();
    console.log('Verified data:', verify);
  }
} catch (err) {
  console.error('Operation failed:', err);
} finally {
  db.close();
}
