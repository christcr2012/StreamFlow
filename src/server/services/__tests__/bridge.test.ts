/**
 * Tests for Bridge Services
 * Binder2: Lead→Customer, Job↔CRM, Quote↔Opportunity
 */

import { prisma } from '@/lib/prisma';
import { convertLeadToCustomer } from '../bridge/leadConversionService';
import { linkJobToCRM } from '../bridge/jobLinkService';
import { syncQuoteToOpportunity } from '../bridge/quoteService';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    lead: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      create: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    opportunity: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quote: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock audit service
jest.mock('../auditService', () => ({
  auditLog: jest.fn(),
}));

describe('Bridge Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lead → Customer Conversion', () => {
    it('should convert lead to customer successfully', async () => {
      const mockLead = {
        id: 'lead_123',
        orgId: 'org_test',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        status: 'qualified',
      };

      const mockCustomer = {
        id: 'cust_123',
        orgId: 'org_test',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        leadId: 'lead_123',
      };

      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          customer: { create: jest.fn().mockResolvedValue(mockCustomer) },
          lead: { update: jest.fn().mockResolvedValue({ ...mockLead, status: 'converted' }) },
        });
      });

      const result = await convertLeadToCustomer('org_test', 'lead_123', 'user@example.com');

      expect(result).toEqual({
        success: true,
        customerId: 'cust_123',
        leadId: 'lead_123',
      });
    });

    it('should fail if lead not found', async () => {
      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        convertLeadToCustomer('org_test', 'lead_123', 'user@example.com')
      ).rejects.toThrow('Lead not found');
    });

    it('should fail if lead already converted', async () => {
      const mockLead = {
        id: 'lead_123',
        orgId: 'org_test',
        status: 'converted',
      };

      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead);

      await expect(
        convertLeadToCustomer('org_test', 'lead_123', 'user@example.com')
      ).rejects.toThrow('Lead already converted');
    });
  });

  describe('Job ↔ CRM Linking', () => {
    it('should link job to opportunity successfully', async () => {
      const mockJob = {
        id: 'job_123',
        orgId: 'org_test',
        title: 'Test Job',
      };

      const mockOpportunity = {
        id: 'opp_123',
        orgId: 'org_test',
        title: 'Test Opportunity',
      };

      (prisma.job.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.opportunity.findUnique as jest.Mock).mockResolvedValue(mockOpportunity);
      (prisma.job.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        opportunityId: 'opp_123',
      });

      const result = await linkJobToCRM('org_test', 'job_123', {
        opportunityId: 'opp_123',
      }, 'user@example.com');

      expect(result).toEqual({
        success: true,
        jobId: 'job_123',
        opportunityId: 'opp_123',
      });
    });

    it('should link job to contact successfully', async () => {
      const mockJob = {
        id: 'job_123',
        orgId: 'org_test',
        title: 'Test Job',
      };

      (prisma.job.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.job.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        contactId: 'contact_123',
      });

      const result = await linkJobToCRM('org_test', 'job_123', {
        contactId: 'contact_123',
      }, 'user@example.com');

      expect(result).toEqual({
        success: true,
        jobId: 'job_123',
        contactId: 'contact_123',
      });
    });

    it('should fail if job not found', async () => {
      (prisma.job.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        linkJobToCRM('org_test', 'job_123', { opportunityId: 'opp_123' }, 'user@example.com')
      ).rejects.toThrow('Job not found');
    });
  });

  describe('Quote ↔ Opportunity Sync', () => {
    it('should sync quote to opportunity and update stage', async () => {
      const mockQuote = {
        id: 'quote_123',
        orgId: 'org_test',
        opportunityId: 'opp_123',
        status: 'accepted',
        total: 10000,
      };

      const mockOpportunity = {
        id: 'opp_123',
        orgId: 'org_test',
        stage: 'proposal',
      };

      (prisma.quote.findUnique as jest.Mock).mockResolvedValue(mockQuote);
      (prisma.opportunity.findUnique as jest.Mock).mockResolvedValue(mockOpportunity);
      (prisma.opportunity.update as jest.Mock).mockResolvedValue({
        ...mockOpportunity,
        stage: 'negotiation',
        estValue: 10000,
      });

      const result = await syncQuoteToOpportunity('org_test', 'quote_123', 'user@example.com');

      expect(result).toEqual({
        success: true,
        opportunityId: 'opp_123',
        stageUpdated: true,
        newStage: 'negotiation',
      });
    });

    it('should handle quote without opportunity', async () => {
      const mockQuote = {
        id: 'quote_123',
        orgId: 'org_test',
        opportunityId: null,
        status: 'draft',
      };

      (prisma.quote.findUnique as jest.Mock).mockResolvedValue(mockQuote);

      const result = await syncQuoteToOpportunity('org_test', 'quote_123', 'user@example.com');

      expect(result).toEqual({
        success: true,
        message: 'Quote not linked to opportunity',
      });
    });

    it('should fail if quote not found', async () => {
      (prisma.quote.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        syncQuoteToOpportunity('org_test', 'quote_123', 'user@example.com')
      ).rejects.toThrow('Quote not found');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should enforce orgId isolation in lead conversion', async () => {
      const mockLead = {
        id: 'lead_123',
        orgId: 'org_other',
        status: 'qualified',
      };

      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead);

      await expect(
        convertLeadToCustomer('org_test', 'lead_123', 'user@example.com')
      ).rejects.toThrow('Lead not found');
    });

    it('should enforce orgId isolation in job linking', async () => {
      const mockJob = {
        id: 'job_123',
        orgId: 'org_other',
      };

      (prisma.job.findUnique as jest.Mock).mockResolvedValue(mockJob);

      await expect(
        linkJobToCRM('org_test', 'job_123', { opportunityId: 'opp_123' }, 'user@example.com')
      ).rejects.toThrow('Job not found');
    });
  });

  describe('Transaction Handling', () => {
    it('should rollback on error during lead conversion', async () => {
      const mockLead = {
        id: 'lead_123',
        orgId: 'org_test',
        status: 'qualified',
      };

      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(mockLead);
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        convertLeadToCustomer('org_test', 'lead_123', 'user@example.com')
      ).rejects.toThrow('Database error');
    });
  });
});

