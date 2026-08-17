# FoodFlow Implementation Plan

## Progress Status

| Phase | Status | Notes |
| --- | --- | --- |
| 1. Project foundation | Complete | React/Vite client, Express API, Prisma schema, environment templates, and setup guide created. |
| 2. Authentication | Complete | Registration, login, password hashing, JWTs, and protected routes implemented. |
| 3. Database setup | Complete | Initial PostgreSQL migration and repeatable development seed data added. |
| 4. Restaurant/Menu APIs | Complete | Public restaurant/menu reads plus protected admin CRUD endpoints implemented. |
| 5. Orders | Complete | Cart checkout, customer history, and protected admin status updates implemented. |
| 6. Customer frontend | Complete | Restaurant browsing, menu, cart, authentication, checkout, and order history screens built. |
| 7. Admin frontend | Complete | Menu item creation/editing/availability/deletion and order-status management built. |
| 8. Integration | Complete | Frontend API client connects all MVP customer and admin workflows. |
| 9. Docker | Complete | Docker Compose configuration provisions frontend, API, and PostgreSQL. |
| 10. Testing and cleanup | Complete | Validation tests, error responses, environment templates, README, and ignore rules added. |

## Phase 1: Project Foundation (Complete)

Created:

* `client/`: React and Vite frontend configured with Tailwind CSS.
* `server/`: Express API with a health endpoint at `/api/health`.
* `server/prisma/schema.prisma`: PostgreSQL schema for User, Restaurant, MenuItem, Order, and OrderItem.
* `server/.env.example`: safe configuration template; the actual `.env` remains ignored by Git.
* `README.md`: beginner-friendly setup, run, and smoke-test instructions.

All implementation phases are complete. Runtime verification was not possible in this workspace because Node.js/npm are not installed. Use the README to run `npm test` or `docker compose up --build` in an environment that has the required tools.

---

For every major step:

1. Explain what we are building.
2. Explain why we need it.
3. Show the project structure.
4. Create the necessary files.
5. Provide the complete contents of each new/changed file.
6. Tell me exactly how to run it.
7. Tell me how to test it.
8. Wait for me to confirm that it works before moving to the next major step.

Do not assume that I know programming concepts.

If you use a concept such as:

* API
* REST
* middleware
* ORM
* database migration
* environment variable
* JWT
* async/await
* Docker
* dependency

explain it briefly in simple language the first time you introduce it.

---

# 3. Technology Stack

Use the following stack unless there is a strong technical reason to change it.

## Frontend

* React
* Vite
* JavaScript
* Tailwind CSS

Keep the frontend simple and clean.

Do not spend excessive time on animations or visual effects.

## Backend

* Node.js
* Express.js
* JavaScript

Build a REST API.

## Database

* PostgreSQL
* Prisma ORM

## Authentication

For the MVP, implement simple authentication using:

* Email
★★★★★
Italian • 25 min

Burger Point
★★★★☆
Burgers • 20 min

Spice Garden
★★★★★
Indian • 30 min
```

---

### Restaurant Details

Display:

* Restaurant name
* Rating
* Cuisine
* Delivery time
* Menu categories
* Menu items
* Add to Cart button

Example:

```text
Pizza House
★★★★★
Italian
25–30 min

Pizzas

Margherita
Tomato, mozzarella, basil
₹299

[ Add ]

Farmhouse
Onion, capsicum, mushrooms
₹399

[ Add ]
```

---

## Manage Menu

Admin should be able to:

* View menu items
* Add menu item
* Edit menu item
* Delete menu item

Menu item fields:

* Name
* Description
* Price
* Category
* Image URL
* Available/unavailable
* Restaurant

---

## Manage Orders

Admin should be able to:

* View orders
* View order details
* Change order status

Order statuses:

```text
PLACED
CONFIRMED
PREPARING
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
```

---

# 6. Database Design

Create a PostgreSQL database using Prisma.

Use approximately these entities:

```text
User
Restaurant
MenuItem
Order
OrderItem
```

Relationships:

```text
User
The frontend should show user-friendly error messages.

Never expose database errors or sensitive information directly to users.

---

# 10. Validation

Validate:

* Email
* Password
* Restaurant fields
* Menu item fields
* Prices
* Quantities
* Order data

Do basic server-side validation.

Never trust data sent by the frontend.

---

# 11. Security Basics

Even though this is an MVP, follow good practices:

* Passwords must be hashed.
* Never store plaintext passwords.
* JWT secret must come from environment variables.
* Database credentials must come from environment variables.
* Do not commit `.env` files.
* Add `.env` to `.gitignore`.
* Validate API input.
* Protect admin routes.
* Do not expose secrets in frontend code.
* Use appropriate CORS configuration.
* Add basic rate limiting if practical.

Explain each security measure briefly.

---

### Phase 4 — Restaurant/Menu APIs

Build:

* Restaurant endpoints
* Menu endpoints
* Admin CRUD

### Phase 5 — Orders

Build:

* Cart
* Order creation
* Order history
* Order status

### Phase 6 — Frontend

Build the customer UI.

### Phase 7 — Admin UI

Build the admin dashboard.

### Phase 8 — Integration

Connect frontend and backend.

Test the complete flow.

### Phase 9 — Docker

Containerize the application.

### Phase 10 — Testing and cleanup

Fix bugs.

Improve error handling.

Clean up the code.

Update README.

---

# 17. Keep the Scope Under Control

This is extremely important.

Do NOT add:

* Real payments
* Delivery driver tracking
* Maps
* Chat
* Recommendation engines
* AI
* Microservices
* Kubernetes

```text
Customer
   ↓
FoodFlow Web Application
   ↓
REST API
   ↓
PostgreSQL
```

with:

* Authentication
* Restaurants
* Menu
* Cart
* Orders
* Admin dashboard
* Error handling
* Validation
* Tests
* Docker

Then we will separately build the Cloud/DevOps layer:

```text
GitHub
   ↓
CI/CD
   ↓
Security Scanning
   ↓
Docker
   ↓
Container Registry
   ↓
AWS
   ↓
Infrastructure as Code
   ↓
Monitoring
   ↓
Logging
   ↓
Autoscaling
```

The final project should look like a **normal business web application running on professionally managed cloud infrastructure**.
