# Repository Guidelines

## Project Structure & Module Organization
- `app/`: React Router app source (routes, root layout, styles).
  - `app/routes/`: Route modules (e.g., `home.tsx`).
  - `app/root.tsx`: App shell and providers.
  - `app/app.css`: Global styles and Tailwind layers.
- `public/`: Static assets served as-is (e.g., `favicon.ico`).
- `merge_sample.py`: Local utility script (not part of the app build).
- Config: `react-router.config.ts`, `vite.config.ts`, `tsconfig.json`.

## Build, Test, and Development Commands
- `npm run dev`: Start the React Router dev server.
- `npm run build`: Build the production bundle.
- `npm run start`: Serve the built app from `./build/server/index.js`.
- `npm run typecheck`: Generate route types and run TypeScript checks.

## Coding Style & Naming Conventions
- Language: TypeScript + React (TSX) with Tailwind CSS utilities.
- Indentation: 2 spaces (match existing TS/TSX files).
- Naming: components in `PascalCase`, hooks in `useCamelCase`, files in `kebab-case` or existing route naming (`home.tsx`).
- Formatting: no formatter configured; keep diffs minimal and follow local patterns.

## Testing Guidelines
- No automated test framework configured yet.
- Use `npm run typecheck` as the current baseline for correctness.
- If you add tests, document the framework and add a script to `package.json`.

## Commit & Pull Request Guidelines
- Git history is minimal (single initial commit); no established convention.
- Use clear, imperative commit messages (e.g., "Add mask preview controls").
- PRs should include a short summary, rationale, and screenshots for UI changes.

## Security & Configuration Tips
- App state is stored in browser local storage; avoid storing secrets.
- Verify that changes preserve client-only processing (no server image uploads).

## Continuity Ledger (compaction-safe)
Maintain a single Continuity Ledger for this workspace in `CONTINUITY.md`. The ledger is the canonical session briefing designed to survive context compaction; do not rely on earlier chat text unless it’s reflected in the ledger.

### How it works
- At the start of every assistant turn: read `CONTINUITY.md`, update it to reflect the latest goal/constraints/decisions/state, then proceed with the work.
- Update `CONTINUITY.md` again whenever any of these change: goal, constraints/assumptions, key decisions, progress state (Done/Now/Next), or important tool outcomes.
- Keep it short and stable: facts only, no transcripts. Prefer bullets. Mark uncertainty as `UNCONFIRMED` (never guess).
- If you notice missing recall or a compaction/summary event: refresh/rebuild the ledger from visible context, mark gaps `UNCONFIRMED`, ask up to 1–3 targeted questions, then continue.

### `functions.update_plan` vs the Ledger
- `functions.update_plan` is for short-term execution scaffolding while you work (a small 3–7 step plan with pending/in_progress/completed).
- `CONTINUITY.md` is for long-running continuity across compaction (the “what/why/current state”), not a step-by-step task list.
- Keep them consistent: when the plan or state changes, update the ledger at the intent/progress level (not every micro-step).

### In replies
- Begin with a brief “Ledger Snapshot” (Goal + Now/Next + Open Questions). Print the full ledger only when it materially changes or when the user asks.

### `CONTINUITY.md` format (keep headings)
- Goal (incl. success criteria):
- Constraints/Assumptions:
- Key decisions:
- State:
- Done:
- Now:
- Next:
- Open questions (UNCONFIRMED if needed):
- Working set (files/ids/commands):