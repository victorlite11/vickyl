# Deploying to Render

This repository can be deployed to Render either as a single Web Service (backend serves the built frontend) or as two services (static frontend + backend API). Below are recommended build and start commands, required environment variables, and quick migration/seed steps.

## Recommended environment variables

Set these in the Render service's Environment (or in the Dashboard when creating the service):

- `JWT_SECRET` — a long random secret for signing JWTs (required).
- `DATABASE_URL` — (optional, recommended) Postgres connection string. If not set, the app will use the bundled SQLite file at `backend/lesson-spark.db` (SQLite is ephemeral on Render and not suitable for persistent production data).
- `AUTO_SEED` — set to `1` if you want the seed script to run automatically on service start (useful for first deploy only).
- `ADMIN_PASSWORD` / `TEACHER_PASSWORD` — optional overrides for seeded users.
- `PORT` — Render sets this automatically; the backend reads `process.env.PORT`.

## Option A — Single-service (recommended for simplicity)

This makes the backend build the frontend and serve it from `backend/dist`.

Render build command (set on the Web Service):

```
npm ci && npm run build && npm --prefix backend ci && rm -rf backend/dist && cp -r dist backend/dist
```

Notes:
- `npm ci` installs root deps (frontend). `npm run build` builds the Vite app into `dist`.
- `npm --prefix backend ci` installs backend deps. The `cp -r dist backend/dist` step copies the built frontend into the backend so the backend can serve everything from a single service.

Render start command:

```
node backend/index.js
```

Render will provide a production `PORT` environment variable automatically.

## Option B — Two services (frontend + backend)

If you prefer to host the frontend separately as a static site and the backend as an API service (recommended for production scale and smaller surface for server-side), create two services:

- Static Site (Frontend)
  - Build command: `npm ci && npm run build`
  - Publish directory: `dist`

- Web Service (Backend)
  - Build command: `npm --prefix backend ci`
  - Start command: `node backend/index.js`
  - Set `DATABASE_URL`, `JWT_SECRET`, and any other env vars on the backend service.

When using a separate static frontend, set the frontend's API base URL in your Vite environment or environment variables to point at the backend service's URL.

## Database & migrations

If you use Postgres (recommended for production):

1. Create a Postgres database on Render (or another host) and copy the `DATABASE_URL` into the backend service env.
2. After the service deploys, open the Render shell for the backend service and run:

```
npm --prefix backend run migrate
npm --prefix backend run seed
```

The `migrate` script creates tables using `CREATE TABLE IF NOT EXISTS` statements. The `seed` script seeds an admin and example teacher and prints tokens.

If you use `AUTO_SEED=1`, the seed script will be invoked automatically on service start (useful for initial deploys only).

## Troubleshooting

- If the Render deploy fails due to missing secrets, make sure `RENDER_API_KEY` (if used with CI), `JWT_SECRET`, and `DATABASE_URL` are set where needed.
- SQLite is not persistent on Render. For production, prefer Postgres and set `DATABASE_URL`.
- If you prefer the GitHub Actions flow to build and copy the `dist` into `backend/dist`, ensure the workflow has the `RENDER_API_KEY` and `RENDER_SERVICE_ID` secrets configured in GitHub so the job can trigger publish.

## Quick checklist before deploy

- [ ] Add `JWT_SECRET` in Render environment.
- [ ] Add `DATABASE_URL` (recommended) and create a Postgres instance.
- [ ] Set `AUTO_SEED=1` only for the first deploy if you want example data.
- [ ] Ensure `node backend/index.js` is set as the start command on the backend service.

---

If you want, I can also add a small Render template YAML or update the GitHub Actions workflow to more closely match the exact commands you plan to run on Render. Tell me which option (single-service or two-service) you'd like to use and I will adjust the docs/workflow accordingly and push it.
Render deployment notes

Recommended setup for Render (two services):

1) Backend (Web Service)
- Environment:
  - Name: lesson-spark-backend
  - Branch: main
  - Root Directory: backend
  - Build Command: npm install
  - Start Command: npm start
  - Environment Variables:
    - PORT: (leave default)
    - JWT_SECRET: set a secret string
    - DB_FILE: lesson-spark.db (optional; Render filesystem is ephemeral)

Notes:
- The backend uses SQLite by default. Render instances have an ephemeral filesystem: any data stored in the local SQLite file will be lost on deploy or instance restart. For production, use a managed DB (Postgres) and update the backend to use it.

2) Frontend (Static Site)
- Environment:
  - Name: lesson-spark-frontend
  - Branch: main
  - Root Directory: (repository root)
  - Build Command: npm install; npm run build
  - Publish Directory: dist

Alternative: Single Web Service (recommended)
- The repository now supports serving the frontend from the backend for a single-service deploy on Render.
- The GitHub Actions workflow will build the frontend, copy `dist` into `backend/dist`, and trigger a Render deploy.
- To use this flow on Render:
  - Create a Web Service and set Root Directory to `backend`.
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Environment variables: `JWT_SECRET` (string), `DATABASE_URL` (optional Postgres connection string if you want persistent DB)

GitHub Actions / Render integration
- The repo includes `.github/workflows/deploy-render.yml` which runs on push to `main`. It expects two repository secrets:
  - `RENDER_API_KEY` — your Render API key (Account → API Keys)
  - `RENDER_SERVICE_ID` — the Render service ID for the backend Web Service you want to deploy

Notes about artifacts and builds
- The workflow copies built frontend files into `backend/dist`. The backend will serve `backend/dist` when present. If you prefer, remove the workflow commit step that adds built files to the repo.

Troubleshooting
- If subject seeding or POST requests return 401/Invalid token: ensure JWT_SECRET is identical between your local dev and Render environment when you generate tokens.
- To persist data, migrate to Postgres and set DB_URL or equivalent in env.

Postgres on Render (quick guide)
- Create a new "Postgres" managed database in Render.
- After creation, copy the DATABASE_URL from the database dashboard; it looks like:

  postgres://<user>:<password>@<host>:<port>/<dbname>

- In Render Web Service settings, add an environment variable named `DATABASE_URL` with that value. The backend will automatically use Postgres when this variable is present.
- Run migrations and seed on the server (you can run these once via Render's dashboard shell):

  cd backend
  npm ci
  npm run migrate
  npm run seed

Security
- Never commit JWT secrets to the repository. Use Render's Environment variables settings to store secrets.

Contact
- If you want, I can add a small migration to Postgres and a GitHub Actions workflow to auto-deploy on push.
