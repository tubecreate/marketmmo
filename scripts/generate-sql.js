
const Database = require('better-sqlite3');
const fs = require('fs');

const sqlite = new Database('dev.db');
let sql = '-- Manual Import Script for Supabase\n\n';

function formatDate(date) {
  if (!date) return 'NULL';
  return `'${new Date(date).toISOString().replace('T', ' ').replace('Z', '')}+00'`;
}

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return val;
}

try {
  // 1. User
  const users = sqlite.prepare('SELECT * FROM User').all();
  sql += '-- Users\n';
  users.forEach(u => {
    sql += `INSERT INTO "User" (id, name, email, emailVerified, image, password, role, balance, isActive, twoFactorEnabled, createdAt, updatedAt) VALUES (${escape(u.id)}, ${escape(u.name)}, ${escape(u.email)}, ${formatDate(u.emailVerified)}, ${escape(u.image)}, ${escape(u.password)}, ${escape(u.role)}, ${u.balance}, ${u.isActive ? 'true' : 'false'}, ${u.twoFactorEnabled ? 'true' : 'false'}, ${formatDate(u.createdAt)}, ${formatDate(u.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  // 2. Category
  const categories = sqlite.prepare('SELECT * FROM Category').all();
  sql += '\n-- Categories\n';
  categories.forEach(c => {
    sql += `INSERT INTO "Category" (id, name, slug, description, icon, createdAt) VALUES (${escape(c.id)}, ${escape(c.name)}, ${escape(c.slug)}, ${escape(c.description)}, ${escape(c.icon)}, ${formatDate(c.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  // 3. Product
  const products = sqlite.prepare('SELECT * FROM Product').all();
  sql += '\n-- Products\n';
  products.forEach(p => {
    sql += `INSERT INTO "Product" (id, name, slug, description, price, oldPrice, images, categoryId, sellerId, status, isFeatured, isSponsored, isService, allowBidding, minBid, salesCount, rating, reviewCount, lastSoldAt, createdAt, updatedAt) VALUES (${escape(p.id)}, ${escape(p.name)}, ${escape(p.slug)}, ${escape(p.description)}, ${p.price}, ${escape(p.oldPrice)}, ${escape(p.images)}, ${escape(p.categoryId)}, ${escape(p.sellerId)}, ${escape(p.status)}, ${p.isFeatured ? 'true' : 'false'}, ${p.isSponsored ? 'true' : 'false'}, ${p.isService ? 'true' : 'false'}, ${p.allowBidding ? 'true' : 'false'}, ${escape(p.minBid)}, ${p.salesCount}, ${p.rating}, ${p.reviewCount}, ${formatDate(p.lastSoldAt)}, ${formatDate(p.createdAt)}, ${formatDate(p.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  // 4. ProductVariant
  const variants = sqlite.prepare('SELECT * FROM ProductVariant').all();
  sql += '\n-- ProductVariants\n';
  variants.forEach(v => {
    sql += `INSERT INTO "ProductVariant" (id, productId, name, price, stock, minPurchase, allowBidding, minBid, createdAt) VALUES (${escape(v.id)}, ${escape(v.productId)}, ${escape(v.name)}, ${v.price}, ${v.stock}, ${v.minPurchase}, ${v.allowBidding ? 'true' : 'false'}, ${escape(v.minBid)}, ${formatDate(v.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  // 5. ProductItem
  const items = sqlite.prepare('SELECT * FROM ProductItem').all();
  sql += '\n-- ProductItems\n';
  items.forEach(i => {
    sql += `INSERT INTO "ProductItem" (id, productId, variantId, content, isSold, soldAt, orderId, createdAt) VALUES (${escape(i.id)}, ${escape(i.productId)}, ${escape(i.variantId)}, ${escape(i.content)}, ${i.isSold ? 'true' : 'false'}, ${formatDate(i.soldAt)}, ${escape(i.orderId)}, ${formatDate(i.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  fs.writeFileSync('import-data.sql', sql);
  console.log('Successfully generated import-data.sql');

} catch (err) {
  console.error('Error:', err);
} finally {
  sqlite.close();
}
