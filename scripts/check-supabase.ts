
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function check() {
  try {
    console.log('Database URL:', process.env.DATABASE_URL);
    const products = await prisma.product.count();
    const users = await prisma.user.count();
    console.log(`Supabase - Products: ${products}, Users: ${users}`);
  } catch (err) {
    console.error('Failed to connect to Database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
