// src/pages/api/admin/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import { requireAuth, auditLog, generateTemporaryPassword } from "@/lib/auth-helpers";
import { withSpaceGuard, SPACE_GUARDS } from "@/lib/space-guards";
import bcrypt from "bcryptjs";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return handleGetUsers(req, res);
  } else if (req.method === "POST") {
    return handleCreateUser(req, res);
  } else if (req.method === "PUT") {
    return handleUpdateUser(req, res);
  } else if (req.method === "DELETE") {
    return handleDeleteUser(req, res);
  }
  
  res.status(405).json({ error: "Method not allowed" });
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
  if (!(await assertPermission(req, res, PERMS.USER_READ))) return;

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        rbacUserRoles: {
          include: {
            role: {
              select: {
                name: true,
                slug: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Fetch employee profiles separately if needed
    const userIds = users.map(u => u.id);
    let employeeProfiles: any[] = [];
    
    try {
      // Try to fetch employee profiles - may not exist for all users
      const profiles = await db.$queryRaw`
        SELECT "userId", id, "adpWorkerId", "managerId", "emergencyContact"
        FROM "EmployeeProfile" 
        WHERE "userId" = ANY(${userIds}::text[])
      `;
      employeeProfiles = profiles as any[];
    } catch (error) {
      console.warn("Employee profiles not available:", error);
      employeeProfiles = [];
    }

    // Merge employee profile data
    const usersWithProfiles = users.map((user: any) => ({
      ...user,
      employeeProfile: employeeProfiles.find((ep: any) => ep.userId === user.id) || null
    }));

    res.json({ ok: true, users: usersWithProfiles });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

async function handleCreateUser(req: NextApiRequest, res: NextApiResponse) {
  if (!(await assertPermission(req, res, PERMS.USER_CREATE))) return;

  try {
    const {
      email,
      name,
      role,
      generatePassword = true,
      password,
      employeeData,
      roleIds = []
    } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ error: "Email, name, and role are required" });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    // Generate password if not provided
    const userPassword = password || crypto.getRandomValues(new Uint8Array(12)).reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
    const passwordHash = await bcrypt.hash(userPassword, 12);

    // Get the organization ID from the requesting user
    const requestingUserEmail = req.cookies?.ws_user;
    const requestingUser = await db.user.findUnique({
      where: { email: requestingUserEmail },
      select: { orgId: true }
    });

    if (!requestingUser?.orgId) {
      return res.status(400).json({ error: "Unable to determine organization" });
    }

    // Create user with transaction
    const result = await db.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          orgId: requestingUser.orgId,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          role,
          passwordHash,
          mustChangePassword: generatePassword,
          status: "active"
        }
      });

      // Create employee profile if employee data provided
      if (employeeData) {
        try {
          await tx.$executeRaw`
            INSERT INTO "EmployeeProfile" ("id", "orgId", "userId", "adpWorkerId", "managerId", "emergencyContact", "mobilePrefs", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${requestingUser.orgId}, ${newUser.id}, ${employeeData.adpWorkerId || null}, ${employeeData.managerId || null}, ${JSON.stringify(employeeData.emergencyContact || {})}, '{}', NOW(), NOW())
          `;
        } catch (error) {
          console.warn("Could not create employee profile:", error);
        }
      }

      // Assign RBAC roles if provided
      if (roleIds.length > 0) {
        const userRoleData = roleIds.map((roleId: string) => ({
          userId: newUser.id,
          roleId,
          orgId: requestingUser.orgId
        }));
        
        await tx.rbacUserRole.createMany({ data: userRoleData });
      }

      return newUser;
    });

    // Return user data without password
    const responseData = {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      status: result.status,
      mustChangePassword: result.mustChangePassword,
      ...(generatePassword && { temporaryPassword: userPassword })
    };

    res.json({ ok: true, user: responseData });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse) {
  if (!(await assertPermission(req, res, PERMS.USER_UPDATE))) return;

  try {
    const { userId, updates, employeeUpdates, roleIds } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get the organization ID from the requesting user
    const requestingUserEmail = req.cookies?.ws_user;
    const requestingUser = await db.user.findUnique({
      where: { email: requestingUserEmail },
      select: { orgId: true }
    });

    const result = await db.$transaction(async (tx) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...updates,
          ...(updates.email && { email: updates.email.toLowerCase().trim() }),
          ...(updates.name && { name: updates.name.trim() })
        }
      });

      // Update employee profile if data provided
      if (employeeUpdates) {
        try {
          // First try to update existing profile
          const updateResult = await tx.$executeRaw`
            UPDATE "EmployeeProfile" 
            SET "adpWorkerId" = ${employeeUpdates.adpWorkerId || null},
                "managerId" = ${employeeUpdates.managerId || null},
                "emergencyContact" = ${JSON.stringify(employeeUpdates.emergencyContact || {})},
                "mobilePrefs" = ${JSON.stringify(employeeUpdates.mobilePrefs || {})},
                "updatedAt" = NOW()
            WHERE "userId" = ${userId}
          `;
          
          // If no rows were updated, create new profile
          if (updateResult === 0) {
            await tx.$executeRaw`
              INSERT INTO "EmployeeProfile" ("id", "orgId", "userId", "adpWorkerId", "managerId", "emergencyContact", "mobilePrefs", "createdAt", "updatedAt")
              VALUES (gen_random_uuid(), ${requestingUser!.orgId}, ${userId}, ${employeeUpdates.adpWorkerId || null}, ${employeeUpdates.managerId || null}, ${JSON.stringify(employeeUpdates.emergencyContact || {})}, ${JSON.stringify(employeeUpdates.mobilePrefs || {})}, NOW(), NOW())
            `;
          }
        } catch (error) {
          console.warn("Could not update employee profile:", error);
        }
      }

      // Update RBAC roles if provided
      if (Array.isArray(roleIds)) {
        // Remove existing roles
        await tx.rbacUserRole.deleteMany({ where: { userId } });
        
        // Add new roles
        if (roleIds.length > 0) {
          const userRoleData = roleIds.map((roleId: string) => ({
            userId,
            roleId,
            orgId: requestingUser!.orgId
          }));
          
          await tx.rbacUserRole.createMany({ data: userRoleData });
        }
      }

      return updatedUser;
    });

    res.json({ ok: true, user: result });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
}

async function handleDeleteUser(req: NextApiRequest, res: NextApiResponse) {
  if (!(await assertPermission(req, res, PERMS.USER_DELETE))) return;

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Soft delete by setting status to inactive
    await db.user.update({
      where: { id: userId },
      data: { status: "inactive" }
    });

    res.json({ ok: true, message: "User deactivated successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

// Apply space guard - only allow client space with OWNER role for admin user management
export default withSpaceGuard(SPACE_GUARDS.OWNER_ONLY)(handler);