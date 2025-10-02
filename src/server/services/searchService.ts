// src/server/services/searchService.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ServiceError } from './authService';

// Re-export ServiceError for convenience
export { ServiceError };

// ===== TYPES & SCHEMAS =====

export const SearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  entities: z.array(z.enum(['organizations', 'contacts', 'opportunities', 'tasks'])).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchInput = z.infer<typeof SearchSchema>;

export interface SearchResultItem {
  id: string;
  type: 'organization' | 'contact' | 'opportunity' | 'task';
  title: string;
  subtitle?: string;
  description?: string;
  relevance: number;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  query: string;
  results: SearchResultItem[];
  total: number;
  byType: {
    organizations: number;
    contacts: number;
    opportunities: number;
    tasks: number;
  };
}

// ===== SEARCH SERVICE =====

export class SearchService {
  /**
   * Global search across multiple entities
   */
  async search(orgId: string, input: SearchInput): Promise<SearchResult> {
    // Validate input
    const validated = SearchSchema.parse(input);

    const { query, entities, limit } = validated;
    const searchTerm = `%${query.toLowerCase()}%`;

    // Determine which entities to search
    const searchEntities = entities || ['organizations', 'contacts', 'opportunities', 'tasks'];

    const results: SearchResultItem[] = [];
    const byType = {
      organizations: 0,
      contacts: 0,
      opportunities: 0,
      tasks: 0,
    };

    // Search Organizations (Customer model)
    if (searchEntities.includes('organizations')) {
      const organizations = await prisma.customer.findMany({
        where: {
          orgId,
          OR: [
            { company: { contains: query, mode: 'insensitive' } },
            { primaryName: { contains: query, mode: 'insensitive' } },
            { primaryEmail: { contains: query, mode: 'insensitive' } },
            { primaryPhone: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });

      byType.organizations = organizations.length;

      organizations.forEach(org => {
        results.push({
          id: org.id,
          type: 'organization',
          title: org.company || org.primaryName || 'Unnamed Organization',
          subtitle: org.primaryEmail || org.primaryPhone || undefined,
          description: org.notes || undefined,
          relevance: this.calculateRelevance(query, [
            org.company,
            org.primaryName,
            org.primaryEmail,
          ]),
          metadata: {
            publicId: org.publicId,
            createdAt: org.createdAt,
          },
        });
      });
    }

    // Search Contacts
    if (searchEntities.includes('contacts')) {
      const contacts = await prisma.contact.findMany({
        where: {
          orgId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { department: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });

      byType.contacts = contacts.length;

      contacts.forEach(contact => {
        results.push({
          id: contact.id,
          type: 'contact',
          title: contact.name,
          subtitle: contact.title || contact.email || undefined,
          description: contact.notes || undefined,
          relevance: this.calculateRelevance(query, [
            contact.name,
            contact.email,
            contact.title,
          ]),
          metadata: {
            organizationId: contact.organizationId,
            status: contact.status,
            createdAt: contact.createdAt,
          },
        });
      });
    }

    // Search Opportunities
    if (searchEntities.includes('opportunities')) {
      const opportunities = await prisma.opportunity.findMany({
        where: {
          orgId,
          OR: [
            { stage: { contains: query, mode: 'insensitive' } },
            { customerId: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        include: {
          customer: {
            select: {
              company: true,
              primaryName: true,
            },
          },
        },
      });

      byType.opportunities = opportunities.length;

      opportunities.forEach(opp => {
        const customerName = opp.customer
          ? (opp.customer.company || opp.customer.primaryName || 'Unknown')
          : 'Unknown';

        results.push({
          id: opp.id,
          type: 'opportunity',
          title: `${customerName} - ${opp.stage}`,
          subtitle: `${opp.valueType} - $${opp.estValue?.toString() || '0'}`,
          relevance: this.calculateRelevance(query, [
            opp.stage,
            opp.customer?.company || '',
          ]),
          metadata: {
            customerId: opp.customerId,
            stage: opp.stage,
            estValue: opp.estValue?.toString(),
            createdAt: opp.createdAt,
          },
        });
      });
    }

    // Search Tasks
    if (searchEntities.includes('tasks')) {
      const tasks = await prisma.leadTask.findMany({
        where: {
          orgId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      });

      byType.tasks = tasks.length;

      tasks.forEach(task => {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: `${task.priority} - ${task.status}`,
          description: task.description || undefined,
          relevance: this.calculateRelevance(query, [
            task.title,
            task.description,
          ]),
          metadata: {
            leadId: task.leadId,
            assignedTo: task.assignedTo,
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
          },
        });
      });
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Limit total results
    const limitedResults = results.slice(0, limit);

    return {
      query,
      results: limitedResults,
      total: results.length,
      byType,
    };
  }

  /**
   * Calculate relevance score for search result
   */
  private calculateRelevance(query: string, fields: (string | null | undefined)[]): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    fields.forEach((field, index) => {
      if (!field) return;

      const lowerField = field.toLowerCase();

      // Exact match
      if (lowerField === lowerQuery) {
        score += 100;
      }
      // Starts with query
      else if (lowerField.startsWith(lowerQuery)) {
        score += 50;
      }
      // Contains query
      else if (lowerField.includes(lowerQuery)) {
        score += 25;
      }

      // Weight earlier fields more heavily
      score *= (1 - index * 0.1);
    });

    return score;
  }
}

// Export singleton instance
export const searchService = new SearchService();

