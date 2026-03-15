
const Database = require('better-sqlite3');
const fs = require('fs');

const sqlite = new Database('dev.db');

try {
  const products = sqlite.prepare('SELECT p.id, p.title, p.price, c.name as category FROM Product p LEFT JOIN Category c ON p.categoryId = c.id').all();
  console.log('--- DANH SÁCH SẢN PHẨM TRONG CƠ SỞ DỮ LIỆU CŨ (SQLite) ---');
  console.table(products);
  
  const jsonOutput = JSON.stringify(products, null, 2);
  fs.writeFileSync('old-products-export.json', jsonOutput);
  console.log('\nĐã lưu danh sách vào file: old-products-export.json');
} catch (err) {
  console.error('Lỗi khi đọc dữ liệu:', err.message);
} finally {
  sqlite.close();
}
