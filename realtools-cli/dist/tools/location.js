import { z } from "zod";
import { supabase } from "../client.js";
const db = supabase;
export function registerLocationTools(server) {
    server.tool("rt_get_location_insight", "Get enriched demographic and commercial context for a listing's location. Includes avg income, population density, nearby businesses, and consumer profile.", { listing_id: z.string().uuid() }, async ({ listing_id }) => {
        const { data, error } = await db
            .from("location_insights")
            .select("id,address,city,state,neighborhood,latitude,longitude," +
            "avg_income,population_density,consumer_profile,confidence_score," +
            "nearby_businesses,data_sources,updated_at")
            .eq("listing_id", listing_id)
            .maybeSingle();
        if (error)
            throw new Error(error.message);
        if (!data) {
            return {
                content: [{
                        type: "text",
                        text: "No location insight for this listing. Enrichment has not run yet — trigger it from the RealTools UI on the listing detail page.",
                    }],
            };
        }
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    });
    server.tool("rt_listings_missing_insight", "Find listings that have no location insight yet — candidates for enrichment.", {
        city: z.string().optional(),
        state: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional().default(20),
    }, async ({ city, state, limit }) => {
        // Listings that have no row in location_insights
        const insightsRes = await db
            .from("location_insights")
            .select("listing_id")
            .not("listing_id", "is", null);
        const enrichedIds = (insightsRes.data ?? []).map((r) => r.listing_id);
        let q = db
            .from("listings")
            .select("id,title,address_text,city,state,price_amount,is_commercial")
            .eq("is_commercial", true)
            .order("created_at", { ascending: false })
            .limit(limit ?? 20);
        if (city)
            q = q.ilike("city", `%${city}%`);
        if (state)
            q = q.eq("state", state);
        if (enrichedIds.length)
            q = q.not("id", "in", `(${enrichedIds.join(",")})`);
        const { data, error } = await q;
        if (error)
            throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    });
}
//# sourceMappingURL=location.js.map