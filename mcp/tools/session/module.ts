/**
 * Session tool module — exposes get_session_stats via MCP.
 * Calls the gateway REST API to fetch current session stats.
 */

import * as path from 'path';
import type {
  ToolModule,
  McpToolDefinition,
  McpToolResult,
  ToolVisibility,
} from '../../types';

export class SessionModule implements ToolModule {
  id = 'session';
  toolVisibility: ToolVisibility = 'all-configured';
  skillsDir = path.join(__dirname, 'skills');

  isEnabled(): boolean {
    return Boolean(process.env.GATEWAY_API_URL && process.env.GATEWAY_AGENT_ID);
  }

  getTools(): McpToolDefinition[] {
    return [
      {
        name: 'get_session_stats',
        description: 'Get token usage, estimated cost, context window usage, and duration for the current agent session. Pass chat_id from the inbound channel message.',
        inputSchema: {
          type: 'object',
          properties: {
            chat_id: {
              type: 'string',
              description: 'The chat_id from the inbound channel message (e.g. Telegram chat_id)',
            },
          },
          required: ['chat_id'],
          additionalProperties: false,
        },
      },
    ];
  }

  async handleTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
    if (name !== 'get_session_stats') {
      return { content: [{ type: 'text', text: `unknown tool: ${name}` }], isError: true };
    }

    const apiUrl = process.env.GATEWAY_API_URL!;
    const agentId = process.env.GATEWAY_AGENT_ID!;
    const apiKey = process.env.GATEWAY_API_KEY;
    const chatId = args.chat_id as string;

    try {
      const url = `${apiUrl}/api/v1/agents/${encodeURIComponent(agentId)}/sessions/current/stats?chatId=${encodeURIComponent(chatId)}`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;

      const resp = await fetch(url, { headers });
      if (!resp.ok) {
        const body = await resp.text();
        return { content: [{ type: 'text', text: `get_session_stats failed (${resp.status}): ${body}` }], isError: true };
      }

      const data = await resp.json() as Record<string, unknown>;
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `get_session_stats failed: ${msg}` }], isError: true };
    }
  }
}
