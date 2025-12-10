# Docker Setup

Docker Compose builds and runs the full stack (PostgreSQL + backend + frontend) with one command. Default ports: backend `5000`, frontend `3000`, Postgres `5432`.

## Prerequisites
- Docker Desktop or Docker Engine 24+
- Docker Compose v2 (included with recent Docker Desktop/Engine)

## Configure Environment
Compose reads variables from a `.env` file in the repo root (optional) and falls back to sane defaults. Create one to override secrets/URLs:

```env
POSTGRES_USER=food_user
POSTGRES_PASSWORD=food_password
POSTGRES_DB=food_ordering_db
JWT_SECRET=change-me-to-a-long-random-string
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
DATABASE_URL=postgresql://food_user:food_password@db:5432/food_ordering_db?schema=public
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
# Optional email/payment keys:
# EMAIL_HOST=...
# EMAIL_PORT=...
# EMAIL_USER=...
# EMAIL_PASS=...
# EMAIL_FROM=...
# STRIPE_SECRET_KEY=...
# STRIPE_WEBHOOK_SECRET=...
```

> Keep secrets out of git: add the `.env` file to `.gitignore` if you commit it locally.

## Build and Run
From the repo root:
```bash
docker compose up --build
```

- Postgres is seeded with the credentials above and persists data in the `postgres_data` volume.
- The backend image runs `prisma migrate deploy` on start, then boots the API at `http://localhost:5000`.
- The frontend is built with the Vite env values above and served at `http://localhost:3000`.
- File uploads and logs persist in named volumes (`backend_uploads`, `backend_logs`).

## Useful Commands
- Tail logs: `docker compose logs -f backend` (or `frontend` / `db`)
- Run Prisma commands: `docker compose exec backend npx prisma migrate deploy` or `docker compose exec backend npm run prisma:seed`
- Rebuild after code changes: `docker compose build backend frontend`
- Stop containers: `docker compose down`
- Stop and wipe data/volumes: `docker compose down -v`

## Health Checks
- API: `http://localhost:5000/api/health`
- Frontend: `http://localhost:3000`

If ports are busy, override the published ports in `docker-compose.yml` or change `PORT`/`CLIENT_URL` variables in `.env`.

## Deploying on a Remote Server (AWS/DigitalOcean/VM)
If running this on a remote server, you must update the URLs in the `.env` file to match the server's Public IP or Domain. **Localhost will not work for the frontend-to-backend connection.**

Example `.env` for a server with IP `203.0.113.10`:

```env
# The URL the browser uses to reach the API
VITE_API_URL=[http://203.0.113.10:5000/api](http://203.0.113.10:5000/api)
VITE_SOCKET_URL=[http://203.0.113.10:5000](http://203.0.113.10:5000)

# The URL the backend uses to redirect users (e.g. for Stripe/Email links)
CLIENT_URL=[http://203.0.113.10:3000](http://203.0.113.10:3000)
SERVER_URL=[http://203.0.113.10:5000](http://203.0.113.10:5000)
