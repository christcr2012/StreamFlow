import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';

export async function GET(req: Request) {
  const auth = await getAuthContext();
  if (!auth?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || undefined;
  const externalId = searchParams.get('externalId') || undefined;

  if (!id && !externalId) {
    return NextResponse.json({ error: 'id or externalId required' }, { status: 400 });
  }

  const comm = await prisma.communication.findFirst({
    where: {
      orgId: auth.orgId,
      ...(id ? { id } : {}),
      ...(externalId ? { externalId } : {}),
    },
    include: { Customer: true, User: true, Thread: true },
  });

  if (!comm) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ communication: comm });
}
