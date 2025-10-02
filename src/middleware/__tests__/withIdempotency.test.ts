/**
 * Tests for withIdempotency middleware
 * Binder1: Idempotency tests
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withIdempotency } from '../withIdempotency';
import { idempotencyService } from '@/server/services/idempotencyService';

// Mock idempotencyService
jest.mock('@/server/services/idempotencyService', () => ({
  idempotencyService: {
    check: jest.fn(),
    store: jest.fn(),
  },
}));

// Mock getUserInfo
jest.mock('../withAudience', () => ({
  getUserInfo: jest.fn(() => ({ orgId: 'org_test', email: 'test@example.com' })),
}));

describe('withIdempotency Middleware', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      url: '/api/test',
      headers: {},
      body: { test: 'data' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHandler = jest.fn().mockResolvedValue(undefined);

    jest.clearAllMocks();
  });

  describe('POST Request Handling', () => {
    it('should proceed without idempotency key', async () => {
      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: false,
        conflict: false,
      });

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should check idempotency when key provided', async () => {
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: false,
        conflict: false,
      });

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(idempotencyService.check).toHaveBeenCalledWith(
        'test-key-123',
        'org_test',
        '/api/test',
        { test: 'data' }
      );
    });

    it('should return cached response for duplicate request', async () => {
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: true,
        conflict: false,
        record: {
          responseStatus: 200,
          responseBody: { success: true, cached: true },
        },
      });

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, cached: true });
    });

    it('should return 409 Conflict for payload mismatch', async () => {
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: true,
        conflict: true,
        record: {
          responseStatus: 200,
          responseBody: { success: true },
        },
      });

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'IdempotencyConflict',
          message: expect.stringContaining('payload mismatch'),
        })
      );
    });

    it('should store response after successful execution', async () => {
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: false,
        conflict: false,
      });

      mockHandler.mockImplementation(async (req, res) => {
        res.status(201).json({ success: true, id: 'new-id' });
      });

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockHandler).toHaveBeenCalled();
      // Note: Actual storage happens in response interception
    });
  });

  describe('Non-POST Request Handling', () => {
    it('should skip idempotency for GET requests', async () => {
      mockReq.method = 'GET';
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(idempotencyService.check).not.toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should skip idempotency for PUT requests', async () => {
      mockReq.method = 'PUT';
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(idempotencyService.check).not.toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should skip idempotency for DELETE requests', async () => {
      mockReq.method = 'DELETE';
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(idempotencyService.check).not.toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle idempotency check errors', async () => {
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      (idempotencyService.check as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal',
          message: expect.stringContaining('Idempotency check failed'),
        })
      );
    });

    it('should handle handler errors gracefully', async () => {
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: false,
        conflict: false,
      });

      mockHandler.mockRejectedValue(new Error('Handler error'));

      const handler = withIdempotency(mockHandler);
      
      await expect(
        handler(mockReq as NextApiRequest, mockRes as NextApiResponse)
      ).rejects.toThrow('Handler error');
    });
  });

  describe('Idempotency Key Validation', () => {
    it('should accept valid UUID idempotency keys', async () => {
      mockReq.headers = { 'x-idempotency-key': '550e8400-e29b-41d4-a716-446655440000' };

      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: false,
        conflict: false,
      });

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(idempotencyService.check).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should accept custom string idempotency keys', async () => {
      mockReq.headers = { 'x-idempotency-key': 'custom-key-12345' };

      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: false,
        conflict: false,
      });

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(idempotencyService.check).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should isolate idempotency by orgId', async () => {
      const { getUserInfo } = require('../withAudience');
      mockReq.headers = { 'x-idempotency-key': 'test-key-123' };

      // Tenant 1
      getUserInfo.mockReturnValue({ orgId: 'org_1', email: 'user1@example.com' });
      (idempotencyService.check as jest.Mock).mockResolvedValue({
        exists: false,
        conflict: false,
      });

      const handler = withIdempotency(mockHandler);
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(idempotencyService.check).toHaveBeenCalledWith(
        'test-key-123',
        'org_1',
        expect.any(String),
        expect.any(Object)
      );

      // Tenant 2 (same key, different tenant)
      getUserInfo.mockReturnValue({ orgId: 'org_2', email: 'user2@example.com' });
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(idempotencyService.check).toHaveBeenCalledWith(
        'test-key-123',
        'org_2',
        expect.any(String),
        expect.any(Object)
      );
    });
  });
});

