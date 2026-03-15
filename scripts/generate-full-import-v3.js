
const Database = require('better-sqlite3');
const fs = require('fs');

const sqlite = new Database('dev.db');
let sql = '-- FULL Manual Import Script v3 (Final Recovery)\n';
sql += '-- Generated on ' + new Date().toISOString() + '\n\n';
sql += 'SET session_replication_role = \'replica\';\n\n';

const tables = [
  'User', 'Category', 'Product', 'ProductVariant', 'ProductItem', 
  'Order', 'Transaction', 'Review', 'Dispute', 'DisputeMessage', 
  'Coupon', 'AffiliateLink', 'ChatLog', 'Banner', 'Announcement', 
  'SystemConfig', 'UserOverride', 'SellerRequest', 'Notification', 
  'ChatRoom', 'ChatParticipant', 'ChatMessage'
];

function formatDate(date) {
  if (!date) return 'NULL';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'NULL';
    return `'${d.toISOString().replace('T', ' ').replace('Z', '')}+00'`;
  } catch (e) {
    return 'NULL';
  }
}

function escape(val, type, colName) {
  if (val === null || val === undefined) return 'NULL';
  
  // Date detection by column name or type
  if (type === 'DATETIME' || colName.toLowerCase().endsWith('at') || colName.toLowerCase().includes('expire') || colName.toLowerCase().includes('date')) {
      return formatDate(val);
  }

  // Boolean detection
  if (type === 'BOOLEAN' || ['isActive', 'twoFactorEnabled', 'isFeatured', 'isSponsored', 'isService', 'allowBidding', 'isSold', 'isRead'].includes(colName)) {
      if (val === 1 || val === true || val === 'true') return 'true';
      return 'false';
  }

  if (typeof val === 'string') {
    return `'${val.replace(/'/g, "''")}'`;
  }
  
  if (typeof val === 'number') {
    if (isNaN(val)) return 'NULL';
    return val;
  }
  
  return `'${String(val).replace(/'/g, "''")}'`;
}

try {
  tables.forEach(tableName => {
    process.stdout.write(`Processing ${tableName}... `);
    sql += `\n-- Table: ${tableName}\n`;
    
    try {
        const tableInfo = sqlite.prepare(`PRAGMA table_info("${tableName}")`).all();
        const columns = tableInfo.map(c => c.name);
        const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
        
        rows.forEach(row => {
          const vals = tableInfo.map(col => {
            return escape(row[col.name], col.type, col.name);
          });
          
          const colNames = columns.map(c => `"${c}"`).join(', ');
          sql += `INSERT INTO "${tableName}" (${colNames}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
        });
        console.log(`${rows.length} rows.`);
    } catch (e) {
        console.log(`ERROR: ${e.message}`);
        sql += `-- Error processing table ${tableName}: ${e.message}\n`;
    }
  });

  sql += '\nSET session_replication_role = \'origin\';\n';
  
  fs.writeFileSync('full-import-v3.sql', sql);
  console.log('\nSUCCESS: full-import-v3.sql generated.');

} catch (err) {
  console.error('\nFATAL Error:', err);
} finally {
  sqlite.close();
}
