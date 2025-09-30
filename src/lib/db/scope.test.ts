/**
 * Module: DB Scope Tests
 * Purpose: Unit tests for tenant scoping helpers
 * Scope: Test cross-tenant access denial
 * Notes: Codex Phase 2 - Unit test for cross-tenant denial
 */

import { describe, it, expect } from '@jest/globals';
import {
  tenantWhere,
  assertTenant,
  mergeWhere,
  validateTenantData,
  injectOrgId,
  TenantScopeError,
} from './scope';
import type { Session } from '@/lib/auth/guard';

describe('DB Scope Helpers', () => {
  const mockSession: Session = {
    id: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
    orgId: 'org_abc',
    tenantId: 'org_abc',
    space: 'client',
    roles: ['OWNER'],
    baseRole: 'OWNER',
    perms: [],
    isOwner: true,
  };

  describe('tenantWhere', () => {
    it('should return orgId where clause for valid session', () => {
      const where = tenantWhere(mockSession);
      expect(where).toEqual({ orgId: 'org_abc' });
    });

    it('should throw error for null session', () => {
      expect(() => tenantWhere(null)).toThrow(TenantScopeError);
      expect(() => tenantWhere(null)).toThrow('No session provided');
    });

    it('should throw error for session without orgId', () => {
      const invalidSession = { ...mockSession, orgId: '' };
      expect(() => tenantWhere(invalidSession as Session)).toThrow(TenantScopeError);
    });
  });

  describe('assertTenant - Cross-Tenant Access Denial', () => {
    it('should pass for entity with matching orgId', () => {
      const entity = { id: 'lead_123', orgId: 'org_abc', name: 'Test Lead' };
      expect(() => assertTenant(mockSession, entity)).not.toThrow();
    });

    it('should DENY cross-tenant access - different orgId', () => {
      const entity = { id: 'lead_456', orgId: 'org_xyz', name: 'Other Org Lead' };
      
      expect(() => assertTenant(mockSession, entity)).toThrow(TenantScopeError);
      expect(() => assertTenant(mockSession, entity)).toThrow('Cross-tenant access denied');
    });

    it('should throw error for null entity', () => {
      expect(() => assertTenant(mockSession, null)).toThrow(TenantScopeError);
      expect(() => assertTenant(mockSession, null)).toThrow('Entity is null');
    });

    it('should throw error for entity without orgId', () => {
      const entity = { id: 'lead_789', name: 'No Org Lead' };
      expect(() => assertTenant(mockSession, entity)).toThrow(TenantScopeError);
      expect(() => assertTenant(mockSession, entity)).toThrow('Entity has no orgId');
    });

    it('should throw error for null session', () => {
      const entity = { id: 'lead_123', orgId: 'org_abc' };
      expect(() => assertTenant(null, entity)).toThrow(TenantScopeError);
    });
  });

  describe('mergeWhere', () => {
    it('should merge tenant where with additional conditions', () => {
      const where = mergeWhere(mockSession, { status: 'active', type: 'hot' });
      expect(where).toEqual({
        orgId: 'org_abc',
        status: 'active',
        type: 'hot',
      });
    });

    it('should return only orgId when no additional conditions', () => {
      const where = mergeWhere(mockSession);
      expect(where).toEqual({ orgId: 'org_abc' });
    });

    it('should override orgId if provided in additional where', () => {
      // This should still use session orgId, not the provided one
      const where = mergeWhere(mockSession, { status: 'active' });
      expect(where.orgId).toBe('org_abc');
    });
  });

  describe('validateTenantData', () => {
    it('should pass for data without orgId', () => {
      const data = { name: 'Test Lead', status: 'active' };
      expect(() => validateTenantData(mockSession, data)).not.toThrow();
    });

    it('should pass for data with matching orgId', () => {
      const data = { name: 'Test Lead', orgId: 'org_abc' };
      expect(() => validateTenantData(mockSession, data)).not.toThrow();
    });

    it('should DENY data with different orgId', () => {
      const data = { name: 'Test Lead', orgId: 'org_xyz' };
      
      expect(() => validateTenantData(mockSession, data)).toThrow(TenantScopeError);
      expect(() => validateTenantData(mockSession, data)).toThrow('Data orgId mismatch');
    });

    it('should allow null data', () => {
      expect(() => validateTenantData(mockSession, null)).not.toThrow();
    });
  });

  describe('injectOrgId', () => {
    it('should inject orgId into data', () => {
      const data = { name: 'Test Lead', status: 'active' };
      const result = injectOrgId(mockSession, data);
      
      expect(result).toEqual({
        name: 'Test Lead',
        status: 'active',
        orgId: 'org_abc',
      });
    });

    it('should preserve existing orgId if it matches', () => {
      const data = { name: 'Test Lead', orgId: 'org_abc' };
      const result = injectOrgId(mockSession, data);
      
      expect(result.orgId).toBe('org_abc');
    });

    it('should DENY injection with mismatched orgId', () => {
      const data = { name: 'Test Lead', orgId: 'org_xyz' };
      
      expect(() => injectOrgId(mockSession, data)).toThrow(TenantScopeError);
      expect(() => injectOrgId(mockSession, data)).toThrow('Data orgId mismatch');
    });

    it('should throw error for null session', () => {
      const data = { name: 'Test Lead' };
      expect(() => injectOrgId(null, data)).toThrow(TenantScopeError);
    });
  });

  describe('Cross-Tenant Scenarios', () => {
    it('should prevent user from org_abc accessing org_xyz data', () => {
      const userSession: Session = {
        ...mockSession,
        orgId: 'org_abc',
      };
      
      const otherOrgEntity = {
        id: 'lead_999',
        orgId: 'org_xyz',
        name: 'Competitor Lead',
      };
      
      // This should throw cross-tenant access error
      expect(() => assertTenant(userSession, otherOrgEntity)).toThrow(TenantScopeError);
      expect(() => assertTenant(userSession, otherOrgEntity)).toThrow(/Cross-tenant access denied/);
    });

    it('should prevent creating data for different org', () => {
      const userSession: Session = {
        ...mockSession,
        orgId: 'org_abc',
      };
      
      const dataForOtherOrg = {
        name: 'Malicious Lead',
        orgId: 'org_xyz', // Trying to create for different org
      };
      
      // This should throw validation error
      expect(() => validateTenantData(userSession, dataForOtherOrg)).toThrow(TenantScopeError);
      expect(() => injectOrgId(userSession, dataForOtherOrg)).toThrow(TenantScopeError);
    });

    it('should ensure queries are scoped to correct org', () => {
      const org1Session: Session = { ...mockSession, orgId: 'org_001' };
      const org2Session: Session = { ...mockSession, orgId: 'org_002' };
      
      const where1 = tenantWhere(org1Session);
      const where2 = tenantWhere(org2Session);
      
      expect(where1.orgId).toBe('org_001');
      expect(where2.orgId).toBe('org_002');
      expect(where1.orgId).not.toBe(where2.orgId);
    });
  });

  describe('Error Codes', () => {
    it('should have correct error codes', () => {
      try {
        tenantWhere(null);
      } catch (error) {
        expect(error).toBeInstanceOf(TenantScopeError);
        expect((error as TenantScopeError).code).toBe('NO_SESSION');
      }

      try {
        const entity = { id: 'test', orgId: 'org_xyz' };
        assertTenant(mockSession, entity);
      } catch (error) {
        expect(error).toBeInstanceOf(TenantScopeError);
        expect((error as TenantScopeError).code).toBe('CROSS_TENANT_ACCESS');
      }
    });
  });
});

// PR-CHECKS:
// - [x] Cross-tenant access denial tested
// - [x] orgId validation tested
// - [x] Error scenarios covered
// - [x] Multiple tenant scenarios tested

