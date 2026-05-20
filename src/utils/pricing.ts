/**
 * Claude model pricing table and cost calculation utilities.
 * Prices in USD per 1M tokens. Update when Anthropic changes pricing.
 */

interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

const PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-7':           { inputPerMillion: 15.00, outputPerMillion: 75.00 },
  'claude-opus-4-6':           { inputPerMillion: 15.00, outputPerMillion: 75.00 },
  'claude-sonnet-4-6':         { inputPerMillion:  3.00, outputPerMillion: 15.00 },
  'claude-haiku-4-5-20251001': { inputPerMillion:  0.80, outputPerMillion:  4.00 },
};

const DEFAULT_PRICING: ModelPricing = { inputPerMillion: 3.00, outputPerMillion: 15.00 };

export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[modelId] ?? DEFAULT_PRICING;
  return (inputTokens * p.inputPerMillion + outputTokens * p.outputPerMillion) / 1_000_000;
}

export interface SessionStatsData {
  sessionId: string;
  sessionName: string;
  modelId: string;
  modelLabel: string;
  contextWindow: number;
  lastInputTokens: number;
  totalInputTokensUsed: number;
  totalOutputTokensUsed: number;
  estimatedCostUsd: number;
  durationMs: number;
  messageCount: number;
  archivedCount: number;
}

export function formatSessionStats(data: SessionStatsData): string {
  const {
    modelLabel, contextWindow, lastInputTokens,
    totalInputTokensUsed, totalOutputTokensUsed,
    estimatedCostUsd, durationMs, messageCount,
  } = data;

  const ctxPct = Math.min(100, Math.round((lastInputTokens / contextWindow) * 100));
  const filled = Math.round(ctxPct / 5);
  const bar = '#'.repeat(filled) + '-'.repeat(20 - filled);

  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
  const ctxShort = contextWindow >= 1_000_000
    ? `${contextWindow / 1_000_000}M`
    : `${Math.round(contextWindow / 1000)}k`;

  const mins = Math.floor(durationMs / 60000);
  const hours = Math.floor(mins / 60);
  const duration = hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;

  return [
    `${modelLabel} (${ctxShort}) | [${bar}] ${ctxPct}% | ${fmt(lastInputTokens)}/${ctxShort} | $${estimatedCostUsd.toFixed(4)} | ${duration} | ${messageCount} msgs`,
    `Tokens cumulative: ${fmt(totalInputTokensUsed)} in / ${fmt(totalOutputTokensUsed)} out`,
  ].join('\n');
}
