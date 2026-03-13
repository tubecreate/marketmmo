import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';

/**
 * SEPAY WEBHOOK HANDLER
 * Documentation: https://developer.sepay.vn/en/cong-thanh-toan/API/tong-quan
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('SePay Webhook received:', data);

    const authHeader = req.headers.get('authorization');
    const systemConfig = await prisma.systemConfig.findUnique({ where: { id: 'default' } }) as any;
    
    // If the user has configured a webhook secret/API key, we should verify it.
    if (systemConfig?.sepayWebhookSecret && authHeader !== `Bearer ${systemConfig.sepayWebhookSecret}`) {
      console.warn('Unauthorized SePay Webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      content, // Transfer content (contains our paymentCode)
      transferAmount,
      id: sepayId, // SePay transaction ID
    } = data;

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    // Extract payment code from content
    const paymentCodeMatch = content.match(/MKT[A-Z0-9]{6}/i);
    const paymentCode = paymentCodeMatch ? paymentCodeMatch[0].toUpperCase() : content.trim().toUpperCase();

    // Find the pending transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        description: paymentCode,
        status: 'PENDING',
        type: 'DEPOSIT'
      }
    });

    if (!transaction) {
      console.log(`No pending transaction found for code: ${paymentCode}`);
      return NextResponse.json({ success: false, message: 'Transaction not found or already processed' });
    }

    // Update transaction and user balance atomically
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          gatewayRef: sepayId.toString(),
          amount: parseFloat(transferAmount)
        }
      }),
      prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: { increment: parseFloat(transferAmount) }
        }
      })
    ]);

    // Notify the user via Chatbot
    try {
      await sendSystemMessage(
        transaction.userId,
        `💰 Nạp tiền thành công!\nBạn vừa nạp +${parseFloat(transferAmount).toLocaleString('vi-VN')}đ vào tài khoản.\nSố dư hiện tại đã được cập nhật.`
      );
    } catch (notifyErr) {
      console.error('Failed to notify user after deposit:', notifyErr);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('SePay Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
