# utils/

Small, pure, framework-agnostic helper functions with no side effects (formatters, string/number
helpers, array helpers). If a helper needs Firebase, BalloAds, or Brutus AI, it isn't a util -
it belongs in `lib/`, `repositories/`, or `services/`. `lib/utils.ts` (shadcn's `cn()` helper) is
the one exception kept where the generator puts it.
