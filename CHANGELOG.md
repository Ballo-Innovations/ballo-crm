# Changelog

All notable changes to BalloCRM are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Every merged PR should add an entry
under `[Unreleased]` in the relevant section (Added / Changed / Fixed / Removed) - see
`CONTRIBUTING.md`.

## [Unreleased]

### Added

- Project foundation: Next.js 15 (App Router, TypeScript strict) scaffolded with Tailwind CSS v4
  and shadcn/ui (`radix-nova` style), Firebase (client + Admin SDK), Redux Toolkit, TanStack
  Query, React Hook Form + Zod, Recharts, and Lucide icons.
- Feature-based directory structure (`app/`, `components/`, `features/`, `lib/`, `services/`,
  `repositories/`, `store/`, `providers/`, `hooks/`, `types/`, `schemas/`, `actions/`, `config/`,
  `utils/`, `constants/`, `styles/`) with per-folder README conventions.
- Firebase project config: `firestore.rules`, `firestore.indexes.json`, `firebase.json`
  (multi-tenant org-scoped security model).
- Tooling: ESLint + Prettier (with `prettier-plugin-tailwindcss`), Husky pre-commit hook running
  `lint-staged`.
- Full documentation set under `/docs` (vision, architecture, tech stack, database schema,
  Firestore rules/indexes reference, API, integrations, UI design system, routes, folder
  structure, coding standards, naming conventions, deployment, environment, decisions, glossary,
  risks, roadmap) and project management docs under `/docs/tasks` (backlog, Sprint 1–3,
  per-developer assignments, task template).
- Root project files: `.env.example`, `.gitignore`, `CONTRIBUTING.md`, `LICENSE`, GitHub issue
  and PR templates, VS Code workspace settings.
- Deployment: pushed to `github.com/Ballo-Innovations/hackerthon-crm` and connected the Vercel
  project (`ballo-innovations/hackerthon-crm`) via Vercel's native Git integration - pushes to
  `main` now deploy to Production automatically and PRs get automatic Preview deployments. Live
  at https://hackerthon-crm.vercel.app. See `docs/deployment.md`.

### Notes

- No business features (Accounts, Opportunities, Contracts, etc.) are implemented yet by design
  - see `docs/roadmap.md` and `docs/tasks/sprint-1.md` for what ships next.

## [0.1.0] - 2026-07-04

- Repository initialized for the 2026 iHub Innovation Hackathon, Challenge 2.
