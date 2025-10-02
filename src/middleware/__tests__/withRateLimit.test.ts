/**
 * Tests for withRateLimit middleware
 * Binder1: Rate limiting tests
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimit, RATE_LIMIT_CONFIGS, clearAllRateLimits } from '../withRateLimit';

// Mock getUserInfo
jest.mock('../withAudience', () => ({
  getUserInfo: jest.fn(() => ({ orgId: 'org_test', email: 'test@example.com' })),
}));

describe('withRateLimit Middleware', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    clearAllRateLimits();
    
    mockReq = {
      method: 'POST',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockHandler = jest.fn();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  describe('Rate Limit Enforcement', () => {
    it('should allow requests within limit', async () => {
      const handler = withRateLimit(RATE_LIMIT_CONFIGS.DEFAULT, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 60);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 59);
    });

    it('should block requests exceeding limit', async () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      const handler = withRateLimit(config, mockHandler);

      // Make 2 requests (within limit)
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockHandler).toHaveBeenCalledTimes(2);

      // 3rd request should be blocked
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'TooManyRequests',
          message: 'Rate limit exceeded',
        })
      );
    });

    it('should include Retry-After header when rate limited', async () => {
      const config = { windowMs: 60000, maxRequests: 1 };
      const handler = withRateLimit(config, mockHandler);

      // First request succeeds
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      // Second request is rate limited
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
    });

    it('should reset limit after window expires', async () => {
      const config = { windowMs: 100, maxRequests: 1 }; // 100ms window
      const handler = withRateLimit(config, mockHandler);

      // First request
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Second request immediately (should be blocked)
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(mockRes.status).toHaveBeenCalledWith(429);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Third request after window (should succeed)
      mockRes.status = jest.fn().mockReturnThis();
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should set X-RateLimit-* headers on all responses', async () => {
      const handler = withRateLimit(RATE_LIMIT_CONFIGS.DEFAULT, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });

    it('should decrement remaining count on each request', async () => {
      const handler = withRateLimit(RATE_LIMIT_CONFIGS.DEFAULT, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 59);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 58);
    });
  });

  describe('Rate Limit Configurations', () => {
    it('should respect DEFAULT config (60 req/min)', async () => {
      const handler = withRateLimit(RATE_LIMIT_CONFIGS.DEFAULT, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 60);
    });

    it('should respect STRICT config (30 req/min)', async () => {
      const handler = withRateLimit(RATE_LIMIT_CONFIGS.STRICT, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 30);
    });

    it('should respect RELAXED config (120 req/min)', async () => {
      const handler = withRateLimit(RATE_LIMIT_CONFIGS.RELAXED, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 120);
    });

    it('should respect AI_HEAVY config (10 req/min)', async () => {
      const handler = withRateLimit(RATE_LIMIT_CONFIGS.AI_HEAVY, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    });
  });

  describe('Per-Tenant Isolation', () => {
    it('should track limits separately per tenant', async () => {
      const { getUserInfo } = require('../withAudience');
      const handler = withRateLimit(
        { windowMs: 60000, maxRequests: 1 },
        mockHandler
      );

      // Tenant 1
      getUserInfo.mockReturnValue({ orgId: 'org_1', email: 'user1@example.com' });
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Tenant 2 (different tenant, should not be rate limited)
      getUserInfo.mockReturnValue({ orgId: 'org_2', email: 'user2@example.com' });
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const { getUserInfo } = require('../withAudience');
      getUserInfo.mockImplementation(() => {
        throw new Error('Test error');
      });

      const handler = withRateLimit(RATE_LIMIT_CONFIGS.DEFAULT, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal',
          message: 'Rate limit check failed',
        })
      );
    });
  });

  describe('Custom Key Generators', () => {
    it('should support custom key generator', async () => {
      const customKeyGen = jest.fn(() => 'custom-key');
      const config = {
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: customKeyGen,
      };
      const handler = withRateLimit(config, mockHandler);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(customKeyGen).toHaveBeenCalledWith(mockReq);
      expect(mockHandler).toHaveBeenCalled();
    });
  });
});

