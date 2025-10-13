import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify job belongs to org
    const job = await prisma.job.findFirst({
      where: {
        id,
        orgId: authContext.orgId,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const filename = `${authContext.orgId}/${id}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    // Create JobPhoto record
    const photo = await prisma.jobPhoto.create({
      data: {
        jobId: id,
        url: blob.url,
        caption: caption || null,
      },
    });

    // Add timeline entry
    await prisma.jobTimeline.create({
      data: {
        jobId: id,
        eventType: 'photo_added',
        description: caption ? `Photo added: ${caption}` : 'Photo added',
        metadata: { photoId: photo.id, url: blob.url },
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify job belongs to org
    const job = await prisma.job.findFirst({
      where: {
        id,
        orgId: authContext.orgId,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const photos = await prisma.jobPhoto.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error('Fetch photos error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    // Verify job belongs to org and photo exists
    const photo = await prisma.jobPhoto.findFirst({
      where: {
        id: photoId,
        job: {
          id,
          orgId: authContext.orgId,
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Delete from database (Vercel Blob doesn't require explicit deletion for public access)
    await prisma.jobPhoto.delete({
      where: { id: photoId },
    });

    // Add timeline entry
    await prisma.jobTimeline.create({
      data: {
        jobId: id,
        eventType: 'photo_removed',
        description: photo.caption ? `Photo removed: ${photo.caption}` : 'Photo removed',
        metadata: { photoId: photo.id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete photo error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

