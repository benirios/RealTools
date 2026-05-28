import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerDealTools } from "./tools/deals.js";
import { registerListingTools } from "./tools/listings.js";
import { registerScoringTools } from "./tools/scoring.js";
import { registerLocationTools } from "./tools/location.js";
import { registerInvestorTools } from "./tools/investors.js";
const server = new McpServer({
    name: "realtools",
    version: "1.0.0",
});
registerDealTools(server);
registerListingTools(server);
registerScoringTools(server);
registerLocationTools(server);
registerInvestorTools(server);
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map