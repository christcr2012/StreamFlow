import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// GET /api/provider/rbac/users - List all users with their roles
export async function GET(request: NextRequest) {
  try {
    // Get provider email from cookie
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);

    // Get user's org
    const user = await prisma.user.findUnique({
      where: { email },
      select: { orgId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all users in this org with their roles
    const users = await prisma.user.findMany({
      where: { orgId: user.orgId },
      select: {
        id: true,
        email: true,
        name: true,
        rbacUserRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { email: 'asc' },
    });

    // Transform to include roles array
    const usersWithRoles = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      roles: u.rbacUserRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        slug: ur.role.slug,
        isSystem: ur.role.isSystem,
      })),
    }));

    return NextResponse.json({ users: usersWithRoles });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

