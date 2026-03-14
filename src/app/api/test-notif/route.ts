
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  try {
    const notif = await createNotification({
      userId: 'test-user', // Just for testing, will fail FK if userId doesn't exist
      title: 'Test Notification',
      content: 'Testing raw SQL insertion',
      type: 'SYSTEM',
      targetUrl: '/'
    });

    return NextResponse.json({ success: !!notif, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
