# Deploying LumiChain to Vercel

This guide explains how to deploy the LumiChain full-stack platform (React Vite frontend + Express serverless API) to **Vercel**.

---

## 1. Architecture on Vercel

```
            User Browser / Mobile
                      │
                      ▼
             https://your-app.vercel.app
                      │
         ┌────────────┴────────────┐
         │                         │
    /api/* and /health          /* (All UI Routes)
         │                         │
         ▼                         ▼
   api/index.js             lumichain-frontend/dist
(Express Serverless App)    (Single Page Application)
         │
         ▼
  Supabase PostgreSQL
```

- **Frontend**: Built with Vite and served statically through Vercel's Edge CDN.
- **Backend**: Express API deployed as a Vercel Serverless Function via [`api/index.js`](file:///c:/Users/Koushik/Documents/GitHub/Lumichain/api/index.js).
- **Database**: Cloud Supabase PostgreSQL instance (already configured and live).
- **Routing**: Handled by [`vercel.json`](file:///c:/Users/Koushik/Documents/GitHub/Lumichain/vercel.json) rewrites.

---

## 2. Environment Variables to Set in Vercel

When importing your project in Vercel, go to **Settings > Environment Variables** and add the following keys:

| Variable Name | Required | Recommended Value / Description |
|---|---|---|
| `SUPABASE_URL` | **Yes** | `https://zvyrwdqfdgympspojdrr.supabase.co` |
| `SUPABASE_ANON_KEY` | **Yes** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eXJ3ZHFmZGd5bXBzcG9qZHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODg5NTksImV4cCI6MjEwNjg2NDk1OX0.zeTNuKP2JB_C9MYtqWYzITnOCGBZTpE1sddWVDCurzs` |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | Optional | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| `BLOCKCHAIN_RPC_URL` | Optional | `http://127.0.0.1:8545` (or Sepolia RPC URL) |
| `AI_SERVICE_URL` | Optional | URL of deployed FastAPI service (fallback mode active if not set) |

---

## 3. Deployment Steps

### Method A: Connect via Vercel Web Dashboard (Recommended)

1. **Commit and Push your changes to GitHub**:
   ```bash
   git add .
   git commit -m "Configure full-stack Vercel deployment"
   git push origin main
   ```

2. **Open Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in with your GitHub account.

3. **Import Project**:
   - Click **"Add New..."** > **"Project"**.
   - Select your repository: `thehyperboy/Lumichain`.
   - **Framework Preset**: Select **Vite** (or leave as **Other**; `vercel.json` automatically configures the build).
   - **Root Directory**: Leave as `./` (the repository root).

4. **Add Environment Variables**:
   - Under the **Environment Variables** section, paste:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - (Optional) `BLOCKCHAIN_CONTRACT_ADDRESS`

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will run `npm run build`, bundle the frontend into `lumichain-frontend/dist`, deploy the API serverless function, and give you a live production URL (e.g., `https://lumichain.vercel.app`).

---

### Method B: Deploy using Vercel CLI

If you prefer deploying directly from your terminal:

1. **Login to Vercel**:
   ```bash
   npx vercel login
   ```

2. **Deploy to Preview**:
   ```bash
   npx vercel
   ```
   - *Set up and deploy?* -> `y`
   - *Which scope?* -> Select your account
   - *Link to existing project?* -> `n`
   - *Project name?* -> `lumichain`
   - *Directory?* -> `./`

3. **Set Environment Variables via CLI**:
   ```bash
   npx vercel env add SUPABASE_URL production
   npx vercel env add SUPABASE_ANON_KEY production
   ```

4. **Deploy to Production**:
   ```bash
   npx vercel --prod
   ```

---

## 4. Verification After Deployment

Once deployed, verify the endpoints on your Vercel URL:

1. **Frontend App**: `https://<your-vercel-domain>.vercel.app/`
2. **API Health**: `https://<your-vercel-domain>.vercel.app/health`
3. **Streetlights API**: `https://<your-vercel-domain>.vercel.app/api/streetlights`
4. **Tickets API**: `https://<your-vercel-domain>.vercel.app/api/tickets`
