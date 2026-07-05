import { NextResponse } from "next/server";
import { getApiKeyUser } from "@/lib/auth";
import { checkAccess } from "@/lib/entitlements";
import { ApiError } from "@/lib/waitlists";
import { MCP_TOOLS } from "@/lib/mcp-tools";
import type { User } from "@/lib/db";

/**
 * Stateless MCP server over streamable HTTP (JSON responses).
 * Auth: Authorization: Bearer wl_... — one account per key, no session state.
 */

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result };
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0" as const, id: id ?? null, error: { code, message } };
}

async function handleMessage(msg: JsonRpcRequest, user: User) {
  switch (msg.method) {
    case "initialize": {
      const requested = msg.params?.protocolVersion as string | undefined;
      return rpcResult(msg.id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested ?? "")
          ? requested
          : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: { name: "waitloop", version: "0.1.0" },
        instructions:
          "Waitloop creates hosted waitlist pages with referral ranking. " +
          "Typical flow: create_waitlist (returns a live page URL to share), then get_stats / list_signups to monitor, and export_signups when launching.",
      });
    }
    case "ping":
      return rpcResult(msg.id, {});
    case "tools/list":
      return rpcResult(msg.id, {
        tools: MCP_TOOLS.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });
    case "tools/call": {
      const name = msg.params?.name as string;
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      const tool = MCP_TOOLS.find((t) => t.name === name);
      if (!tool) return rpcError(msg.id, -32602, `unknown tool: ${name}`);
      try {
        await checkAccess(user);
        const result = await tool.handler(user, args);
        return rpcResult(msg.id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "internal error";
        if (!(err instanceof ApiError)) console.error("mcp tool error:", err);
        return rpcResult(msg.id, {
          content: [{ type: "text", text: JSON.stringify({ error: message }) }],
          isError: true,
        });
      }
    }
    default:
      return rpcError(msg.id, -32601, `method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  const user = await getApiKeyUser(req);
  if (!user) {
    return NextResponse.json(
      rpcError(null, -32001, "unauthorized: pass your API key as `Authorization: Bearer wl_...`"),
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "parse error"), { status: 400 });
  }

  const messages = (Array.isArray(body) ? body : [body]) as JsonRpcRequest[];
  const calls = messages.filter((m) => m.id !== undefined && m.method);
  // Notifications only (e.g. notifications/initialized): acknowledge with 202.
  if (calls.length === 0) return new Response(null, { status: 202 });

  const responses = await Promise.all(calls.map((m) => handleMessage(m, user)));
  return NextResponse.json(Array.isArray(body) ? responses : responses[0]);
}

// Stateless server: no SSE stream, no session to resume or delete.
export function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export function DELETE() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
