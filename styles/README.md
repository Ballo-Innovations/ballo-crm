# styles/

Reserved for non-Tailwind global CSS that doesn't belong in `app/globals.css` (e.g. a
third-party library's stylesheet override, print styles). Tailwind v4 config lives inline in
`app/globals.css` via `@theme` — do not add a `tailwind.config.ts` unless a plugin requires the
JS config format.
