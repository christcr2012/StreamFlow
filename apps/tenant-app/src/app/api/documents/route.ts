// apps/tenant-app/src/app/api/documents/route.ts
// Document management API - Phase 2 (Vercel Blob storage, org-scoped)

import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';
import { getAuthContext } from '@/lib/auth-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function guessTypeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return 'image';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'doc';
  if (lower.endsWith('.xlsx') || lower.endsWith('.csv')) return 'sheet';
  return 'file';
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // List blobs under documents/{orgId}
    const prefix = `documents/${auth.orgId}/`;
    const { blobs } = await list({ prefix });

    let docs = blobs.map((b: any) => {
      const name = b.pathname.replace(prefix, '');
      return {
        id: b.url,
        name,
        type: guessTypeFromName(name),
        size: b.size,
        uploadedBy: 'System',
        uploadedAt: b.uploadedAt || new Date().toISOString(),
        linkedTo: null,
        tags: [],
        url: b.url,
      };
    });

    if (type && type !== 'all') {
      docs = docs.filter((d) => d.type === type);
    }

    return NextResponse.json({ documents: docs, total: docs.length });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const nameOverride = form.get('name') as string | null;
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const filename = `${nameOverride || file.name}`;
    const key = `documents/${auth.orgId}/${Date.now()}-${filename}`;
  const blob = await put(key, file, { access: 'public', addRandomSuffix: true });

    const doc = {
      id: blob.url,
      name: filename,
      type: guessTypeFromName(filename),
      size: file.size,
      uploadedBy: 'System',
      uploadedAt: new Date().toISOString(),
      linkedTo: null,
      tags: [],
      url: blob.url,
    };

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
