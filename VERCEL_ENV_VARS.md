# Vercel Environment Variables for WealthWise Frontend

## Required Variables

Copy and paste these into Vercel Dashboard → Settings → Environment Variables:

```
PUBLIC_BACKEND_URL=https://rag-backend-q7cc.onrender.com/api
```

## Optional Variables (for monitoring)

```
VERCEL_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

## How to Add in Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings**
4. Click **Environment Variables**
5. Paste variable name in first field
6. Paste value in second field
7. Select environments: **Production**, **Preview**, **Development**
8. Click **Save**
9. **Deploy** to apply changes

## Current Configuration

Your frontend is configured to:
- **Localhost (development):** `http://localhost:5000/api`
- **Production (Render):** `https://rag-backend-q7cc.onrender.com/api`

The hardcoded approach in `app.js` works well for vanilla frontend deployment.

## Variables Summary Table

| Variable | Value | Scope |
|----------|-------|-------|
| `PUBLIC_BACKEND_URL` | `https://rag-backend-q7cc.onrender.com/api` | **REQUIRED** |
| `VERCEL_ENV` | `production` | Optional |

**Total Required: 1 variable**
