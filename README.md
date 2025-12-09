# Digital Wallet

## Intro

This is a full-stack digital wallet application consisting of a TypeScript + Express backend and a React + Vite frontend. The backend implements user authentication, wallet management, transactions, and integrations such as Cloudinary (for file storage), Redis (for sessions/caching), and MongoDB (for persistent storage). The frontend is a modern React + TypeScript app built with Vite.

## Frontend

- **Prerequisites:** Node.js (v16+ recommended), npm or pnpm/yarn
- **Install dependencies:**

```bash
cd frontend
npm install
# or: pnpm install
```

- **Run in development:**

```bash
cd frontend
npm run dev
# Open http://localhost:5173 (Vite prints the URL)
```

- **Build for production:**

```bash
cd frontend
npm run build
```

- **Preview production build:**

```bash
cd frontend
npm run preview
```

Files of interest:
- `src/` — React components and pages
- `public/` — static assets
- `vite.config.ts` — Vite configuration

## Backend

- **Prerequisites:** Node.js (v16+ recommended), a running MongoDB instance, Redis (optional but recommended for sessions), npm or pnpm/yarn
- **Install dependencies:**

```bash
cd backend
npm install
# or: pnpm install
```

- **Environment variables:** create a `.env` in `backend/` (see the **Input** section below for required keys).

- **Run in development:**

```bash
cd backend
npm run dev
# This runs: ts-node-dev --respawn --transpile-only src/server.ts
```

- **Build for production:**

```bash
cd backend
npm run build
npm start
```

Files of interest:
- `src/` — backend source code
- `src/app/config/` — configuration (Cloudinary, multer, passport, env)
- `src/server.ts` — application entry

## Database

- **Primary database:** MongoDB (accessed via `mongoose`)
- **Cache / session store:** Redis (used for session management and caching)
- **File storage:** Cloudinary (images and user uploads)
- **Mail provider:** SMTP via `nodemailer` (configurable via environment variables)

Data flows from frontend API calls → backend controllers → services → MongoDB (persist) and Redis (cache/session). File uploads are proxied to Cloudinary.

## Flow chart

Quick example (mermaid):

```mermaid
flowchart LR
    A["User (browser)"] -->|HTTP request| B["Frontend"]
    B -->|"API call (REST)"| C["Backend: Express"]
    C --> D["Auth Service / Controllers"]
    C --> E[("MongoDB")]
    C --> F[("Redis")]
    C --> G["Cloudinary"]
```

## Input

The backend expects the following environment variables (create `.env` at `backend/.env`):

```env
PORT=3005
MONGO_URI=mongodb://user:pass@host:port/dbname
NODE_ENV=development
BCRYPT_SALT_ROUNDS=10

# Admin bootstrap
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=changeme
SUPER_ADMIN_PIN=0000
SUPER_ADMIN_ADDRESS="Admin Address"

# JWT
ACCESS_TOKEN_JWT_SECRET=some_long_secret
ACCESS_TOKEN_JWT_EXPIRATION=15m
REFRESH_TOKEN_JWT_SECRET=another_secret
REFRESH_TOKEN_JWT_EXPIRATION=7d

EXPRESS_SESSION_SECRET=session_secret_here
FRONTEND_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP (nodemailer)
SMTP_USER=smtp_user
SMTP_PASS=smtp_pass
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM="noreply@example.com"

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

Note: `backend/src/app/config/env.ts` throws an error if required env vars are missing — ensure all required keys are present.

## ER diagram

Suggested core entities:
- User (profile, email, hashed password, pin)
- Wallet (balance, currency, owner)
- Transaction (amount, type, status, source, destination, timestamp)
- Notification / Audit logs

Include relations: User 1 — 1 Wallet, Wallet 1 — N Transaction.

## Architecture

- **Client:** React + TypeScript + Vite. Uses `react-router`, `react-hook-form`, and state with `@reduxjs/toolkit`.
- **API server:** Node.js + Express + TypeScript. Uses `zod` for validation, `passport` and JWT for authentication.
- **Database layer:** MongoDB via `mongoose` for schema and models.
- **Storage & Integrations:** Cloudinary for file storage, Redis for session/cache, Nodemailer for email, PDFKit for PDF reports.
- **Dev tooling:** ESLint, TypeScript, Vite, ts-node-dev for live backend reloads.

Deployment recommendations:
- Containerize services with Docker (frontend, backend, MongoDB, Redis)
- Use environment-specific secrets (e.g., hosted secret manager)
- Use a process manager or node process runner for production (or a container orchestration platform)

## Tools uses

- Node.js
- npm / pnpm
- Vite
- TypeScript
- ESLint
- MongoDB (Mongoose)
- Redis
- Cloudinary
- Nodemailer
- Passport (auth)
- PDFKit

## Languages

- **TypeScript** — primary language for both backend and frontend
- **HTML / CSS** — frontend markup and styling (Tailwind CSS is used in the project)
- **Shell** — scripts and run commands

## Future scopes

- Add comprehensive automated tests (unit/integration) and CI pipelines
- Dockerize the stack and provide `docker-compose` for local dev
- Add role-based access control and more granular permissions
- Improve observability: logging, metrics, and error tracking (Sentry/Prometheus)
- Add rate limiting and stronger security hardening
- Add mobile client (React Native) and public API docs (OpenAPI / Swagger)

----

### Acknowledgments
- Inspired by various open-source wallet and fintech applications
- Thanks to the maintainers of the libraries and tools used in this project

----

### LICENSE
- MIT License (see `LICENSE` file for details)

