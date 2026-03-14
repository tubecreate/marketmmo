const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const orders = await prisma.order.findMany({
      take: 1,
      select: { id: true, pendingExtensionHours: true }
    });
    console.log('Success! pendingExtensionHours field is accessible.');
    console.log('Sample order:', orders[0]);
  } catch (err) {
    console.error('Diagnostic failed:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
