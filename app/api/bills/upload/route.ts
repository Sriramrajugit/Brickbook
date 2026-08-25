import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.companyId) {
      return NextResponse.json({ error: 'User company not assigned' }, { status: 400 });
    }

    const companyId = user.companyId; // Narrow the type for TypeScript

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 2MB limit. Uploaded: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Validate file type (images and PDFs only)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only images (JPEG, PNG, GIF) and PDFs are allowed' },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const billsDir = join(
      process.cwd(),
      'public',
      'bills',
      companyId.toString()
    );

    if (!existsSync(billsDir)) {
      await mkdir(billsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const filename = `bill_${timestamp}_${randomString}.${extension}`;

    const filepath = join(billsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    await writeFile(filepath, buffer);

    // Return relative path for storage in database
    const relativePath = `/bills/${user.companyId}/${filename}`;

    return NextResponse.json(
      {
        data: {
          filename,
          filepath: relativePath,
          size: file.size,
          type: file.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading bill:', error);
    return NextResponse.json(
      { error: 'Failed to upload bill file' },
      { status: 500 }
    );
  }
}
