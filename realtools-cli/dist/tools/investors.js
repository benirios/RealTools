import { z } from "zod";
import { supabase } from "../client.js";
const db = supabase;
export function registerInvestorTools(server) {
    server.tool("rt_list_investors", "List all investors/buyers in the CRM with optional filters.", {
        strategy: z.string().optional().describe("e.g. cafe, logistics, retail, any"),
        risk_level: z.enum(["low", "medium", "high"]).optional(),
        min_budget: z.number().optional().describe("Investor must have budget_max >= this value"),
    }, async ({ strategy, risk_level, min_budget }) => {
        let q = db
            .from("investors")
            .select("id,name,email,phone,strategy,risk_level,budget_min,budget_max,preferred_neighborhoods,property_types,desired_yield,tags,notes")
            .order("name");
        if (strategy)
            q = q.eq("strategy", strategy);
        if (risk_level)
            q = q.eq("risk_level", risk_level);
        if (min_budget !== undefined)
            q = q.gte("budget_max", min_budget);
        const { data, error } = await q;
        if (error)
            throw new Error(error.message);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    });
    server.tool("rt_match_investors_for_listing", "Find investors whose criteria match a given listing. Uses listing price, property type, location, and best strategy scores to rank fit.", { listing_id: z.string().uuid() }, async ({ listing_id }) => {
        const [listingRes, scoresRes, investorsRes] = await Promise.all([
            db.from("listings").select("price_amount,property_type,city,state,neighborhood,tags").eq("id", listing_id).single(),
            db.from("opportunity_scores").select("strategy_slug,total_score,fit_label").eq("listing_id", listing_id).order("total_score", { ascending: false }).limit(3),
            db.from("investors").select("*"),
        ]);
        if (listingRes.error)
            throw new Error(listingRes.error.message);
        const listing = listingRes.data;
        const topStrategies = (scoresRes.data ?? []).map((s) => s.strategy_slug);
        const investors = investorsRes.data ?? [];
        const matched = investors
            .map((inv) => {
            const budgetOk = !listing.price_amount ||
                ((!inv.budget_min || inv.budget_min <= listing.price_amount) &&
                    (!inv.budget_max || inv.budget_max >= listing.price_amount));
            const strategyMatch = inv.strategy === "any" || topStrategies.includes(inv.strategy);
            const propTypeMatch = !inv.property_types?.length || inv.property_types.includes(listing.property_type);
            const neighborhoodMatch = !inv.preferred_neighborhoods?.length ||
                inv.preferred_neighborhoods.some((n) => listing.neighborhood?.toLowerCase().includes(n.toLowerCase()));
            const score = [budgetOk, strategyMatch, propTypeMatch, neighborhoodMatch].filter(Boolean).length;
            return { ...inv, _match_score: score, _match_reasons: { budgetOk, strategyMatch, propTypeMatch, neighborhoodMatch } };
        })
            .filter((inv) => inv._match_score >= 2)
            .sort((a, b) => b._match_score - a._match_score);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        listing_summary: listing,
                        top_strategies: scoresRes.data ?? [],
                        matched_investors: matched,
                        total_investors_checked: investors.length,
                    }, null, 2),
                }],
        };
    });
}
//# sourceMappingURL=investors.js.map