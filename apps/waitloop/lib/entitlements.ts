import type { User } from "./db";

/**
 * Entitlements hook. In the open-source build every account has full access —
 * both functions are no-ops. The hosted cloud overlay replaces this file with
 * an implementation backed by its billing system (see lib/cloud/ in the cloud repo).
 */

export type BillingNotice = {
  message: string;
  actionUrl: string;
  actionLabel: string;
  tone: "info" | "warning";
};

/** Throw ApiError(402) to block owner-side access (API, MCP, dashboard mutations). */
export async function checkAccess(_user: User): Promise<void> {}

/** Banner shown in the dashboard, or null for none. */
export async function billingNotice(_user: User): Promise<BillingNotice | null> {
  return null;
}
