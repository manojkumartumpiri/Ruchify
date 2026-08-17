# FoodFlow

FoodFlow is a food ordering web application. Customers will be able to browse restaurants, add menu items to a cart, and place orders. Administrators will be able to manage menus and order statuses.

## Project structure

```text
food-ordering/
  client/        React customer and admin web interface
  server/        Express REST API and Prisma database code
  plan.md        Build plan and progress tracker
```

An **API** is the backend service that the web interface calls to read or change data. A **REST API** is an API organised around web addresses such as `/api/restaurants`. A **dependency** is a reusable package installed by npm. An **environment variable** is a configuration value kept outside source code, such as a database password. An **ORM** is a tool that lets JavaScript code work with database records; Prisma is the ORM in this project.

## First-time setup

For complete local, Docker, and database-connection instructions, see [RUNNING.md](RUNNING.md).

1. Install Node.js 20 or newer from https://nodejs.org/. Node.js runs the JavaScript development tools and backend.
2. Install PostgreSQL 16 or newer and create an empty database named `foodflow`.
3. From this folder, run `npm install`. This downloads the dependencies declared in the package files.
4. Copy `server/.env.example` to `server/.env`, then update `DATABASE_URL` and `JWT_SECRET`. Do not commit this file.
5. Run `npm run db:generate` to create Prisma's database helper.
6. Run `npm run db:migrate` to create the database tables. A **database migration** is a saved set of instructions that brings the database structure in line with the Prisma schema.
7. Run `npm run dev`.

The frontend will be available at `http://localhost:5173`; the backend health check will be at `http://localhost:4000/api/health`.

## Application features

- Customer registration and login with hashed passwords and signed JWT login tokens.
- Restaurant browsing, menu viewing, cart management, and order placement.
- Customer order history.
- Admin menu-item creation, editing, availability updates, and deletion.
- Admin order list and status updates.
- PostgreSQL migration and seed data. The seed administrator is `admin@foodflow.test` with password `Admin123!`; change it before any non-local use.

## Test and Docker

After setup, run `npm test` to execute the server validation tests. Open `http://localhost:4000/api/health`; it should return JSON containing `"status":"ok"`. The frontend will be at `http://localhost:5173`.

To run the complete application with Docker, install Docker Desktop and run `docker compose up --build`. Docker packages the application and its database into repeatable containers. Stop it with `docker compose down`; the database data remains in Docker's named volume.

## Security baseline

- `.env` is ignored so secrets such as database credentials are not committed.
- The JWT secret is configured as an environment variable rather than written in source code. A JWT is a signed login token used by the API to identify a user.
- The server limits browser access to the configured frontend address with CORS and applies basic rate limiting.
- Future account passwords will be hashed, meaning they are converted into a one-way value rather than stored as readable text.
