import "server-only";

export type NarrativeRequest = {
  kind: "RECO_NARRATIVE" | "FOCUS_ONELINER";
  refId: string;
  prompt: string;
  /** Deterministic text used when no API key is set or the call fails. */
  fallback: string;
};

/**
 * The only entry point to the LLM (Anthropic API, server-side). Narration only:
 * scores and recommendations are computed by rules, never by the model (ADR-002).
 * Must never throw - with `ANTHROPIC_API_KEY` unset it returns the fallback.
 * TODO(E5-02): call the API and cache every result in `AiArtifact`.
 */
export async function generateNarrative(request: NarrativeRequest): Promise<string> {
  return request.fallback;
}
