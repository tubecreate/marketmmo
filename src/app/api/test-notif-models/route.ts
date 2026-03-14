
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const models = [];
    for (const key in prisma) {
      if (!key.startsWith('_') && !key.startsWith('$')) {
        models.push(key);
      }
    }
    
    return NextResponse.json({ 
      models,
      userExists: !!(prisma as any).user,
      notificationExists: !!(prisma as any).notification
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
