// src/server/services/taskService.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';

// Re-export ServiceError for convenience
export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const CreateTaskSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  assignedTo: z.string().min(1, 'Assigned user is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  dueDate: z.string().datetime().optional(),
  reminderAt: z.string().datetime().optional(),
});

export const UpdateTaskSchema = z.object({
  leadId: z.string().optional(),
  assignedTo: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  reminderAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
});

export const ListTasksSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  leadId: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'updatedAt']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type ListTasksInput = z.infer<typeof ListTasksSchema>;

export interface TaskResult {
  id: string;
  leadId: string;
  orgId: string;
  assignedTo: string;
  createdBy: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  reminderAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTasksResult {
  tasks: TaskResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== TASK SERVICE =====

export class TaskService {
  /**
   * Create a new task
   */
  async create(orgId: string, userId: string, input: CreateTaskInput): Promise<TaskResult> {
    // Validate input
    const validated = CreateTaskSchema.parse(input);

    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: {
        orgId_id: {
          orgId,
          id: validated.leadId,
        },
      },
    });

    if (!lead) {
      throw new ServiceError(
        'Lead not found',
        'NOT_FOUND',
        404
      );
    }

    // Verify assigned user exists
    const assignee = await prisma.user.findUnique({
      where: {
        orgId_id: {
          orgId,
          id: validated.assignedTo,
        },
      },
    });

    if (!assignee) {
      throw new ServiceError(
        'Assigned user not found',
        'NOT_FOUND',
        404
      );
    }

    // Create task
    const task = await prisma.leadTask.create({
      data: {
        orgId,
        leadId: validated.leadId,
        assignedTo: validated.assignedTo,
        createdBy: userId,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        status: validated.status,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        reminderAt: validated.reminderAt ? new Date(validated.reminderAt) : null,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'task.create',
        entityType: 'leadTask',
        entityId: task.id,
        delta: {
          title: task.title,
          leadId: task.leadId,
          assignedTo: task.assignedTo,
          priority: task.priority,
        },
      },
    });

    return task;
  }

  /**
   * Get task by ID
   */
  async getById(orgId: string, taskId: string): Promise<TaskResult> {
    const task = await prisma.leadTask.findFirst({
      where: {
        id: taskId,
        orgId,
      },
    });

    if (!task) {
      throw new ServiceError(
        'Task not found',
        'NOT_FOUND',
        404
      );
    }

    return task;
  }

  /**
   * List tasks with pagination and filters
   */
  async list(orgId: string, input: ListTasksInput): Promise<ListTasksResult> {
    // Validate input
    const validated = ListTasksSchema.parse(input);

    // Build where clause
    const where: any = { orgId };

    if (validated.leadId) {
      where.leadId = validated.leadId;
    }

    if (validated.assignedTo) {
      where.assignedTo = validated.assignedTo;
    }

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.priority) {
      where.priority = validated.priority;
    }

    // Get total count
    const total = await prisma.leadTask.count({ where });

    // Get tasks
    const tasks = await prisma.leadTask.findMany({
      where,
      orderBy: {
        [validated.sortBy]: validated.sortOrder,
      },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    });

    return {
      tasks,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages: Math.ceil(total / validated.limit),
    };
  }

  /**
   * Update task
   */
  async update(
    orgId: string,
    userId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<TaskResult> {
    // Validate input
    const validated = UpdateTaskSchema.parse(input);

    // Check if task exists
    const existing = await this.getById(orgId, taskId);

    // Prepare update data
    const updateData: any = { ...validated };
    
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }
    
    if (validated.reminderAt !== undefined) {
      updateData.reminderAt = validated.reminderAt ? new Date(validated.reminderAt) : null;
    }
    
    if (validated.completedAt !== undefined) {
      updateData.completedAt = validated.completedAt ? new Date(validated.completedAt) : null;
    }

    // Auto-set completedAt when status changes to COMPLETED
    if (validated.status === 'COMPLETED' && !existing.completedAt) {
      updateData.completedAt = new Date();
    }

    // Update task
    const task = await prisma.leadTask.update({
      where: {
        id: taskId,
      },
      data: updateData,
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'task.update',
        entityType: 'leadTask',
        entityId: task.id,
        delta: {
          before: {
            status: existing.status,
            priority: existing.priority,
          },
          after: {
            status: validated.status,
            priority: validated.priority,
          },
        },
      },
    });

    return task;
  }

  /**
   * Delete task
   */
  async delete(orgId: string, userId: string, taskId: string): Promise<void> {
    // Check if task exists
    const existing = await this.getById(orgId, taskId);

    // Delete task
    await prisma.leadTask.delete({
      where: {
        id: taskId,
      },
    });

    // Log in audit
    await prisma.auditLog.create({
      data: {
        orgId,
        actorId: userId,
        action: 'task.delete',
        entityType: 'leadTask',
        entityId: taskId,
        delta: {
          title: existing.title,
          leadId: existing.leadId,
        },
      },
    });
  }
}

// Export singleton instance
export const taskService = new TaskService();

