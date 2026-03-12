
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const shortId = 'E8TA41CO';
  console.log(`Checking status for order ending in ${shortId}...`);
  
  const orders = await prisma.order.findMany({
    include: { dispute: true }
  });
  
  const target = orders.find(o => o.id.toUpperCase().endsWith(shortId));
  
  if (target) {
    console.log('Order Found:', {
      id: target.id,
      status: target.status,
      disputeStatus: target.dispute?.status,
      disputeResolution: target.dispute?.resolution,
    });
    
    if (target.dispute && target.dispute.status === 'REFUNDED' && target.status !== 'REFUNDED') {
      console.log('Conflict detected. Syncing...');
      await prisma.order.update({
        where: { id: target.id },
        data: { status: 'REFUNDED' }
      });
      console.log('Fixed!');
    }
  } else {
    console.log('Order not found.');
  }
  
  // Also list all potential conflicts
  const conflicts = orders.filter(o => o.dispute && o.dispute.status === 'REFUNDED' && o.status !== 'REFUNDED');
  console.log(`Found ${conflicts.length} other conflicts.`);
  for (const c of conflicts) {
    console.log(`Updating order ${c.id}...`);
    await prisma.order.update({
      where: { id: c.id },
      data: { status: 'REFUNDED' }
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
