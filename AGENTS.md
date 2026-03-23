# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` workspace with application code under `apps/*` and shared packages under `packages/*`.

- `apps/api`: NestJS API. Main source lives in `src/`, database migrations in `migrations/`, and end-to-end tests in `test/`.
- `apps/dashboard`: Vite + React dashboard. UI code lives in `src/`, static assets in `public/`, and routes in `src/routes/`.
- `apps/bot` and `apps/bot2`: Node/TypeScript automation services with source in `src/`.
- `packages/shared-types`: shared constants and TypeScript types.
- `packages/eslint-config`: shared ESLint presets used across workspaces.

Ignore generated output such as `dist/`, `build/`, `.tanstack/`, and runtime logs.

## Build, Test, and Development Commands
Install once from the repo root with `pnpm install`.

- `pnpm dev`: run all workspace `dev` scripts in parallel.
- `pnpm build`: build every workspace.
- `pnpm test`: run workspace test suites in parallel.
- `pnpm lint`: run ESLint across workspaces.
- `pnpm --filter @volvecapital/api start:dev`: run the API in watch mode.
- `pnpm --filter @volvecapital/dashboard dev`: start the dashboard on port `3000`.
- `pnpm --filter @volvecapital/api test:e2e`: run API end-to-end tests.

## Coding Style & Naming Conventions
TypeScript is the default across apps and packages. Follow the existing ESLint configs in `packages/eslint-config`.

- Use 2-space indentation in frontend code and semicolon-free style where already established.
- Keep NestJS backend files aligned with the existing style in `apps/api`, including semicolons.
- Use `PascalCase` for React components and classes, `camelCase` for functions/variables, and `kebab-case` for many model/type filenames such as `account-profile.ts`.
- Prefer small, workspace-local imports and keep shared contracts in `packages/shared-types`.

## Testing Guidelines
Current test coverage is strongest in `apps/api`, using Jest with `*.spec.ts` and `test/*.e2e-spec.ts`. Frontend and `bot2` use Vitest via each package script. Add tests next to the code they exercise unless the workspace already uses a dedicated `test/` directory.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style with scopes, for example `feat(dashboard): ...` and `fix(api): ...`. Keep that format for new commits.

Pull requests should state the affected workspace(s), summarize behavior changes, list any required `.env` updates, and include screenshots for dashboard UI changes. Link the relevant issue or task when available.

## Configuration Tips
Environment files exist in `apps/api/.env.example` and `apps/dashboard/.env.example`. Copy from those examples instead of inventing new variables, and avoid committing secrets or local runtime data.
