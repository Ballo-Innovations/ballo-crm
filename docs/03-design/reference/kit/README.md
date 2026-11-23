# BalloCRM UI kit

The decided designs as code. **Build UI from this folder.** The `*-options.html` pages one level
up are the record of how each decision was made; they contain rejected designs, so never copy
from them.

| File              | What it is                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `tokens.css`      | Colour, type, radius, spacing, size and motion variables, light and dark                            |
| `components.css`  | The decided components only: shell, cards, buttons, tabs, fields, drawer, modal, toast, page states |
| `components.html` | Live showcase of every component, built only from the two CSS files. Open it in a browser           |

The written rules (when to use what, copy, accessibility) stay in
`docs/03-design/01-design-system.md`. If the kit and the doc disagree, raise it and fix one.

## Using it in the app

The app is Next.js with Tailwind 4 and shadcn/ui (`src/app/globals.css`). Do not import these CSS
files into the app. Instead:

1. **Theme:** set the shadcn variables in `globals.css` to the kit tokens (below), and load
   Urbanist with `next/font/google` as `--font-sans`.
2. **Components:** use the shadcn component, then match the kit with Tailwind classes. The kit's
   class names (`btn--hero`, `field__label`, `drawer`) are a shared vocabulary for what each
   piece looks like, not classes to ship.
3. **Icons:** lucide-react, 17px, stroke 2. The showcase uses text glyphs only to stay
   dependency-free.

### shadcn variable mapping

```css
:root {
  --background: #ffffff; /* --shell */
  --foreground: #0d0d0d; /* --ink */
  --card: #ffffff; /* --card */
  --card-foreground: #0d0d0d;
  --popover: #ffffff;
  --popover-foreground: #0d0d0d;
  --primary: #0d0d0d; /* black pills, active nav, primary buttons */
  --primary-foreground: #ffffff;
  --secondary: #f3f3f3; /* --soft: fields, tabs, rows, icon circles */
  --secondary-foreground: #0d0d0d;
  --muted: #ececec; /* --main: the content panel */
  --muted-foreground: #6b6b6b; /* --mute */
  --accent: #e4e4e4; /* --line: hover fills */
  --accent-foreground: #0d0d0d;
  --destructive: #dc2626;
  --border: #e4e4e4;
  --input: #f3f3f3;
  --ring: #0d0d0d; /* 2px focus ring */
  --radius: 1rem; /* 16px rows; use rounded-full for pills */
  --chart-1: #0d0d0d;
  --chart-2: #7a7a7a;
  --chart-3: #c8c8c8;
  --sidebar: #ffffff;
  --sidebar-foreground: #0d0d0d;
  --sidebar-primary: #0d0d0d;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f3f3f3;
  --sidebar-accent-foreground: #0d0d0d;
  --sidebar-border: #e4e4e4;
  --sidebar-ring: #0d0d0d;
}
.dark {
  --background: #111111;
  --foreground: #f5f5f5;
  --card: #242424;
  --card-foreground: #f5f5f5;
  --popover: #242424;
  --popover-foreground: #f5f5f5;
  --primary: #f5f5f5;
  --primary-foreground: #111111;
  --secondary: #2e2e2e;
  --secondary-foreground: #f5f5f5;
  --muted: #1b1b1b;
  --muted-foreground: #9a9a9a;
  --accent: #3a3a3a;
  --accent-foreground: #f5f5f5;
  --destructive: #f87171;
  --border: #3a3a3a;
  --input: #2e2e2e;
  --ring: #f5f5f5;
  --chart-1: #f5f5f5;
  --chart-2: #9a9a9a;
  --chart-3: #505050;
  --sidebar: #111111;
  --sidebar-foreground: #f5f5f5;
  --sidebar-primary: #f5f5f5;
  --sidebar-primary-foreground: #111111;
  --sidebar-accent: #2e2e2e;
  --sidebar-accent-foreground: #f5f5f5;
  --sidebar-border: #3a3a3a;
  --sidebar-ring: #f5f5f5;
}
```

Radii beyond `--radius`: content panel `rounded-[32px]`, cards `rounded-[28px]`, KPI cards
`rounded-[26px]`, drawer `rounded-[22px]`, rows `rounded-2xl`, everything pill-shaped
`rounded-full`.

## Adding to the kit

When a new design decision is made, add its tokens to `tokens.css`, its styles to
`components.css` and a working example to `components.html` in the same PR as the design-system
section.
