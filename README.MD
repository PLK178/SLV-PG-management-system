## Run with Docker and Nginx

The frontend is built into an image based on the official Nginx image. Nginx
serves the React application and proxies `/api` requests to the FastAPI backend.

```bash
docker compose up --build
```

Open `http://localhost:8080`.

PostgreSQL data is stored in the named `postgres_data` Docker volume, so data is
retained when containers are recreated. The default administrator credentials
are `admin@gmail.com` and `admin`.

The PostgreSQL service is internal to Docker. The backend connects using the
`DATABASE_URL` configured in `docker-compose.yml`; it is not published to the
host machine.

Redis caches frequently requested dashboard lists for 60 seconds. It uses an
`allkeys-lru` eviction policy with a 128 MB memory limit, so least-recently-used
entries are discarded automatically when the cache fills.

## API smoke tests

With the application already running, check every API route without changing
data:

```bash
python3 -m unittest tests/test_api_smoke.py
```

Set `API_BASE_URL` to target a different running environment, for example:

```bash
API_BASE_URL=https://example.com/api python3 -m unittest tests/test_api_smoke.py
```

## Database smoke test

With PostgreSQL running and reachable through `DATABASE_URL`, check the database
connection, schema, and seeded data:

```bash
python3 -m unittest tests/test_database_smoke.py
```

This test only reads from the database. It verifies the core tables exist and
confirms the seeded admin account can log in with `admin@gmail.com` / `admin`.
