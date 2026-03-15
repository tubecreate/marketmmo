
const Database = require('better-sqlite3');
const fs = require('fs');

const sqlite = new Database('dev.db');
let sql = '-- Manual Import Script v2 for Supabase\n\n';

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

function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') {
    if (isNaN(val)) return 'NULL';
    return val;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

try {
  // 1. User
  const users = sqlite.prepare('SELECT * FROM User').all();
  sql += '-- Users\n';
  users.forEach(u => {
    sql += `INSERT INTO "User" (id, username, email, "passwordHash", balance, "holdBalance", role, "telegramId", "twoFactorSecret", "twoFactorEnabled", level, "totalRevenue", "isActive", avatar, "fullName", phone, "bankAccount", "bankName", "createdAt", "updatedAt") VALUES (${escape(u.id)}, ${escape(u.username)}, ${escape(u.email)}, ${escape(u.passwordHash)}, ${u.balance}, ${u.holdBalance}, ${escape(u.role)}, ${escape(u.telegramId)}, ${escape(u.twoFactorSecret)}, ${u.twoFactorEnabled ? 'true' : 'false'}, ${u.level}, ${u.totalRevenue}, ${u.isActive ? 'true' : 'false'}, ${escape(u.avatar)}, ${escape(u.fullName)}, ${escape(u.phone)}, ${escape(u.bankAccount)}, ${escape(u.bankName)}, ${formatDate(u.createdAt)}, ${formatDate(u.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  // 2. Category
  const categories = sqlite.prepare('SELECT * FROM Category').all();
  sql += '\n-- Categories\n';
  categories.forEach(c => {
    sql += `INSERT INTO "Category" (id, name, slug, icon, "parentId", "createdAt") VALUES (${escape(c.id)}, ${escape(c.name)}, ${escape(c.slug)}, ${escape(c.icon)}, ${escape(c.parentId)}, ${formatDate(c.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  // 3. Product
  const products = sqlite.prepare('SELECT * FROM Product').all();
  sql += '\n-- Products\n';
  products.forEach(p => {
    sql += `INSERT INTO "Product" (id, "sellerId", "categoryId", title, slug, "shortDescription", description, type, price, "priceMax", thumbnail, status, "isFeatured", "isSponsored", "viewCount", "soldCount", rating, "warrantyDays", "lastSoldAt", "isService", "allowBidding", "deliveryTimeHours", "createdAt", "updatedAt") VALUES (${escape(p.id)}, ${escape(p.sellerId)}, ${escape(p.categoryId)}, ${escape(p.title)}, ${escape(p.slug)}, ${escape(p.shortDescription)}, ${escape(p.description)}, ${escape(p.type)}, ${p.price}, ${escape(p.priceMax)}, ${escape(p.thumbnail)}, ${escape(p.status)}, ${p.isFeatured ? 'true' : 'false'}, ${p.isSponsored ? 'true' : 'false'}, ${p.viewCount}, ${p.soldCount}, ${p.rating}, ${p.warrantyDays}, ${formatDate(p.lastSoldAt)}, ${p.isService ? 'true' : 'false'}, ${p.allowBidding ? 'true' : 'false'}, ${escape(p.deliveryTimeHours)}, ${formatDate(p.createdAt)}, ${formatDate(p.updatedAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  // 4. ProductVariant
  const variants = sqlite.prepare('SELECT * FROM ProductVariant').all();
  sql += '\n-- ProductVariants\n';
  variants.forEach(v => {
    sql += `INSERT INTO "ProductVariant" (id, "productId", name, price, "allowBidding", description, "sortOrder", "createdAt", "deliveryTimeHours") VALUES (${escape(v.id)}, ${escape(v.productId)}, ${escape(v.name)}, ${v.price}, ${v.allowBidding ? 'true' : 'false'}, ${escape(v.description)}, ${v.sortOrder}, ${formatDate(v.createdAt)}, ${escape(v.deliveryTimeHours)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  // 5. ProductItem
  const items = sqlite.prepare('SELECT * FROM ProductItem').all();
  sql += '\n-- ProductItems\n';
  items.forEach(i => {
    sql += `INSERT INTO "ProductItem" (id, "productId", "variantId", content, "isSold", "soldAt", "createdAt") VALUES (${escape(i.id)}, ${escape(i.productId)}, ${escape(i.variantId)}, ${escape(i.content)}, ${i.isSold ? 'true' : 'false'}, ${formatDate(i.soldAt)}, ${formatDate(i.createdAt)}) ON CONFLICT (id) DO NOTHING;\n`;
  });

  fs.writeFileSync('import-data-v2.sql', sql);
  console.log('Successfully generated import-data-v2.sql');

} catch (err) {
  console.error('Error:', err);
} finally {
  sqlite.close();
}
