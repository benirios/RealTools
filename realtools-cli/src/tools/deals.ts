import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { supabase, USER_ID } from "../client.js";

const db = supabase as any;

export function registerDealTools(server: McpServer) {
  server.tool(
    "rt_list_deals",
    "List all CRE deals for the current user. Returns id, title, address, price, status, property_type, created_at.",
    {
      status: z
        .string()
        .optional()
        .describe("Filter by status: active | closed | pending | archived"),
      limit: z.number().int().min(1).max(100).optional().default(20),
    },
    async ({ status, limit }) => {
      let q = db
        .from("deals")
        .select("id,title,address,price,status,property_type,neighborhood,tags,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(limit ?? 20);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "rt_get_deal",
    "Get full deal details including notes and recent activity log.",
    { deal_id: z.string().uuid().describe("Deal UUID") },
    async ({ deal_id }) => {
      const [dealRes, notesRes, activitiesRes] = await Promise.all([
        db.from("deals").select("*").eq("id", deal_id).single(),
        db.from("notes").select("id,content,created_at,updated_at").eq("deal_id", deal_id).order("created_at", { ascending: false }),
        db.from("activities").select("id,event_type,metadata,created_at").eq("deal_id", deal_id).order("created_at", { ascending: false }).limit(30),
      ]);
      if (dealRes.error) throw new Error(dealRes.error.message);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            deal: dealRes.data,
            notes: notesRes.data ?? [],
            activities: activitiesRes.data ?? [],
          }, null, 2),
        }],
      };
    }
  );

  server.tool(
    "rt_create_deal",
    "Create a new deal in RealTools.",
    {
      title: z.string().min(1),
      address: z.string().optional(),
      price: z.string().optional().describe("Price as string, e.g. 'R$ 850.000'"),
      description: z.string().optional(),
      property_type: z.string().optional(),
      neighborhood: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async (args) => {
      const { data, error } = await db
        .from("deals")
        .insert({ ...args, user_id: USER_ID, status: "active" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "rt_update_deal_status",
    "Change a deal's status.",
    {
      deal_id: z.string().uuid(),
      status: z.enum(["active", "closed", "pending", "archived"]),
    },
    async ({ deal_id, status }) => {
      const { data, error } = await db
        .from("deals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", deal_id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "rt_add_note",
    "Add a note to a deal.",
    {
      deal_id: z.string().uuid(),
      content: z.string().min(1),
    },
    async ({ deal_id, content }) => {
      const { data, error } = await db
        .from("notes")
        .insert({ deal_id, content, user_id: USER_ID })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
