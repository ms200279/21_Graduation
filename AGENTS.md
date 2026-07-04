# AGENTS.md

## Project Overview

This is a production-oriented graduation exhibition archive website built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- Planned or possible Supabase integration

Treat this repository as production publishing work, not an experimentation sandbox.

Primary goals:

- Preserve existing visual polish, responsive behavior, navigation, and route transitions.
- Keep the current Next.js, Supabase-ready, and Vercel deployment flow intact.
- Make minimal, well-scoped changes only.

## Core Rules

- Review the relevant file structure before implementing.
- Modify only the minimum number of files necessary.
- Do not perform unrelated refactors.
- Do not add new libraries or dependencies without explicit user approval.
- Do not commit, merge, push, or deploy without explicit user approval.
- Do not expose, print, or commit secrets.
- Do not change production database state or production deployment settings without explicit approval.
- Before file edits, summarize which files will be created or modified and why.
- After changes, summarize modified files, reason for each change, verification performed, and remaining risks.

## Git Workflow

- For implementation tasks, create or confirm a task-specific Git branch before editing files.
- Do not work directly on `main` or protected branches unless the user explicitly instructs it.
- Do not commit unless the user explicitly asks.
- If proposing a commit, use this format:

```text
type:short description
```

Allowed types:

- `chore`
- `deploy`
- `docs`
- `feat`
- `hotfix`
- `design`
- `fix`
- `style`
- `refactor`
- `rename`
- `remove`

## Project Commands

Use existing scripts only unless the user approves changes.

```bash
npm run dev
npm run build
npm run start
npm run lint
```

There is no configured `npm test` script at the time this file was drafted.

## Frontend Guidelines

Frontend work may touch:

- `app/**`
- `components/**`
- `styles/**`
- `public/**`
- `hooks/**`
- `stores/**`
- client-side UI files

Frontend work must preserve:

- Existing header/navigation behavior
- Landing page scroll experience
- Liquid Glass UI behavior
- Mobile touch behavior
- Desktop hover behavior
- Route transition timing and visual continuity
- Existing publishing/design patterns

Important reference files:

- `app/components/Header.tsx`
- `app/components/LandingScrollExperience.tsx`
- `app/components/TypoLogoButton.tsx`
- `app/components/liquid-glass/**`
- `app/globals.css`

Do not modify backend, auth, database, production config, or deployment scripts from a frontend task unless explicitly required and approved.

After frontend changes, run:

```bash
npm run lint
```

Run `npm run build` when layout, routing, config, or production behavior may be affected.

Manual QA should include:

- Mobile viewport at `<= 767px`
- Desktop viewport at `>= 768px`
- Header hover/touch behavior
- Route transitions
- Landing scroll behavior
- Footer reveal behavior
- Visual regression around shared navigation

## Backend Guidelines

Backend work may touch:

- `app/api/**`
- `api/**`
- `server/**`
- `src/server/**`
- `src/api/**`
- `src/services/**`
- `src/lib/server/**`
- database, migration, job, worker, route, controller, or repository files if introduced

Before backend implementation:

- Define the data flow.
- Define request, response, and error contracts.
- Check security impact.
- Identify whether Supabase, auth, uploads, or RLS are involved.

Supabase rules:

- Verify actual Supabase usage in code before assuming it exists.
- Use Row Level Security when Supabase tables are introduced.
- Never expose a service role key to the client.
- Validate uploads server-side for type, size, and path.
- Add only example env vars to `.env.example`; never real secrets.

Do not directly modify production DB data.

## DevOps / Deployment Guidelines

DevOps work may touch:

- `.github/**`
- `Dockerfile*`
- `docker-compose*`
- `vercel.json`
- `.env.example`
- deployment or operations documentation

Rules:

- Do not run production deploys without explicit approval.
- Do not change production secrets.
- Do not commit real `.env` values.
- Preserve Next.js and Vercel compatibility.
- For this repo, Next.js uses `next.config.ts` and currently sets `turbopack.root`.

When changing deployment or CI behavior, document:

- Environment impact
- Verification method
- Rollback approach
- Human approval required for production actions

## Security Guidelines

Security-sensitive areas include:

- Auth/session/JWT handling
- Supabase RLS and policies
- Input validation
- XSS/CSRF/SSRF
- File uploads
- Secrets and environment variables
- Webhooks or payment-like integrations
- PII or permissions

For high-risk work, provide a design and wait for human approval before implementation.

Severity labels:

- `critical`
- `high`
- `medium`
- `low`

## Testing / QA Guidelines

There is currently no test runner configured in `package.json`.

Do not add a test framework or new dependency without user approval.

Until automated tests are added, provide manual QA checklists. Prioritize:

- Header mobile touch
- Header desktop hover
- Landing page scroll snap
- Route transition timing
- Responsive breakpoints around 767px / 768px / 1024px
- Build and lint stability

Use:

```bash
npm run lint
npm run build
```

when appropriate.

## Documentation Guidelines

Documentation work may touch:

- `README.md`
- `docs/**`
- `CHANGELOG.md`
- `RELEASE.md`
- other `*.md` files

Rules:

- Keep docs consistent with the actual codebase.
- Mark unknown or unverified items as `확인 필요`.
- Do not document fake secrets, real credentials, or unverified production URLs.
- Do not change runtime behavior from documentation-only tasks.

## Review Guidelines

For review tasks, default to read-only review.

Prioritize:

- Bugs
- Behavioral regressions
- Scope creep
- Missing tests or QA gaps
- Accessibility issues
- Responsive issues
- Security concerns
- FE/BE contract mismatches

Review output should include:

- Summary
- Merge readiness: `Ready`, `Ready with non-blocking comments`, or `Not ready`
- Blocking issues
- Non-blocking issues
- Suggested tests
- Rationale

## Current Repository Notes

- App routes live under `app/**`.
- Shared UI is concentrated in `app/components/**`.
- Global styles live in `app/globals.css` and `app/styles/**`.
- Static assets live in `public/**`.
- Supabase is described as planned or possible, but no Supabase client dependency is currently present.
- No `vercel.json` or CI workflow is currently present.
- Existing Cursor rules live in `.cursor/rules/**`; preserve their intent when updating this file.

## Human Approval Required

Ask before:

- Installing libraries
- Editing dependencies
- Creating migrations
- Changing auth/security behavior
- Touching production deployment config
- Running deploy commands
- Committing, merging, or pushing
- Deleting files
- Performing destructive commands
