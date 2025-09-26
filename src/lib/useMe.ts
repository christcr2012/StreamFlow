// src/lib/useMe.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { MeResponse, OrgShape } from "@/lib/types/me";

/**
 * UI-facing user model returned by this hook.
 * We keep the shape stable so pages can rely on it.
 */
export interface CurrentUser {
  email: string;
  name: string | null;
  // Back-compat alias; we surface "role" as the server's "baseRole"
  role: "OWNER" | "MANAGER" | "STAFF" | "PROVIDER" | "ACCOUNTANT" | "VIEWER";
  rbacRoles: string[];
  isOwner: boolean;
  isProvider: boolean;
  perms: string[]; // <- IMPORTANT: effective permission codes (e.g. "billing:manage")
}

type MeState =
  | { me: CurrentUser | null; org: OrgShape | null; loading: true; error: null }
  | { me: CurrentUser | null; org: OrgShape | null; loading: false; error: string | null };

export function useMe() {
  const [state, setState] = useState<MeState>({ me: null, org: null, loading: true, error: null });
  const mountedRef = useRef(true);

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch("/api/me");
      const j: MeResponse = await r.json();

      // Only update state if component is still mounted
      if (!mountedRef.current) return;

      if (!r.ok || (j as any)?.ok === false) {
        const msg = (j as any)?.error || `HTTP ${r.status}`;
        setState({ me: null, org: null, loading: false, error: msg });
        return;
      }

      const org: OrgShape | null = (j as any).org || null;
      const u = (j as any).user;

      const me: CurrentUser = {
        email: u.email,
        name: u.name ?? null,
        role: u.baseRole,            // alias baseRole → role
        rbacRoles: Array.isArray(u.rbacRoles) ? u.rbacRoles : [],
        isOwner: !!u.isOwner,
        isProvider: !!u.isProvider,
        perms: Array.isArray(u.perms) ? u.perms : [], // <- the new field
      };

      setState({ me, org, loading: false, error: null });
    } catch (e: unknown) {
      // Only update state if component is still mounted
      if (!mountedRef.current) return;
      const msg = (e as { message?: string } | null)?.message || "Failed to load /api/me";
      setState({ me: null, org: null, loading: false, error: msg });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchMe();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMe]);

  const refresh = useCallback(() => fetchMe(), [fetchMe]);

  // Back-compat return shape (adds org+error+refresh while keeping me+loading)
  return { me: state.me, org: state.org, loading: state.loading, error: state.error, refresh };
}
