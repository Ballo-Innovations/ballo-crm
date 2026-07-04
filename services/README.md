# services/

Business logic that composes one or more `repositories/` (and, where relevant, `lib/balloads`
or `lib/brutus` clients) into a meaningful operation — e.g. "qualify an opportunity" might read
the opportunity, call Brutus AI for a score, write the score back, and log an Activity, all in
one service function.

Services are the layer `actions/` calls into. UI code and Server Actions never call
`repositories/` directly — always go through a service so business rules stay in one place.
