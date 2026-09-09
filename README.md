# NOVA — Team Productivity Platform
Plan. Collaborate. Deliver. 

A team productivity platform — manage projects, assign tasks, track activity, and
collaborate with your team in one place.

**Live app:** https://nova-nu-peach.vercel.app

## Features

- **Auth** — register / login with JWT, protected routes
- **Projects** — create from templates, invite members, assign roles (owner / admin / member), per-project activity feed
- **Tasks** — create, assign, set status & priority, due dates, threaded comments, a personal "My Tasks" view
- **Calendar** — tasks laid out by due date
- **Team** — see everyone on a project and manage their roles
- **Notifications** — in-app notifications with read / read-all
- **UX** — dark / light theme, command-style search palette, toast feedback, skeleton loading states

## Tech stack

| Layer    | Stack                                              |
| -------- | ------------------------------------------------- |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Axios, Recharts |
| Backend  | Node.js, Express 4, Mongoose 8                    |
| Database | MongoDB (Atlas)                                   |
| Auth     | JWT (`jsonwebtoken`), `bcryptjs`                  |
| Hosting  | Frontend on Vercel, backend on Render             |

## Project structure

```
Nova/
├── client/          React + Vite frontend
│   ├── src/
│   │   ├── components/   reusable UI
│   │   ├── context/      Auth, Theme, Toast providers
│   │   ├── pages/        route views
│   │   └── services/     axios API client
│   └── vercel.json      SPA rewrite config
├── server/          Express API
│   ├── config/          db connection
│   ├── controllers/     route handlers
│   ├── middleware/       auth + error handling
│   ├── models/          Mongoose schemas
│   ├── routes/          API routes
│   └── tests/           Jest + Supertest
└── render.yaml      Render blueprint for the backend
```

## Running locally

**Prerequisites:** Node 18+, a MongoDB connection string (local or Atlas).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # then fill in the values below
npm run dev               # starts on http://localhost:5000
```

`server/.env`:

| Variable         | Description                                            |
| ---------------- | ---------------------------------------------------- |
| `PORT`           | API port (default `5000`)                            |
| `MONGO_URI`      | MongoDB connection string                            |
| `JWT_SECRET`     | long random string for signing tokens               |
| `JWT_EXPIRES_IN` | token lifetime, e.g. `7d`                            |
| `CLIENT_URL`     | comma-separated list of allowed frontend origins    |

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env      # set VITE_API_URL if not using the default
npm run dev               # starts on http://localhost:5173
```

`client/.env`:

| Variable       | Description                                        |
| -------------- | ----------------------------------------------- |
| `VITE_API_URL` | backend API base URL, e.g. `http://localhost:5000/api` |

## Tests

```bash
cd server
npm test         # Jest + Supertest, in-memory MongoDB
```

## API overview

All routes are prefixed with `/api`. Everything except `/auth/register`,
`/auth/login`, and `/health` requires an `Authorization: Bearer <token>` header.

| Method | Route                              | Description                    |
| ------ | --------------------------------- | ---------------------------- |
| GET    | `/health`                         | health check                 |
| POST   | `/auth/register`                  | create an account            |
| POST   | `/auth/login`                     | log in, returns a JWT        |
| GET    | `/auth/me`                        | current user                 |
| GET    | `/projects`                       | list your projects           |
| POST   | `/projects`                       | create a project             |
| GET    | `/projects/:id`                   | project detail               |
| PUT    | `/projects/:id`                   | update a project             |
| DELETE | `/projects/:id`                   | delete a project             |
| GET    | `/projects/:id/members`           | list members                 |
| POST   | `/projects/:id/members`           | add a member                 |
| PUT    | `/projects/:id/members/:userId/role` | change a member's role    |
| DELETE | `/projects/:id/members/:userId`   | remove a member              |
| GET    | `/projects/:id/activity`          | project activity feed        |
| GET    | `/tasks/mine`                     | tasks assigned to you        |
| GET    | `/tasks/project/:projectId`       | tasks in a project           |
| POST   | `/tasks`                          | create a task                |
| PUT    | `/tasks/:id`                      | update a task                |
| DELETE | `/tasks/:id`                      | delete a task                |
| POST   | `/tasks/:id/comments`             | comment on a task            |
| GET    | `/users`                          | list users                   |
| PUT    | `/users/me`                       | update your profile          |
| GET    | `/notifications`                  | your notifications           |
| PUT    | `/notifications/:id/read`         | mark one read                |
| PUT    | `/notifications/read-all`         | mark all read                |

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step Render + Vercel setup.
