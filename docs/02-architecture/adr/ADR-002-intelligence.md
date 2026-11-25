# ADR-002: Rules-based scoring with LLM narration, cached

**Status:** Accepted
**Context:** No historical data for ML. Judges value explainability. Live LLM calls risk failing on demo day.
**Decision:** Deterministic scoring/recommendation engine (pure functions, unit-tested). LLM generates narratives only; outputs cached in `AiArtifact`; template fallback.
**Provider (Nov 2026):** narratives go through Brutus, the Ballo AI hub, not a model API directly. Brutus has no CRM task yet: start with its `content-generation` task and add a `crm-narrative` task in the Brutus repo if the output needs it.
**Consequences:** Fully offline demo; "AI" claims are honest ("AI-assisted ranking and narrative"); upgrade path to ML documented in roadmap.
