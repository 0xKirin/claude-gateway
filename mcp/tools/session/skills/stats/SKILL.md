---
name: stats
description: Get current session stats (token usage, cost, context, duration)
user-invocable: true
---

Use the `get_session_stats` MCP tool when the user asks about:
- token usage / token count
- session cost / how much this session costs
- context window usage / how full the context is
- session duration / how long this session has been running
- session stats / /stats

## How to use

Call `get_session_stats` with the `chat_id` from the inbound channel message context.

Example: if the message came from `<channel source="telegram" chat_id="12345" ...>`, pass `chat_id: "12345"`.

## Response format

The tool returns a JSON object. Format it for the user as:

```
{modelLabel} ({ctxShort}) | [{bar}] {ctxPct}% | {usedK}/{ctxShort} | ${cost} | {duration} | {msgs} msgs
Tokens cumulative: {inK} in / {outK} out
```

If `totalInputTokensUsed` and `totalOutputTokensUsed` are both 0, note that token tracking begins accumulating after the first API call completes.
