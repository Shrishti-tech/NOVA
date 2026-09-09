# Deploying NOVA

Backend → Render, Frontend → Vercel. Both deploy straight from this GitHub repo
(`Shrishti-tech/NOVA`), so push your latest commits before starting.

## 1. Backend on Render

1. Go to [render.com](https://render.com) → **New** → **Blueprint**.
2. Connect the `Shrishti-tech/NOVA` repo. Render will detect `render.yaml` at
   the repo root and configure the `nova-server` web service automatically
   (root dir `server`, build `npm install`, start `npm start`, health check
   `/api/health`).
3. When prompted for environment variables, fill in:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string (don't reuse your local dev one)
   - `CLIENT_URL` — leave a placeholder for now (e.g. `http://localhost:5173`); you'll update it after step 2
4. Deploy. Once live, copy the service URL, e.g. `https://nova-server-xxxx.onrender.com`.
5. Test it: `curl https://nova-server-xxxx.onrender.com/api/health` should return `{"status":"ok"}`.

Note: Render's free tier spins down after ~15 minutes of inactivity — the
first request after idling takes 30-60s to wake up. Fine for a demo, not for
production traffic.

## 2. Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import the `Shrishti-tech/NOVA` repo.
3. Under **Root Directory**, click Edit and select `client` (important — this
   is a monorepo, Vercel needs to know the frontend lives in a subfolder).
4. Framework preset should auto-detect as **Vite**. Build command
   `npm run build`, output directory `dist` (defaults are correct).
5. Add an environment variable: `VITE_API_URL` = `https://nova-server-xxxx.onrender.com/api`
   (your Render URL from step 1, with `/api` appended).
6. Deploy. Copy the resulting URL, e.g. `https://nova.vercel.app`.

## 3. Connect them

Go back to Render → `nova-server` → **Environment**, update `CLIENT_URL` to
your Vercel URL from step 2.5 (e.g. `https://nova.vercel.app`), save, and let
it redeploy. Multiple origins can be comma-separated if you also want local
dev to keep working:

```
CLIENT_URL=https://nova.vercel.app,http://localhost:5173,http://localhost:5174
```

## 4. Verify

1. Open your Vercel URL.
2. Register an account, create a project, add a task — confirm it all works
   against the live Render backend + your Atlas database.
3. Open browser dev tools → Network tab → confirm no CORS errors.

## Redeploying after code changes

Both Render and Vercel auto-redeploy on push to your connected branch (`main`
by default). Just `git push` and both services pick it up.

## Local development is unaffected

`npm run dev` in `server/` and `client/` still points at `localhost` by
default — these deploy configs only kick in on Render/Vercel.
