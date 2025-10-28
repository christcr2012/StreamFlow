import { test, expect } from "@playwright/test";

/**
 * API Smoke Tests for Provider Portal Federation Routes
 *
 * Phase 1 scaffolds: validates route existence, auth checks, and basic response structure
 */

test.describe("Provider Portal - Federation API Smoke Tests", () => {
  const BASE_URL =
    process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3001";

  test.describe("Anonymous requests should be rejected", () => {
    test("GET /api/federation/analytics should require auth", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE_URL}/api/federation/analytics`,
      );
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("GET /api/federation/events should require auth", async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/federation/events`);
      expect(response.status()).toBe(401);
    });

    test("GET /api/federation/status should require auth", async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/federation/status`);
      expect(response.status()).toBe(401);
    });

    test("GET /api/federation/usage should require auth", async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/federation/usage`);
      expect(response.status()).toBe(401);
    });

    test("GET /api/federation/billing/invoice should require auth", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE_URL}/api/federation/billing/invoice`,
      );
      expect(response.status()).toBe(401);
    });

    test("POST /api/federation/billing/invoice should require auth", async ({
      request,
    }) => {
      const response = await request.post(
        `${BASE_URL}/api/federation/billing/invoice`,
        {
          data: { tenantId: "test", amount: 100 },
        },
      );
      expect(response.status()).toBe(401);
    });

    test("GET /api/fed/developers should require auth", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/fed/developers`);
      expect(response.status()).toBe(401);
    });

    test("GET /api/fed/providers should require auth", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/fed/providers`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe("With provider auth (if available)", () => {
    test.skip("Analytics endpoint should return valid structure", async ({
      request,
    }) => {
      // Skip unless provider auth is configured
      const providerToken = process.env.TEST_PROVIDER_TOKEN;
      if (!providerToken) {
        test.skip();
        return;
      }

      const response = await request.get(
        `${BASE_URL}/api/federation/analytics`,
        {
          headers: { Cookie: `provider-session=${providerToken}` },
        },
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.metric).toBeDefined();
      expect(body.data.window).toBeDefined();
      expect(body.data.series).toBeDefined();
    });

    test.skip("Status endpoint should return federation flags", async ({
      request,
    }) => {
      const providerToken = process.env.TEST_PROVIDER_TOKEN;
      if (!providerToken) {
        test.skip();
        return;
      }

      const response = await request.get(`${BASE_URL}/api/federation/status`, {
        headers: { Cookie: `provider-session=${providerToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.data.federationEnabled).toBeDefined();
      expect(body.data.components).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });
  });

  test.describe("Route existence checks", () => {
    test("Federation analytics route exists", async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/federation/analytics`,
      );
      // Should not be 404; auth rejection is 401
      expect(response.status()).not.toBe(404);
    });

    test("Federation events route exists", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/federation/events`);
      expect(response.status()).not.toBe(404);
    });

    test("Federation status route exists", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/federation/status`);
      expect(response.status()).not.toBe(404);
    });

    test("Federation usage route exists", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/federation/usage`);
      expect(response.status()).not.toBe(404);
    });

    test("Federation billing invoice route exists", async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/federation/billing/invoice`,
      );
      expect(response.status()).not.toBe(404);
    });

    test("Fed developers route exists", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/fed/developers`);
      expect(response.status()).not.toBe(404);
    });

    test("Fed providers route exists", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/fed/providers`);
      expect(response.status()).not.toBe(404);
    });
  });
});
