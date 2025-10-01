// src/server/services/importService.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';

// Re-export ServiceError for convenience
export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const ImportContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  title: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  organizationId: z.string().optional().or(z.literal('')),
  mobilePhone: z.string().optional().or(z.literal('')),
  workPhone: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type ImportContactInput = z.infer<typeof ImportContactSchema>;

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  imported: Array<{
    row: number;
    id: string;
    name: string;
  }>;
}

// ===== IMPORT SERVICE =====

export class ImportService {
  /**
   * Parse CSV content into rows
   */
  private parseCSV(content: string): string[][] {
    const lines = content.split('\n').filter(line => line.trim());
    const rows: string[][] = [];

    for (const line of lines) {
      // Simple CSV parsing (handles quoted fields)
      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      row.push(current.trim());
      rows.push(row);
    }

    return rows;
  }

  /**
   * Map CSV row to contact object
   */
  private mapRowToContact(headers: string[], row: string[]): Record<string, string> {
    const contact: Record<string, string> = {};

    headers.forEach((header, index) => {
      const value = row[index] || '';
      const normalizedHeader = header.toLowerCase().trim();

      // Map common header variations
      if (normalizedHeader === 'name' || normalizedHeader === 'full name' || normalizedHeader === 'contact name') {
        contact.name = value;
      } else if (normalizedHeader === 'email' || normalizedHeader === 'email address') {
        contact.email = value;
      } else if (normalizedHeader === 'phone' || normalizedHeader === 'phone number') {
        contact.phone = value;
      } else if (normalizedHeader === 'title' || normalizedHeader === 'job title') {
        contact.title = value;
      } else if (normalizedHeader === 'department') {
        contact.department = value;
      } else if (normalizedHeader === 'organization' || normalizedHeader === 'company' || normalizedHeader === 'organization id') {
        contact.organizationId = value;
      } else if (normalizedHeader === 'mobile' || normalizedHeader === 'mobile phone') {
        contact.mobilePhone = value;
      } else if (normalizedHeader === 'work phone' || normalizedHeader === 'office phone') {
        contact.workPhone = value;
      } else if (normalizedHeader === 'website' || normalizedHeader === 'web') {
        contact.website = value;
      } else if (normalizedHeader === 'notes' || normalizedHeader === 'comments') {
        contact.notes = value;
      }
    });

    return contact;
  }

  /**
   * Import contacts from CSV
   */
  async importContacts(
    orgId: string,
    userId: string,
    csvContent: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      imported: [],
    };

    try {
      // Parse CSV
      const rows = this.parseCSV(csvContent);

      if (rows.length === 0) {
        throw new ServiceError(
          'CSV file is empty',
          'INVALID_INPUT',
          400
        );
      }

      // First row is headers
      const headers = rows[0];
      const dataRows = rows.slice(1);

      result.totalRows = dataRows.length;

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        const rowNumber = i + 2; // +2 because: +1 for 1-based indexing, +1 for header row
        const row = dataRows[i];

        try {
          // Map row to contact
          const contactData = this.mapRowToContact(headers, row);

          // Validate
          const validated = ImportContactSchema.parse(contactData);

          // Check if organization exists (if provided)
          if (validated.organizationId) {
            const org = await prisma.customer.findUnique({
              where: {
                orgId_id: {
                  orgId,
                  id: validated.organizationId,
                },
              },
            });

            if (!org) {
              throw new Error(`Organization ${validated.organizationId} not found`);
            }
          }

          // Create contact
          const contact = await prisma.contact.create({
            data: {
              orgId,
              name: validated.name,
              email: validated.email || null,
              phone: validated.phone || null,
              title: validated.title || null,
              department: validated.department || null,
              organizationId: validated.organizationId || null,
              mobilePhone: validated.mobilePhone || null,
              workPhone: validated.workPhone || null,
              website: validated.website || null,
              notes: validated.notes || null,
              ownerId: userId,
            },
          });

          result.successCount++;
          result.imported.push({
            row: rowNumber,
            id: contact.id,
            name: contact.name,
          });

        } catch (error) {
          result.errorCount++;
          result.errors.push({
            row: rowNumber,
            data: row,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log in audit
      await prisma.auditLog.create({
        data: {
          orgId,
          actorId: userId,
          action: 'contacts.import',
          entityType: 'contact',
          entityId: 'bulk',
          delta: {
            totalRows: result.totalRows,
            successCount: result.successCount,
            errorCount: result.errorCount,
          },
        },
      });

      // Mark as failed if more than 50% errors
      if (result.errorCount > result.totalRows / 2) {
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.errors.push({
        row: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Validate CSV format before import
   */
  async validateCSV(csvContent: string): Promise<{
    valid: boolean;
    headers: string[];
    rowCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const rows = this.parseCSV(csvContent);

      if (rows.length === 0) {
        errors.push('CSV file is empty');
        return { valid: false, headers: [], rowCount: 0, errors };
      }

      const headers = rows[0];
      const rowCount = rows.length - 1;

      // Check for required headers
      const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
      const hasName = normalizedHeaders.some(h =>
        h === 'name' || h === 'full name' || h === 'contact name'
      );

      if (!hasName) {
        errors.push('CSV must have a "name" column');
      }

      // Check for empty rows
      const dataRows = rows.slice(1);
      const emptyRows = dataRows.filter(row => row.every(cell => !cell.trim()));
      if (emptyRows.length > 0) {
        errors.push(`Found ${emptyRows.length} empty rows`);
      }

      return {
        valid: errors.length === 0,
        headers,
        rowCount,
        errors,
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return { valid: false, headers: [], rowCount: 0, errors };
    }
  }
}

// Export singleton instance
export const importService = new ImportService();

