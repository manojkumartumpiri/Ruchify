# Running FoodFlow and Connecting PostgreSQL

This guide shows two ways to run FoodFlow: directly on your computer or with Docker. PostgreSQL is the database server where FoodFlow stores user accounts, restaurants, menu items, and orders.

## Option 1: Run locally

### 1. Install required software

Install Node.js 20 or newer and PostgreSQL 16 or newer. Node.js runs the frontend development server and backend API. PostgreSQL runs the database.

Confirm Node.js is ready:

```powershell
node --version
npm --version
```

### 2. Create the database

Open the PostgreSQL command-line tool, `psql`, then create a user and database:

```sql
CREATE USER foodflow WITH PASSWORD 'choose-a-local-password';
CREATE DATABASE foodflow OWNER foodflow;
```

If PostgreSQL asked you for a password during installation, use that account to run the commands above. In pgAdmin, the same result can be created through Login/Group Roles and Databases.

### 3. Configure FoodFlow

From the project folder, install project packages:

```powershell
npm install
```

Copy the backend template and edit it:

```powershell
Copy-Item server/.env.example server/.env
```

Set `DATABASE_URL` in `server/.env` to match your PostgreSQL account:

```env
DATABASE_URL="postgresql://foodflow:choose-a-local-password@localhost:5432/foodflow?schema=public"
JWT_SECRET="use-a-long-random-value-here"
CLIENT_ORIGIN="http://localhost:5173"
PORT=4000
```

`DATABASE_URL` is the connection address Prisma uses. Its parts are `postgresql://username:password@host:port/database`.

### 4. Create tables and starter data

Run these commands from the project folder:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

The migration creates the tables. The seed adds three restaurants and a development administrator account: `admin@foodflow.test` / `Admin123!`. Change that password before any non-local deployment.

### 5. Start the application

```powershell
npm run dev
```

Open `http://localhost:5173` for the application. Check `http://localhost:4000/api/health` for a response similar to:

```json
{ "status": "ok", "database": "connected" }
```

Run backend validation tests with:

```powershell
npm test
```

## Option 2: Run with Docker

Install Docker Desktop, then run this from the project folder:

```powershell
docker compose up --build
```

Docker starts PostgreSQL, the API, and the frontend together. Open `http://localhost:5173` after the containers start. Stop the services with `docker compose down`.

To remove the Docker database data as well, run `docker compose down -v`. This deletes all data created in the Docker database.

## Connect to the database

For a local PostgreSQL installation, use either pgAdmin or this command:

```powershell
psql "postgresql://foodflow:choose-a-local-password@localhost:5432/foodflow"
```

For Docker, connect through the database container:

```powershell
docker compose exec database psql -U foodflow -d foodflow
```

Useful SQL commands after connecting:

```sql
\dt
SELECT id, email, role FROM "User";
SELECT name, cuisine FROM "Restaurant";
SELECT id, status, total FROM "Order";
```

Prisma also provides a browser-based database viewer. Run this from the project folder after configuring `server/.env`:

```powershell
npx prisma studio --schema server/prisma/schema.prisma
```

Never put a production database password or JWT secret in source files. Keep them only in environment variables or a secret manager.
