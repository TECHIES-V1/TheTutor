import { createMCPClient } from "@ai-sdk/mcp";

const MCP_SSE_URL = process.env.MCP_SSE_URL ?? "http://0.0.0.0:8002/sse";

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
