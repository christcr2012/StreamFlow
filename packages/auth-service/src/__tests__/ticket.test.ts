/**
 * Tests for auth ticket issue/verify flow
 */

import { issueAuthTicket, verifyAuthTicket } from "../ticket";

describe("Auth Ticket", () => {
  const testSecret = "test-hmac-secret-key-for-testing-only";
  const testAudience = "tenant-app";

  describe("issueAuthTicket", () => {
    it("should issue a valid ticket", async () => {
      const { token } = await issueAuthTicket(
        "test@example.com",
        "provider",
        testAudience,
        testSecret,
      );

      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token!.split(".").length).toBe(3); // JWT format: header.payload.signature
    });

    it("should include expiry in the ticket", async () => {
      const { token, exp } = await issueAuthTicket(
        "test@example.com",
        "developer",
        testAudience,
        testSecret,
      );

      // Function should return exp
      expect(exp).toBeTruthy();
      expect(exp!).toBeGreaterThan(Date.now() / 1000);

      // Decode payload (base64url) and verify exp is present
      const parts = token!.split(".");
      const payloadJson = JSON.parse(
        Buffer.from(parts[1], "base64url").toString(),
      );

      expect(payloadJson.exp).toBeTruthy();
      expect(payloadJson.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe("verifyAuthTicket", () => {
    it("should verify a valid ticket", async () => {
      const { token } = await issueAuthTicket(
        "test@example.com",
        "provider",
        testAudience,
        testSecret,
      );

      const result = await verifyAuthTicket(token!, testSecret, testAudience);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeTruthy();
      expect(result.payload?.sub).toBe("test@example.com");
      expect(result.payload?.role).toBe("provider");
    });

    it("should reject ticket with wrong secret", async () => {
      const { token } = await issueAuthTicket(
        "test@example.com",
        "provider",
        testAudience,
        testSecret,
      );

      const result = await verifyAuthTicket(
        token!,
        "wrong-secret",
        testAudience,
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should reject ticket with wrong audience", async () => {
      const { token } = await issueAuthTicket(
        "test@example.com",
        "provider",
        testAudience,
        testSecret,
      );

      const result = await verifyAuthTicket(
        token!,
        testSecret,
        "wrong-audience",
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain("audience");
    });

    it("should prevent replay attacks with nonce store", async () => {
      const { token } = await issueAuthTicket(
        "test@example.com",
        "provider",
        testAudience,
        testSecret,
      );

      // First verification should succeed
      const result1 = await verifyAuthTicket(token!, testSecret, testAudience);
      expect(result1.valid).toBe(true);

      // Second verification with same ticket should fail (replay)
      const result2 = await verifyAuthTicket(token!, testSecret, testAudience);
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain("replay");
    });
  });
});
