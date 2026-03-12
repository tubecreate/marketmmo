import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Ignore if directory exists
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const path = join(uploadsDir, filename);

    await writeFile(path, buffer);
    
    const url = `/uploads/${filename}`;
    
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
