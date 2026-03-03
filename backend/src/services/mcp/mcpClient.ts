import { createMCPClient } from "@ai-sdk/mcp";

// Local dev: http://0.0.0.0:8002/mcp/sse
// Production: https://futher-mcp-production.up.railway.app/mcp/sse
const MCP_SSE_URL =
  process.env.MCP_SSE_URL ?? "https://futher-mcp-production.up.railway.app/mcp/sse";

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

export async function getMCPClient() {
  if (!mcpClient) {
    mcpClient = await createMCPClient({
      transport: {
        type: "sse",
        url: MCP_SSE_URL,
      },
    });
  }
  return mcpClient;
}

export async function getMCPTools() {
  const client = await getMCPClient();
  return client.tools();
}

export async function closeMCPClient() {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
  }
}
