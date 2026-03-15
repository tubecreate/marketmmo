
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    console.log('--- Database Stats ---');
    console.log(`Products: ${productCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Categories: ${categoryCount}`);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
