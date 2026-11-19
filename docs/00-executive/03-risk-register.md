# Risk Register

| #   | Risk                             | Likelihood | Impact | Mitigation                                                                | Owner     |
| --- | -------------------------------- | ---------- | ------ | ------------------------------------------------------------------------- | --------- |
| R1  | Scope creep                      | High       | High   | Vertical slices; demo-script-driven polish; PM says no                    | PM        |
| R2  | Integration slices eat time      | High       | Med    | Adapter interface + mocks from day 1; go live only if ahead               | Dev C     |
| R3  | Scoring looks arbitrary          | Med        | High   | Explanation drawer with factor weights; spec in `01-product/02`           | Dev B     |
| R4  | Demo data looks fake             | Med        | High   | Seed spec: Zambian accounts, kwacha, sectors; whole-team review           | Dev A     |
| R5  | LLM fails live                   | Med        | High   | Cache LLM output at seed time; rules-only fallback text                   | Dev B     |
| R6  | Merge conflicts                  | Med        | Med    | Module ownership; trunk-based; CI on every PR                             | Tech lead |
| R7  | Deployment breaks on demo day    | Med        | High   | Deploy daily from day 3; freeze 24h before; docker-compose local fallback | Dev C     |
| R8  | A dev drops out                  | Low        | High   | Second owner per module; small tickets                                    | Tech lead |
| R9  | Licence challenge on reused code | Low        | Med    | Reference only; no copied code; README statement                          | Tech lead |
| R10 | Pitch overruns                   | Med        | Med    | 8-min script, 3 rehearsals, hard cut list                                 | CEO       |
