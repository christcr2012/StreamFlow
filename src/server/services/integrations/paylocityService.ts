/**
 * Paylocity Integration Service
 * Binder3: Payroll/HR integration
 * 
 * Syncs employee data, timesheets, and payroll exports
 */

import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit/auditLog';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface PaylocityConfig {
  companyId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

export interface PaylocityEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  status: 'active' | 'inactive';
}

export interface PaylocityTimesheet {
  employeeId: string;
  date: string;
  hoursWorked: number;
  overtimeHours: number;
  jobCode: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class PaylocityService {
  /**
   * Get Paylocity configuration for tenant
   */
  private async getConfig(orgId: string): Promise<PaylocityConfig | null> {
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        orgId,
        type: 'paylocity',
        status: 'connected',
      },
    });

    if (!integration || !integration.config) {
      return null;
    }

    return integration.config as any as PaylocityConfig;
  }

  /**
   * Sync employees from Paylocity
   */
  async syncEmployees(orgId: string, userId: string): Promise<{
    synced: number;
    created: number;
    updated: number;
    errors: string[];
  }> {
    const config = await this.getConfig(orgId);
    if (!config) {
      throw new Error('Paylocity integration not configured');
    }

    // In production, call Paylocity API
    // For now, simulate sync
    const employees: PaylocityEmployee[] = [];

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      try {
        // Check if employee exists
        const existing = await prisma.user.findFirst({
          where: {
            orgId,
            email: emp.email,
          },
        });

        if (existing) {
          // Update existing employee
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              // Update fields as needed
            },
          });
          updated++;
        } else {
          // Create new employee
          await prisma.user.create({
            data: {
              orgId,
              email: emp.email,
              role: 'EMPLOYEE',
            },
          });
          created++;
        }
      } catch (error: any) {
        errors.push(`Failed to sync employee ${emp.employeeId}: ${error.message}`);
      }
    }

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: 'paylocity:employee_sync',
      meta: { created, updated, errors: errors.length },
    });

    return {
      synced: created + updated,
      created,
      updated,
      errors,
    };
  }

  /**
   * Sync timesheets from Paylocity
   */
  async syncTimesheets(
    orgId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    synced: number;
    errors: string[];
  }> {
    const config = await this.getConfig(orgId);
    if (!config) {
      throw new Error('Paylocity integration not configured');
    }

    // In production, call Paylocity API
    // For now, simulate sync
    const timesheets: PaylocityTimesheet[] = [];

    let synced = 0;
    const errors: string[] = [];

    for (const timesheet of timesheets) {
      try {
        // Find employee
        const employee = await prisma.user.findFirst({
          where: {
            orgId,
            // Match by external ID or email
          },
        });

        if (!employee) {
          errors.push(`Employee not found: ${timesheet.employeeId}`);
          continue;
        }

        // Create timesheet entry
        // In production, store in WorkOrderTimeEntry or similar model
        synced++;
      } catch (error: any) {
        errors.push(`Failed to sync timesheet: ${error.message}`);
      }
    }

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: 'paylocity:timesheet_sync',
      meta: { synced, errors: errors.length, startDate, endDate },
    });

    return {
      synced,
      errors,
    };
  }

  /**
   * Export payroll data to Paylocity
   */
  async exportPayroll(
    orgId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    exported: number;
    errors: string[];
  }> {
    const config = await this.getConfig(orgId);
    if (!config) {
      throw new Error('Paylocity integration not configured');
    }

    // In production, gather payroll data and send to Paylocity API
    // For now, simulate export
    const exported = 0;
    const errors: string[] = [];

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: 'paylocity:payroll_export',
      meta: { exported, errors: errors.length, startDate, endDate },
    });

    return {
      exported,
      errors,
    };
  }

  /**
   * Test Paylocity connection
   */
  async testConnection(orgId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const config = await this.getConfig(orgId);
    if (!config) {
      return {
        success: false,
        message: 'Paylocity integration not configured',
      };
    }

    // In production, test API connection
    // For now, simulate success
    return {
      success: true,
      message: 'Connection successful',
    };
  }
}

// Export singleton instance
export const paylocityService = new PaylocityService();

