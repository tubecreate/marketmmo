
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { dispute: true }
    });
    
    const results = [];
    const debug = [];
    
    for (const order of orders) {
      if (order.dispute) {
        debug.push({
          orderId: order.id,
          orderStatus: order.status,
          disputeStatus: order.dispute.status
        });
        
        // Fix for REFUNDED
        if (order.dispute.status === 'REFUNDED' && order.status !== 'REFUNDED') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'REFUNDED' }
          });
          results.push(`Synced order ${order.id} to REFUNDED`);
        }
        
        // Fix for RESOLVED/WARRANTY
        if ((order.dispute.status === 'WARRANTY' || order.dispute.status === 'RESOLVED') && order.status === 'DISPUTED') {
           const newStatus = order.warrantyExpire && new Date(order.warrantyExpire) < new Date() ? 'COMPLETED' : 'HOLDING';
           await prisma.order.update({
             where: { id: order.id },
             data: { status: newStatus }
           });
           results.push(`Synced order ${order.id} to ${newStatus}`);
        }

        // Add case for CLOSED (cancelled by buyer)
        if (order.dispute.status === 'CLOSED' && order.status === 'DISPUTED') {
            const newStatus = order.warrantyExpire && new Date(order.warrantyExpire) < new Date() ? 'COMPLETED' : 'HOLDING';
            await prisma.order.update({
              where: { id: order.id },
              data: { status: newStatus }
            });
            results.push(`Synced cancelled dispute order ${order.id} to ${newStatus}`);
        }
      }
    }
    
    return NextResponse.json({ success: true, processed: results, debug });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
