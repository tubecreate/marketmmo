import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, role: true, balance: true, holdBalance: true }});
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log("Users:", users);
  console.log("Latest Orders:", orders);
}
main().catch(console.error).finally(() => prisma.$disconnect());
