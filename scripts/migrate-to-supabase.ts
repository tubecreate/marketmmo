
import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const sqlite = new Database('dev.db');
console.log('Connecting to database...');
const prisma = new PrismaClient();

async function migrate() {
  console.log('--- Starting Migration: SQLite to Supabase ---');
  console.log('DB URL Length:', process.env.DATABASE_URL?.length || 0);

  try {
    console.log('Checking database connection by counting users...');
    const userCount = await prisma.user.count();
    console.log(`Current users in Supabase: ${userCount}`);

    // 1. Migrate Users
    console.log('Fetching users from SQLite...');
    const users = sqlite.prepare('SELECT * FROM User').all() as any[];
    console.log(`Found ${users.length} users in SQLite.`);
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          isActive: Boolean(user.isActive),
          twoFactorEnabled: Boolean(user.twoFactorEnabled),
        }
      });
    }
    console.log('Users migrated.');

    // 2. Migrate Categories
    const categories = sqlite.prepare('SELECT * FROM Category').all() as any[];
    console.log(`Found ${categories.length} categories.`);
    for (const cat of categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {},
        create: {
          ...cat,
          createdAt: new Date(cat.createdAt)
        }
      });
    }
    console.log('Categories migrated.');

    // 3. Migrate Products
    const products = sqlite.prepare('SELECT * FROM Product').all() as any[];
    console.log(`Found ${products.length} products.`);
    for (const p of products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: {
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          isFeatured: Boolean(p.isFeatured),
          isSponsored: Boolean(p.isSponsored),
          isService: Boolean(p.isService),
          allowBidding: Boolean(p.allowBidding),
          lastSoldAt: p.lastSoldAt ? new Date(p.lastSoldAt) : null,
        }
      });
    }
    console.log('Products migrated.');

    // 4. Migrate ProductVariants
    const variants = sqlite.prepare('SELECT * FROM ProductVariant').all() as any[];
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { id: v.id },
        update: {},
        create: {
          ...v,
          allowBidding: Boolean(v.allowBidding),
          createdAt: new Date(v.createdAt)
        }
      });
    }
    console.log('Product variants migrated.');

    // 5. Migrate ProductItems
    const items = sqlite.prepare('SELECT * FROM ProductItem').all() as any[];
    for (const i of items) {
      await prisma.productItem.upsert({
        where: { id: i.id },
        update: {},
        create: {
          ...i,
          isSold: Boolean(i.isSold),
          soldAt: i.soldAt ? new Date(i.soldAt) : null,
          createdAt: new Date(i.createdAt)
        }
      });
    }
    console.log('Product items migrated.');

    console.log('--- Migration Completed Successfully ---');
  } catch (error: any) {
    console.error('Migration failed at step!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Stack Trace:', error.stack);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

migrate();
