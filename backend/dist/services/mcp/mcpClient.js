"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMCPClient = getMCPClient;
exports.getMCPTools = getMCPTools;
exports.closeMCPClient = closeMCPClient;
const mcp_1 = require("@ai-sdk/mcp");
// Local dev: http://0.0.0.0:8002/mcp/sse
// Production: https://futher-mcp-production.up.railway.app/mcp/sse
const MCP_SSE_URL = process.env.MCP_SSE_URL ?? "http://0.0.0.0:8002/mcp/sse";
let mcpClient = null;
async function getMCPClient() {
    if (!mcpClient) {
        mcpClient = await (0, mcp_1.createMCPClient)({
            transport: {
                type: "sse",
                url: MCP_SSE_URL,
            },
        });
    }
    return mcpClient;
}
async function getMCPTools() {
    const client = await getMCPClient();
    return client.tools();
}
async function closeMCPClient() {
    if (mcpClient) {
        await mcpClient.close();
        mcpClient = null;
    }
}
