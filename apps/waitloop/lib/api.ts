import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiKeyUser } from "./auth";
import { ApiError } from "./waitlists";
import type { User } from "./db";

type Handler<Ctx> = (req: Request, user: User, ctx: Ctx) => Promise<Response>;

/** Wrap a v1 API route: Bearer API-key auth + uniform JSON errors. */
export function withApiAuth<Ctx = unknown>(handler: Handler<Ctx>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      const user = await getApiKeyUser(req);
      if (!user) {
        return NextResponse.json(
          { error: "unauthorized: pass your API key as `Authorization: Bearer wl_...`" },
          { status: 401 },
        );
      }
      return await handler(req, user, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { error: "invalid request body", issues: err.issues },
      { status: 400 },
    );
  }
  console.error(err);
  return NextResponse.json({ error: "internal error" }, { status: 500 });
}

export const themeSchema = z
  .object({
    headline: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    buttonText: z.string().max(60).optional(),
    successMessage: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{3,8}$/, "accentColor must be a hex color like #6c5ce7")
      .optional(),
    background: z.enum(["dark", "light"]).optional(),
  })
  .strict();

export const waitlistInputSchema = z
  .object({
    name: z.string().min(1).max(120),
    slug: z.string().min(1).max(60).optional(),
    theme: themeSchema.optional(),
    referralsEnabled: z.boolean().optional(),
    webhookUrl: z.string().url().nullable().optional(),
  })
  .strict();

export const waitlistPatchSchema = waitlistInputSchema.partial();
