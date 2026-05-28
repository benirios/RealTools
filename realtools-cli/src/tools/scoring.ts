import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { supabase } from "../client.js";

const db = supabase as any;

const STRATEGY_SLUGS = ["cafe", "logistics", "pharmacy", "retail", "services", "any"] as const;
type StrategySlug = (typeof STRATEGY_SLUGS)[number];

export function registerScoringTools(server: McpServer) {
  server.tool(
    "rt_list_scores",
    "List opportunity scores across all listings, sorted by score descending.",
    {
      strategy_slug: z.enum(STRATEGY_SLUGS).optional(),
      min_score: z.number().min(0).max(100).optional().default(0),
      limit: z.number().int().min(1).max(100).optional().default(20),
    },
    async ({ strategy_slug, min_score, limit }) => {
      let q = db
        .from("opportunity_scores")
        .select("id,listing_id,strategy_slug,total_score,demographics_score,location_score,foot_traffic_score,competition_score,risk_score,investor_fit_score,fit_label,computed_at")
        .gte("total_score", min_score ?? 0)
        .order("total_score", { ascending: false })
        .limit(limit ?? 20);
      if (strategy_slug) q = q.eq("strategy_slug", strategy_slug);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "rt_get_score",
    "Get full opportunity score breakdown (signals, risks, category scores) for a listing + strategy combination.",
    {
      listing_id: z.string().uuid(),
      strategy_slug: z.enum(STRATEGY_SLUGS),
    },
    async ({ listing_id, strategy_slug }) => {
      const { data, error } = await db
        .from("opportunity_scores")
        .select("*")
        .eq("listing_id", listing_id)
        .eq("strategy_slug", strategy_slug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) {
        return {
          content: [{
            type: "text" as const,
            text: `No score found for listing ${listing_id} with strategy '${strategy_slug}'. Use rt_get_listing to check if location_insight exists — scoring requires enriched data.`,
          }],
        };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "rt_top_listings",
    "Get top N listings ranked by opportunity score for a given business strategy.",
    {
      strategy_slug: z.enum(STRATEGY_SLUGS),
      limit: z.number().int().min(1).max(50).optional().default(10),
      min_score: z.number().min(0).max(100).optional().default(50),
    },
    async ({ strategy_slug, limit, min_score }) => {
      const scoresRes = await db
        .from("opportunity_scores")
        .select("listing_id,total_score,fit_label,demographics_score,location_score,foot_traffic_score,competition_score,risk_score,signals,risks")
        .eq("strategy_slug", strategy_slug)
        .gte("total_score", min_score ?? 50)
        .order("total_score", { ascending: false })
        .limit(limit ?? 10);
      if (scoresRes.error) throw new Error(scoresRes.error.message);
      if (!scoresRes.data?.length) {
        return { content: [{ type: "text" as const, text: `No listings scored above ${min_score} for strategy '${strategy_slug}'.` }] };
      }
      const listingIds = scoresRes.data.map((s: any) => s.listing_id);
      const listingsRes = await db
        .from("listings")
        .select("id,title,address_text,city,state,price_amount,price_text,source_url")
        .in("id", listingIds);
      const listingMap = Object.fromEntries((listingsRes.data ?? []).map((l: any) => [l.id, l]));
      const result = scoresRes.data.map((score: any) => ({
        ...score,
        listing: listingMap[score.listing_id] ?? null,
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "rt_compare_strategies",
    "Compare opportunity scores for the same listing across all available strategies.",
    { listing_id: z.string().uuid() },
    async ({ listing_id }) => {
      const { data, error } = await db
        .from("opportunity_scores")
        .select("strategy_slug,total_score,fit_label,demographics_score,location_score,risk_score,computed_at")
        .eq("listing_id", listing_id)
        .order("total_score", { ascending: false });
      if (error) throw new Error(error.message);
      if (!data?.length) {
        return { content: [{ type: "text" as const, text: "No scores computed for this listing. Run scoring from the RealTools UI first." }] };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
