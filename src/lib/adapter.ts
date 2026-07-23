import type { AnalysisRequest, CompatibilityResult } from "./types";

/**
 * ============================================================
 * Adapter seam for the `ma-compatibility-scoring` skill agent
 * ============================================================
 *
 * The skill is reached over HTTP/MCP and returns its OWN response shape.
 * This is the single place that translates that raw shape into the
 * {@link CompatibilityResult} the dashboard renders — so the UI never has to
 * change when the agent's format is finalized.
 *
 * TO WIRE THE REAL AGENT:
 *   1. Set the request shape the endpoint expects in `buildAgentPayload`.
 *   2. Fill in the field mapping in `adaptAgentResponse` from an example of the
 *      agent's actual output (paste one and this becomes a few lines).
 *   3. Everything downstream already consumes CompatibilityResult unchanged.
 */

/** Shape the endpoint receives. Adjust once the agent's request contract is known. */
export function buildAgentPayload(req: AnalysisRequest): unknown {
  // Default: send the organized submission as-is. Replace with the exact
  // request body the skill expects (field names, nesting, etc.).
  return req;
}

/** Loose type for the agent's raw output until its schema is confirmed. */
export type AgentRawResponse = Record<string, unknown>;

/**
 * Map the skill's raw response → CompatibilityResult.
 *
 * Currently a guarded pass-through: if the response already looks like a
 * CompatibilityResult it is returned as-is; otherwise it throws so the caller
 * can surface a clear error instead of rendering garbage. Replace the body with
 * concrete field mapping once an example payload is available.
 */
export function adaptAgentResponse(raw: AgentRawResponse): CompatibilityResult {
  if (looksLikeResult(raw)) {
    return { ...(raw as unknown as CompatibilityResult), source: "agent" };
  }

  // ---- Field mapping goes here, e.g.:
  // return {
  //   overallScore: Number(raw.compatibility_score),
  //   riskLevel: mapRisk(raw.risk_rating),
  //   recommendation: mapRecommendation(raw.verdict),
  //   executiveSummary: String(raw.summary),
  //   fits: mapFits(raw.dimensions),
  //   risks: mapRisks(raw),
  //   generatedAt: new Date().toISOString(),
  //   source: "agent",
  // };

  throw new Error(
    "Unrecognized response from ma-compatibility-scoring. Update adaptAgentResponse() with the agent's field mapping."
  );
}

function looksLikeResult(raw: AgentRawResponse): boolean {
  return (
    typeof raw?.overallScore === "number" &&
    Array.isArray((raw as { fits?: unknown }).fits) &&
    typeof (raw as { risks?: unknown }).risks === "object" &&
    (raw as { risks?: unknown }).risks !== null
  );
}
