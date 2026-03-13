import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendSystemMessage } from '@/lib/chat';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(req: Request) {
  const tmpDir = join(process.cwd(), 'tmp');
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }
  const logFile = join(tmpDir, 'sepay_webhook.log');
  const headers = Object.fromEntries(req.headers.entries());
  
  const logEntry = `\n--- WEBHOOK GET ${new Date().toISOString()} ---\n` +
                   `Headers: ${JSON.stringify(headers, null, 2)}\n` +
                   `---------------------------\n`;
  appendFileSync(logFile, logEntry);

  return NextResponse.json({ 
    message: "SePay Webhook Endpoint is REACHABLE via GET",
    time: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  const tmpDir = join(process.cwd(), 'tmp');
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }
  const logFile = join(tmpDir, 'sepay_webhook.log');
  
  try {
    const contentType = req.headers.get('content-type') || '';
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    let data: any = {};
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(rawBody);
      } catch (e) {
        console.error('Failed to parse JSON body');
      }
    } else {
      const params = new URLSearchParams(rawBody);
      params.forEach((value, key) => {
        data[key] = value;
      });
    }

    const logEntry = `\n--- WEBHOOK ${new Date().toISOString()} ---\n` +
                     `Headers: ${JSON.stringify(headers, null, 2)}\n` +
                     `Body: ${rawBody}\n` +
                     `Data: ${JSON.stringify(data, null, 2)}\n` +
                     `---------------------------\n`;
    appendFileSync(logFile, logEntry);

    const authHeader = headers['authorization'] || '';
    const systemConfig = await prisma.systemConfig.findUnique({ where: { id: 'default' } }) as any;
    
    const expectedSecret = systemConfig?.sepayWebhookSecret;
    // Flexible check: case-insensitive prefix, trim spaces
    const cleanAuth = authHeader.trim();
    const isAuthorized = !expectedSecret || 
                        cleanAuth === `Bearer ${expectedSecret}` || 
                        cleanAuth.toLowerCase() === `apikey ${expectedSecret.toLowerCase()}` ||
                        cleanAuth === `Apikey ${expectedSecret}` ||
                        cleanAuth === expectedSecret;

    if (!isAuthorized) {
      console.warn(`Unauthorized SePay Webhook. Expected secret: ${expectedSecret?.slice(0, 10)}... Header: ${authHeader}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      content,
      transferAmount,
      id: sepayId,
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
