import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/disputes/[id]/messages
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: disputeId } = await params;

    const messages = await prisma.disputeMessage.findMany({
      where: { disputeId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/disputes/[id]/messages
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: disputeId } = await params;
    const { senderId, senderRole, message } = await req.json();

    if (!senderId || !senderRole || !message?.trim()) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    // Verify dispute exists and is escalated
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) return NextResponse.json({ error: 'Không tìm thấy khiếu nại' }, { status: 404 });
    if (dispute.status !== 'ESCALATED') {
      return NextResponse.json({ error: 'Phiên tranh chấp đã đóng' }, { status: 400 });
    }

    const msg = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId,
        senderRole,
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true, message: msg });
  } catch {
    return NextResponse.json({ error: 'Lỗi gửi tin nhắn' }, { status: 500 });
  }
}
