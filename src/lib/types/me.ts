// src/lib/types/me.ts

/**
 * OrgShape matches what the API returns to the client.
 * featureFlags is intentionally broad (unknown) to allow any JSON today and in the future.
 * Client code should narrow/guard before accessing specific keys (see featureFlags helpers).
 */
export type OrgShape = {
  id: string;
  name: string;
  featureFlags: unknown; // <- intentionally broad; could be object/array/string/null/etc.
};

export type MeResponse =
  | {
      ok: true;
      user: {
        email: string;
        name: string | null;
        baseRole:
          | "OWNER"
          | "MANAGER"
          | "STAFF"
          | "PROVIDER"
          | "ACCOUNTANT"
          | "VIEWER";
        rbacRoles: string[];   // e.g. ["owner","provider"]
        isOwner: boolean;
        isProvider: boolean;
        perms: string[];       // e.g. ["billing:manage","lead:read"]
      };
      org?: OrgShape; // optional on purpose
    }
  | { ok: false; error: string };
