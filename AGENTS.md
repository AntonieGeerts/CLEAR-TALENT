# Repository Guidelines

## Project Structure & Module Organization
Backend TypeScript code lives in `src/` (controllers, services, middleware, routes, utils, config). Database contracts stay inside `prisma/` (schema, migrations, seed), and automation helpers reside in `scripts/`. Reference architecture and API notes in `docs/` or `ARCHITECTURE.md`. The React/Vite client is isolated in `frontend/` (`src/components`, `src/pages`, `src/services`).

## Build, Test & Development Commands
`npm run dev` starts the Express API with tsx reloads, `npm run build` emits TypeScript to `dist/`, and `npm run start` migrates then boots the compiled server. Database workflows rely on `npm run prisma:migrate`, `npm run prisma:generate`, `npm run prisma:seed`, plus helpers such as `npm run seed:permissions`. `npm run lint` and `npm run format` must succeed before commits. For the frontend run `cd frontend && npm install`, then `npm run dev`, `npm run build`, `npm run preview`, and `npm run lint`.

## Coding Style & Naming Conventions
Stick to TypeScript strict mode, two-space indentation, and ES module imports. Name files by feature in kebab-case (`goal.controller.ts`), keep functions/variables camelCase, and reserve PascalCase for React components, classes, and exported types from `src/types`. Runtime settings belong in `src/config`; let Prettier (`npm run format`) and ESLint guard formatting rather than manual tweaks.

## Testing Guidelines
Jest with ts-jest (see `jest.config.js`) targets `src/__tests__/` plus `*.spec.ts`. Use Supertest when exercising HTTP handlers and mock Prisma when isolating services. Run `npm test` before pushes and `npm run test:coverage` for feature PRs; share the summary instead of committing the `coverage/` folder. Frontend suites should mirror component names with `.test.tsx` files and stub Axios calls through the service layer to keep runs deterministic.

## Commit & Pull Request Guidelines
The repo uses Conventional Commits (`feat:`, `fix:`, `chore:`) in the imperative mood and under ~72 characters. Each PR must state the intent, list commands executed (`npm test`, `npm run lint`, relevant seed scripts), and highlight any env or migration impact. Include screenshots or cURL snippets when UI or API behavior changes, and keep infrastructure or data migrations in their own PR when possible. Link issues or deployment docs for traceability.

## Security & Configuration Tips
Copy `.env.example` when onboarding, never commit secrets, and mention any new keys inside the PR description. After editing `prisma/schema.prisma`, run `npm run prisma:generate` and ship the new migration directory. Update both backend CORS config and `frontend/src/config` when domains shift, and re-run permission seeders (`npm run seed:access-control`, `npm run seed:permissions`) whenever RBAC matrices change.
