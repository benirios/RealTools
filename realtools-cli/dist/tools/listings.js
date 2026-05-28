import { z } from "zod";
import { supabase } from "../client.js";
const db = supabase;
export function registerListingTools(server) {
    server.tool("rt_search_listings", "Search commercial property listings with filters. Returns title, address, price, classification, and source.", {
        city: z.string().optional(),
        state: z.string().optional().describe("Two-letter Brazilian state code, e.g. PE, SP, RJ"),
        is_commercial: z.boolean().optional().describe("Filter to confirmed commercial listings only"),
        min_price: z.number().optional(),
        max_price: z.number().optional(),
        property_type: z.string().optional().describe("e.g. sala_comercial, galpao, loja, ponto_comercial"),
        has_location_insight: z.boolean().optional().describe("Only return listings with enriched location data"),
        limit: z.number().int().min(1).max(100).optional().default(20),
    }, async ({ city, state, is_commercial, min_price, max_price, property_type, limit }) => {
        let q = db
            .from("listings")
            .select("id,title,address_text,city,state,neighborhood,price_amount,price_text,property_type,is_commercial,confidence,commercial_type,tags,source,source_url,created_at")
            .order("created_at", { ascending: false })
            .limit(limit ?? 20);
        if (city)
            q = q.ilike("city", `%${city}%`);
        if (state)
            q = q.eq("state", state);
        if (is_commercial !== undefined)
            q = q.eq("is_commercial", is_commercial);
        if (min_price !== undefined)
            q = q.gte("price_amount", min_price);
        if (max_price !== undefined)
            q = q.lte("price_amount", max_price);
        if (property_type)
            q = q.eq("property_type", property_type);
        const { data, error } = await q;
        if (error)
            throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    });
    server.tool("rt_get_listing", "Get full listing details plus its location insight if enrichment has run.", { listing_id: z.string().uuid() }, async ({ listing_id }) => {
        const [listingRes, insightRes, scoreRes] = await Promise.all([
            db.from("listings").select("*").eq("id", listing_id).single(),
            db.from("location_insights").select("id,city,state,neighborhood,avg_income,population_density,consumer_profile,confidence_score,nearby_businesses,data_sources,updated_at").eq("listing_id", listing_id).maybeSingle(),
            db.from("opportunity_scores").select("strategy_slug,total_score,fit_label,computed_at").eq("listing_id", listing_id).order("total_score", { ascending: false }),
        ]);
        if (listingRes.error)
            throw new Error(listingRes.error.message);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        listing: listingRes.data,
                        location_insight: insightRes.data ?? null,
                        scores: scoreRes.data ?? [],
                    }, null, 2),
                }],
        };
    });
}
//# sourceMappingURL=listings.js.map