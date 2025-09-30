# Lesson Spark Backend

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server (dev mode):
   ```sh
   npm run dev
   ```
   Or start normally:
   ```sh
   npm start
   ```

- The server will run on http://localhost:4000
- The SQLite database file will be created as `lesson-spark.db` in this folder.

## API Endpoints
- `POST /api/register` — Register a new user
- `POST /api/login` — Login and get JWT
- `GET /api/stats` — Get dashboard stats (auth required)
- `GET /api/recent` — Get recent activity (auth required)
- `POST /api/submissions` — Create a submission (auth required)
- `GET /api/submissions` — List all submissions (auth required)
- `PATCH /api/submissions/:id` — Update submission status (auth required)

## Notes
- All protected endpoints require an `Authorization: Bearer <token>` header.
- You can use the same backend for both teacher and admin roles.
