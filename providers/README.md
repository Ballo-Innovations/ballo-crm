# providers/

`app-providers.tsx` is the single composition root wiring Redux, TanStack Query, next-themes,
and the toast renderer around `{children}` in `app/layout.tsx`. Add new global client-side
providers here - never wrap providers ad hoc inside a page or feature component.
