
const Database = require('better-sqlite3');
const fs = require('fs');

const sqlite = new Database('dev.db');
let sql = '-- FULL Manual Import Script for Supabase\n';
sql += '-- Generated on ' + new Date().toISOString() + '\n\n';
sql += 'SET session_replication_role = \'replica\'; -- Disable triggers and constraints temporarily\n\n';

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

function escape(val, type) {
  if (val === null || val === undefined) return 'NULL';
  
  // Handle Booleans (SQLite uses 0/1)
  if (type === 'BOOLEAN' || (typeof val === 'number' && (val === 0 || val === 1) && !type)) {
     // Safety check: if column looks like a boolean but is actually a number count...
     // However, in this schema, most 0/1 are booleans.
  }

  if (typeof val === 'string') {
    // Check if it's a date string
    if (val.match(/^\d{4}-\d{2}-\d{2}/)) {
        return formatDate(val);
    }
    return `'${val.replace(/'/g, "''")}'`;
  }
  
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  
  if (typeof val === 'number') {
    if (isNaN(val)) return 'NULL';
    return val;
  }
  
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Map SQLite 0/1 to true/false for boolean columns
const booleanFields = [
  'isActive', 'twoFactorEnabled', 'isFeatured', 'isSponsored', 
  'isService', 'allowBidding', 'isSold', 'buyerConfirmedAt',
  'isRead'
];

try {
  tables.forEach(tableName => {
    console.log(`Processing table: ${tableName}`);
    sql += `\n-- Table: ${tableName}\n`;
    
    try {
        const tableInfo = sqlite.prepare(`PRAGMA table_info("${tableName}")`).all();
        const columns = tableInfo.map(c => c.name);
        const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
        
        console.log(`- Found ${rows.length} rows`);
        
        rows.forEach(row => {
          const vals = tableInfo.map(col => {
            let val = row[col.name];
            // Boolean handling
            if (booleanFields.includes(col.name) || col.type === 'BOOLEAN') {
                if (val === 1) return 'true';
                if (val === 0) return 'false';
            }
            // Date handling
            if (col.type === 'DATETIME' || col.name.endsWith('At') || col.name.endsWith('Expired')) {
                return formatDate(val);
            }
            return escape(val, col.type);
          });
          
          const colNames = columns.map(c => `"${c}"`).join(', ');
          sql += `INSERT INTO "${tableName}" (${colNames}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
        });
    } catch (e) {
        console.warn(`! Skipping ${tableName}: ${e.message}`);
        sql += `-- Skipping table ${tableName} due to error: ${e.message}\n`;
    }
  });

  sql += '\nSET session_replication_role = \'origin\'; -- Re-enable triggers\n';
  
  fs.writeFileSync('full-import.sql', sql);
  console.log('\nSUCCESS: full-import.sql generated.');

} catch (err) {
  console.error('FATAL Error:', err);
} finally {
  sqlite.close();
}
