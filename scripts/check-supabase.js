
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const products = await prisma.product.count();
    const users = await prisma.user.count();
    console.log(`Supabase - Products: ${products}, Users: ${users}`);
  } catch (err) {
    console.error('Failed to connect to Supabase:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
