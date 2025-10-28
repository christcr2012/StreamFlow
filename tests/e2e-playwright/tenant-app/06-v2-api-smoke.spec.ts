import { test, expect } from "@playwright/test";

/**
 * API Smoke Tests for Tenant App v2 API Routes
 *
 * Phase 1 scaffolds: validates route existence, auth checks, and basic CRUD operations
 */

test.describe("Tenant App - v2 API Smoke Tests", () => {
  const BASE_URL =
    process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

  test.describe("Anonymous requests should be rejected", () => {
    test("GET /api/v2/leads should require auth", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v2/leads`);
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test("GET /api/v2/opportunities should require auth", async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v2/opportunities`);
      expect(response.status()).toBe(401);
    });

    test("GET /api/v2/organizations should require auth", async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/v2/organizations`);
      expect(response.status()).toBe(401);
    });

    test("POST /api/v2/leads should require auth", async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/v2/leads`, {
        data: { name: "Test Lead", contact: { email: "test@example.com" } },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe("ID route auth checks", () => {
    test("GET /api/v2/leads/[id] should require auth", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v2/leads/test-id`);
      expect(response.status()).toBe(401);
    });

    test("PATCH /api/v2/leads/[id] should require auth", async ({
      request,
    }) => {
      const response = await request.patch(`${BASE_URL}/api/v2/leads/test-id`, {
        data: { status: "CONTACTED" },
      });
      expect(response.status()).toBe(401);
    });

    test("DELETE /api/v2/leads/[id] should require auth", async ({
      request,
    }) => {
      const response = await request.delete(`${BASE_URL}/api/v2/leads/test-id`);
      expect(response.status()).toBe(401);
    });

    test("GET /api/v2/opportunities/[id] should require auth", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE_URL}/api/v2/opportunities/test-id`,
      );
      expect(response.status()).toBe(401);
    });

    test("PATCH /api/v2/opportunities/[id] should require auth", async ({
      request,
    }) => {
      const response = await request.patch(
        `${BASE_URL}/api/v2/opportunities/test-id`,
        {
          data: { stage: "NEGOTIATION" },
        },
      );
      expect(response.status()).toBe(401);
    });

    test("DELETE /api/v2/opportunities/[id] should require auth", async ({
      request,
    }) => {
      const response = await request.delete(
        `${BASE_URL}/api/v2/opportunities/test-id`,
      );
      expect(response.status()).toBe(401);
    });

    test("GET /api/v2/organizations/[id] should require auth", async ({
      request,
    }) => {
      const response = await request.get(
        `${BASE_URL}/api/v2/organizations/test-id`,
      );
      expect(response.status()).toBe(401);
    });

    test("PATCH /api/v2/organizations/[id] should require auth", async ({
      request,
    }) => {
      const response = await request.patch(
        `${BASE_URL}/api/v2/organizations/test-id`,
        {
          data: { name: "Updated Org" },
        },
      );
      expect(response.status()).toBe(401);
    });
  });

  test.describe("Route existence checks", () => {
    test("Leads list route exists", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v2/leads`);
      // Should not be 404; auth rejection is 401
      expect(response.status()).not.toBe(404);
    });

    test("Opportunities list route exists", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v2/opportunities`);
      expect(response.status()).not.toBe(404);
    });

    test("Organizations list route exists", async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v2/organizations`);
      expect(response.status()).not.toBe(404);
    });

    test("Lead detail route exists", async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/v2/leads/nonexistent-id`,
      );
      expect(response.status()).not.toBe(404);
    });

    test("Opportunity detail route exists", async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/v2/opportunities/nonexistent-id`,
      );
      expect(response.status()).not.toBe(404);
    });

    test("Organization detail route exists", async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/v2/organizations/nonexistent-id`,
      );
      expect(response.status()).not.toBe(404);
    });
  });

  test.describe("With tenant auth (if available)", () => {
    test.skip("Leads list should return valid structure", async ({
      request,
    }) => {
      const tenantToken = process.env.TEST_TENANT_TOKEN;
      if (!tenantToken) {
        test.skip();
        return;
      }

      const response = await request.get(`${BASE_URL}/api/v2/leads`, {
        headers: { Cookie: `mv_user=${tenantToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
    });

    test.skip("Organizations endpoint should return current org", async ({
      request,
    }) => {
      const tenantToken = process.env.TEST_TENANT_TOKEN;
      if (!tenantToken) {
        test.skip();
        return;
      }

      const response = await request.get(`${BASE_URL}/api/v2/organizations`, {
        headers: { Cookie: `mv_user=${tenantToken}` },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.item).toBeDefined();
      expect(body.item.id).toBeDefined();
      expect(body.item.name).toBeDefined();
    });
  });

  test.describe("Input validation checks", () => {
    test.skip("POST /api/v2/leads should validate required fields", async ({
      request,
    }) => {
      const tenantToken = process.env.TEST_TENANT_TOKEN;
      if (!tenantToken) {
        test.skip();
        return;
      }

      // Missing required 'name' field
      const response = await request.post(`${BASE_URL}/api/v2/leads`, {
        headers: { Cookie: `mv_user=${tenantToken}` },
        data: { contact: { email: "test@example.com" } },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test.skip("PATCH /api/v2/leads/[id] should validate input types", async ({
      request,
    }) => {
      const tenantToken = process.env.TEST_TENANT_TOKEN;
      if (!tenantToken) {
        test.skip();
        return;
      }

      // Invalid aiScore (exceeds max)
      const response = await request.patch(`${BASE_URL}/api/v2/leads/test-id`, {
        headers: { Cookie: `mv_user=${tenantToken}` },
        data: { aiScore: 150 },
      });

      // Should be either 400 (validation) or 404 (not found)
      expect([400, 404]).toContain(response.status());
    });
  });
});
