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

Alternative: Single Web Service
- You can serve the built frontend from the backend by copying `dist` into backend/public and serving static files from Express. If you choose this, set the Root Directory to the repository root and use a combined build/start script.

Troubleshooting
- If subject seeding or POST requests return 401/Invalid token: ensure JWT_SECRET is identical between your local dev and Render environment when you generate tokens.
- To persist data, migrate to Postgres and set DB_URL or equivalent in env.

Security
- Never commit JWT secrets to the repository. Use Render's Environment variables settings to store secrets.

Contact
- If you want, I can add a small migration to Postgres and a GitHub Actions workflow to auto-deploy on push.
