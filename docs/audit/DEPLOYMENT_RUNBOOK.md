# CivicSphere AI — Production Deployment & Operations Runbook

**Target Platforms:** Vercel (Frontend & Serverless Python Backend) / Docker Container  
**Cost Model:** 100% Free / Zero Credit Card Required  
**Security Standard:** Zero Hardcoded Secrets, Verified Cryptographic Environment

---

## 1. Required Environment Variables

All variables MUST be configured in the deployment platform settings (Vercel Project Settings -> Environment Variables). Never commit secret values to Git!

| Variable Name | Required | Category | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Database | Async PostgreSQL connection string pointing to Supabase Pooler |
| `JWT_SECRET_KEY` | Yes | Security | 32+ character random secret used for HMAC-SHA256 token signing |
| `JWT_ALGORITHM` | No | Security | Defaults to `HS256` |
| `NEO4J_URI` | Yes | Database | Neo4j Aura bolt/neo4j+s URI |
| `NEO4J_USER` | Yes | Database | Neo4j Aura username |
| `NEO4J_PASSWORD` | Yes | Database | Neo4j Aura instance password (min 16 chars) |
| `NEO4J_DATABASE` | Yes | Database | Target Neo4j database name (e.g. `neo4j` or instance name) |
| `REDIS_URL` | Yes | Cache | Upstash Redis connection string (`rediss://...`) |
| `GOOGLE_API_KEY` | Yes | AI | Google Gemini API key for document extraction and reasoning |
| `ENVIRONMENT` | Yes | Config | Set to `production` |
| `STORAGE_BACKEND` | Yes | Storage | Set to `supabase` (or `local` in dev) |
| `SUPABASE_URL` | Yes | Storage | Supabase project API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Storage | Supabase service role key for private bucket access |
| `SUPABASE_STORAGE_BUCKET` | Yes | Storage | Document bucket name (e.g. `civicsphere-demo-documents`) |
| `ALLOWED_ORIGINS` | Yes | Security | JSON array of permitted origins, e.g. `["https://civicsphere.vercel.app"]` |
| `NEXT_PUBLIC_API_URL` | Yes (Frontend) | Frontend | Base HTTPS URL of the deployed FastAPI backend |

---

## 2. Step-by-Step Vercel Deployment Instructions

### Project A: Backend (`civicsphere-backend`)
1. Log into [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New...** -> **Project** and import `Khushbu112005/Finalyear_MajorProject`.
3. Set **Project Name** to `civicsphere-backend`.
4. Framework Preset: Leave as **Other** (Vercel automatically detects `vercel.json` and `@vercel/python`).
5. Root Directory: Leave as `./`.
6. Add the 15 backend environment variables listed above.
7. Click **Deploy**.
8. Verify deployment by visiting `https://<backend-domain>.vercel.app/health`.

### Project B: Frontend (`civicsphere-web`)
1. In the Vercel dashboard, click **Add New...** -> **Project** and select the same repository.
2. Set **Project Name** to `civicsphere-web`.
3. Framework Preset: **Next.js** (automatically detected).
4. Root Directory: Click **Edit** and choose `apps/web`.
5. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://<backend-domain>.vercel.app` (from Project A)
6. Click **Deploy**.
7. Once deployed, open the live URL and test citizen registration, search, and dashboard navigation.

---

## 3. Post-Deployment Verification & Smoke Test Checklist

- [ ] `GET /health` returns HTTP 200 `{"status": "HEALTHY"}`.
- [ ] `GET /docs` serves interactive OpenAPI Swagger documentation.
- [ ] `POST /api/v1/auth/register` creates citizen account and sets `access_token` cookie.
- [ ] `POST /api/v1/auth/register` rejects `ADMIN` role with HTTP 403 `PRIVILEGE_ESCALATION_BLOCKED`.
- [ ] `POST /api/v1/knowledge/search` retrieves verified legal sections with citations.
- [ ] Next.js frontend pages load without hydration warnings or console errors.
