
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const allProps = Object.getOwnPropertyNames(prisma);
    const prototypeProps = Object.getOwnPropertyNames(Object.getPrototypeOf(prisma));
    
    return NextResponse.json({ 
      instanceProps: allProps.filter(p => !p.startsWith('_')),
      prototypeProps: prototypeProps.filter(p => !p.startsWith('_')),
      notificationExists: !!(prisma as any).notification
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
