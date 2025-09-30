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
