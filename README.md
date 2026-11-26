<h1 align="center">
  <br>
     <img src="./apps/web/public/logo.webp" alt="Magista RPG" width="30%">
  <br>
    Magista RPG
  <br>
</h1>

<h4 align="center">A self-hosted, real-time tabletop app for the Magista RPG table: character sheets, dice rolls and a WebGL battle map, built to replace a custom Roll20 sheet. Made with <a href="https://nextjs.org/" target="_blank">Next</a>, <a href="https://socket.io/" target="_blank">Socket.IO</a> and <a href="https://pixijs.com/" target="_blank">PixiJS</a>.</h4>

<p align="center">
  <a href="#about">About</a> •
  <a href="#setup">Setup</a> •
  <a href="#roll20-import">Roll20 Import</a> •
  <a href="#production">Production</a> •
  <a href="#environment">Environment</a> •
  <a href="#testing">Testing</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tools">Tools</a> •
  <a href="#author">Author</a>
</p>

## About

- The home of the **Magista** campaign, a homebrew system adapted from D&D 5e. The UI is in Portuguese (PT-BR), the language of the table.
- **Character sheets** with every derived value (modifiers, proficiency, AC, base damage, skills, saves) computed from a single shared rules engine, with debounced autosave and conflict reconciliation when the GM edits the same sheet.
- **Server-side dice rolls**: the client only says what to roll. Everyone sees a suspense card while the roller's dice animation plays, and the result is revealed to the table at the same time. Natural 20s max out the damage.
- **Arena**: a full-screen PixiJS battle map with scenes in nested folders, character and NPC tokens, multi-select, copy and paste, hidden tokens, health and sanity bars with per-token visibility, and a turn order with initiative rolls.
- **Damage and healing VFX**: dozens of animations, including signature "Ultimates" that take over the screen, built on a custom GPU kit (Stable Fluids simulation, procedural energy flows, glass shatter and sound-wave shaders).
- **World Map**: a live overworld with a party token, a GM-painted fog of war made of animated clouds, and a camera flight through the clouds when the scene changes.
- **Roles and permissions**: the GM sees and organizes everything (drag-and-drop folders, accounts, access per sheet); players open, edit and roll only with the sheets shared with them. Permissions are always checked on the server.
- **Performance mode** for PCs without a strong GPU, plus `prefers-reduced-motion` support everywhere.
- **Accessible** by design: validated with axe-core (WCAG 2.1 AA), full keyboard support (including the map), and loading skeletons that match the final layout.
- Structured as an MVC API plus an Atomic Design front end, sharing Zod schemas, game rules and typed socket contracts through a workspace package.

## Setup

- Follow the usual flow of an npm workspaces monorepo.
- Node version 24 (`nvm use`), plus Docker and Docker Compose (Postgres and the SeaweedFS image storage, both local).
- Copy the env files and fill in `JWT_SECRET` and the seed passwords:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

- Then install, start the services and seed the database:

```bash
npm install
npm run db:up        # Postgres (:5434) + image storage (:8333, localhost only)
npm run db:migrate
npm run db:seed
npm run dev          # web http://localhost:3000 · api http://localhost:3333
```

## Roll20 Import

Each player goes in a subfolder with a `character.json` (Roll20 export) and, optionally, `avatar.*` and `token.*`. The player's login is the character's name; the Roll20 `token.*` becomes the **avatar** and `avatar.*` becomes the full **art**.

```bash
npm run import:roll20 -- "/path/to/Players"            # creates the accounts and prints the generated passwords
npm run import:roll20 -- "/path/to/Players" --force    # overwrites sheets already imported
npm run import:roll20 -- "/path/to/characters" --only "Heylel, de Lux" --account "Player"  # one sheet, linked to an existing account
npm run import:roll20-pages -- "/path/to/pages"        # Roll20 pages (maps, size and folders) as Arena scenes
npm run account:password -- "<login>"                  # generates a new password
```

Images live in the SeaweedFS container (S3 protocol, never exposed): the API is the only client and serves them under `/media/...`. Every upload becomes a deduplicated asset (sha256), re-encoded to WebP with a 256 px thumbnail.

```bash
npm run storage:dump -- "/path/to/backup"      # copies every image to a folder
npm run storage:restore -- "/path/to/backup"   # sends them back to the storage
npm run media:assets                           # moves legacy images to assets and drops unused ones
```

## Production

It runs on the GM's own PC with Docker, exposed through a [playit.gg](https://playit.gg/) HTTPS tunnel, with a Caddy proxy putting the API under `/api` on the same origin, and with database and images kept apart from development. Step by step in [`docs/DEPLOY.md`](docs/DEPLOY.md).

```bash
npm run prod:init -- https://<tunnel-address>   # creates .env.production with random secrets
npm run prod:up                                 # builds, migrates and starts (prod:down stops, data stays)
npm run prod:cli -- account:create-gm "GM"      # the GM account
npm run prod:backup                             # database and images in a dated folder
npm run prod:update                             # bumps the app version, backs up, rebuilds and restarts
```

`.env.production` (gitignored, template in `.env.production.example`):

| Variable                                             | Default            | Purpose                                                                                             |
| ---------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| `WEB_ORIGIN`                                         |                    | The tunnel's `https://` address (the same one the players open)                                     |
| `POSTGRES_PASSWORD` · `JWT_SECRET` · `S3_SECRET_KEY` | set by `prod:init` | Production secrets; keep a copy of the file with the backups                                        |
| `TRUST_PROXY`                                        | `1`                | Stays at `1`: playit forwards raw TLS, so every request comes through the agent                     |
| `SITE_DOMAIN`                                        | from `prod:init`   | The tunnel domain, without `https://` (Caddy issues its certificate)                                |
| `PLAYIT_SECRET_KEY`                                  |                    | Key of the playit Docker agent, which runs as a compose service and starts and stops with the table |
| `PROD_HTTPS_PORT` · `PROD_HTTP_PORT`                 | `443` · `80`       | On the PC's `127.0.0.1`: where the tunnel points (HTTP redirects to HTTPS)                          |
| `PROD_DB_PORT` · `PROD_STORAGE_PORT`                 | `5435` · `8334`    | On `127.0.0.1`: the database and the storage (backups and `prod:cli`)                               |
| `BACKUP_DIR` · `BACKUP_KEEP`                         | `backups/` · `10`  | Where backups go and how many to keep                                                               |

## Environment

API (`apps/api/.env`, validated in `core/services/env`):

| Variable                          | Default                          | Purpose                                                                                                                                                                              |
| --------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                        | `development`                    | `production` turns on the production safeguards                                                                                                                                      |
| `PORT`                            | `3333`                           | API port                                                                                                                                                                             |
| `WEB_ORIGIN`                      | `http://localhost:3000`          | The only origin accepted by CORS and the WebSocket                                                                                                                                   |
| `DATABASE_URL`                    |                                  | Postgres                                                                                                                                                                             |
| `JWT_SECRET`                      |                                  | Random, at least 32 characters                                                                                                                                                       |
| `COOKIE_SECURE`                   | `false`                          | HTTPS-only cookie. **Required `true` in production** (the API refuses to start without it)                                                                                           |
| `S3_ENDPOINT`                     | `http://127.0.0.1:8333`          | Image storage (the SeaweedFS from docker-compose)                                                                                                                                    |
| `S3_REGION`                       | `us-east-1`                      | Required by the S3 protocol (SeaweedFS accepts any value)                                                                                                                            |
| `S3_BUCKET`                       | `magista-media`                  | Image bucket (created when the API starts)                                                                                                                                           |
| `S3_ACCESS_KEY` · `S3_SECRET_KEY` | `magista` · `magista-dev-secret` | Storage credentials (the same as the container). **Change the secret in production** (the API refuses the default)                                                                   |
| `TRUST_PROXY`                     | `0`                              | Exact number of proxies in front of the API (so the rate limit sees the real IP). A higher value lets clients spoof their IP                                                         |
| `DEV_FORCED_D20`                  | empty                            | Development only: forces every d20 to this value (`20` for a critical, `1` for a fumble)                                                                                             |
| `DEV_QUICK_LOGIN`                 | `false`                          | Development only: enables `POST /auth/quick-login` (password-less login as the seed GM or player, from the local machine only). `NEXT_PUBLIC_DEV_QUICK_LOGIN=true` shows the buttons |
| `SEED_*`                          |                                  | Seed accounts (GM and test character), also used by the e2e suite                                                                                                                    |

Web (`apps/web/.env.local`): `NEXT_PUBLIC_API_URL` (default `http://localhost:3333`; the production image uses the relative `/api` behind the proxy).

## Testing

```bash
npm run lint && npm run typecheck
npm test             # unit tests (Vitest): shared, api and web
npm run test:e2e     # end-to-end (Playwright + axe), with npm run dev and the seed running
```

The e2e suite resets the seed's test character and never touches real sheets. It needs a Chromium: run `npx playwright install chromium` once, or point to one with `E2E_CHROMIUM_PATH=/path/to/chrome`. The Arena specs run WebGL through SwiftShader. Report in `e2e/playwright-report`.

## Architecture

```
apps/web/            Next App Router front end
  src/app/           thin routes (each page.tsx only renders a module page)
  src/modules/       feature slices: sheet, library, arena, table, marked, profile...
  src/core/          UI infra: http and socket services, global providers, design tokens
  src/shared/        atomic components (atoms → molecules → organisms) and generic hooks
apps/api/            Express + Socket.IO back end
  src/routes/        HTTP entry, translates the envelope into status codes
  src/realtime/      Socket.IO entry: handshake auth and per-domain handlers
  src/cli/           command-line entry (Roll20 import, accounts, storage)
  src/core/          controllers (validate + envelope) → models (Prisma) → services
packages/shared/     Zod schemas, game rules and typed contracts used by both sides
e2e/                 Playwright + axe specs, one per user flow
```

- Dependencies always point down: `route → controller → model → services/database`. Routes and socket handlers never touch Prisma.
- Every controller returns a `{ message, payload } | { error }` envelope with a typed error catalog, and the web consumes the same shape.
- Every unit is a folder accessed only through its `index.ts`, with co-located `.hook`, `.types`, `.constants`, `.utils` and `.test` files.
- Zustand 5 slices combined into one store per mount (no global singleton), and a single socket per tab.
- Deep dives in [`docs/`](docs): [`ARCH`](docs/ARCH.md), [`DOMAIN`](docs/DOMAIN.md), [`DESIGN`](docs/DESIGN.md), [`SECURITY`](docs/SECURITY.md), [`ARENA`](docs/ARENA.md), [`VFX`](docs/VFX.md), [`DEPLOY`](docs/DEPLOY.md) and [`MIGRATION`](docs/MIGRATION.md) (in Portuguese).

## Tools

This application uses the following open-source packages:

##### Core ones.

- [Next](https://nextjs.org/) (Framework, App Router with standalone output)
- [React](https://react.dev/) (UI library)
- [TypeScript](https://www.typescriptlang.org/) (Strongly typed programming language that builds on JavaScript)
- [Express](https://expressjs.com/) (HTTP server for the API)
- [Socket.IO](https://socket.io/) (Real-time rolls, presence and Arena sync)

##### Data & Validation

- [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) (Database and ORM)
- [Zod](https://zod.dev/) (Schema validation, the single source of truth for types)
- [SeaweedFS](https://github.com/seaweedfs/seaweedfs) with the [AWS SDK](https://github.com/aws/aws-sdk-js-v3) (Local S3-compatible image storage)
- [sharp](https://sharp.pixelplumbing.com/) (WebP re-encoding and thumbnails)

##### State & Interaction

- [Zustand](https://zustand.docs.pmnd.rs/) (State management with slices)
- [dnd-kit](https://dndkit.com/) (Drag and drop for folder trees and sortable lists)

##### Rendering & Visuals

- [PixiJS](https://pixijs.com/) with [pixi-filters](https://github.com/pixijs/filters) (WebGL battle map and VFX)
- [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework, v4, with a token-driven design system)
- [Lucide](https://lucide.dev/) (Icons)

##### Security

- [argon2](https://github.com/ranisalt/node-argon2) (Password hashing)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (Session JWT in an httpOnly cookie)
- [Helmet](https://helmetjs.github.io/) and [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) (Headers and login throttling)

##### Testing

- [Vitest](https://vitest.dev/) (Blazing fast unit test framework)
- [Playwright](https://playwright.dev/) with [axe-core](https://github.com/dequelabs/axe-core) (End-to-end and accessibility tests)

##### Code formatter, and other environment development tools.

- [ESLint](https://eslint.org/) (Javascript [linter](https://sourcelevel.io/blog/what-is-a-linter-and-why-your-team-should-use-it))
- [Prettier](https://prettier.io/) (Opinionated code formatter)
- [Docker](https://www.docker.com/) and [Caddy](https://caddyserver.com/) (Self-hosted production with automatic HTTPS)

## Author

**made by niloodev | Ezequiel Nilo**

**ANY TIPS OR FEEDBACK IS HIGHLY APPRECIATED! 🐸**

---
