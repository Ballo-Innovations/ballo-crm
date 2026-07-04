# constants/

App-wide literal constants and enums that aren't configuration (which belongs in `config/`) and
aren't a Zod schema's `.enum()` (which belongs next to that schema in `schemas/`). Example:
`OPPORTUNITY_STAGES`, `ACCOUNT_HEALTH_THRESHOLDS`.
