import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SePayPgClient } from 'sepay-pg-node';

export async function POST(req: Request) {
  try {
    const { userId, amount } = await req.json();

    if (!userId || !amount || amount < 10000) {
      return NextResponse.json({ error: 'Số tiền nạp tối thiểu là 10.000đ' }, { status: 400 });
    }

    const config = await prisma.systemConfig.findUnique({ where: { id: 'default' } }) as any;
    
    // Create a pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type: 'DEPOSIT',
        status: 'PENDING',
        description: 'Nạp tiền qua SePay',
      }
    });

    const paymentCode = `MKT${transaction.id.slice(-6).toUpperCase()}`;
    
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { description: paymentCode }
    });

    // Initialize SePay SDK
    // If key starts with spsk_test, use sandbox
    const isTest = (config?.sepayWebhookSecret || '').startsWith('spsk_test');
    
    const client = new SePayPgClient({
      env: isTest ? 'sandbox' : 'production',
      merchant_id: config?.sepayMerchantId || '',
      secret_key: config?.sepayWebhookSecret || '',
    });

    // Generate checkout fields for hosted payment page
    const fields = client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: paymentCode,
      order_amount: parseFloat(amount),
      currency: 'VND',
      order_description: `Nap tien cho tai khoan ID: ${userId}`,
      success_url: `${req.headers.get('origin')}/tai-khoan/nap-tien?status=success`,
      cancel_url: `${req.headers.get('origin')}/tai-khoan/nap-tien?status=cancel`,
    } as any);

    // Generate official SePay QR URL
    // Format: https://qr.sepay.vn/img?bank={BANK_NAME}&acc={ACCOUNT_NUMBER}&amount={AMOUNT}&des={DESCRIPTION}
    const sepayQrUrl = `https://qr.sepay.vn/img?bank=${config?.bankName || ''}&acc=${config?.bankAccount || ''}&amount=${amount}&des=${paymentCode}`;

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      paymentCode,
      amount: parseFloat(amount),
      checkoutUrl: client.checkout.initCheckoutUrl(),
      checkoutFields: fields,
      qrUrl: sepayQrUrl,
      bankInfo: {
        bankName: config?.bankName || '',
        accountNumber: config?.bankAccount || '',
        accountHolder: config?.bankOwner || '',
      }
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Lỗi tạo yêu cầu thanh toán' }, { status: 500 });
  }
}
