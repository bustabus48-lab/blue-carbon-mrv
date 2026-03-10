# Blue Carbon MRV

An integrated platform for Blue Carbon Monitoring, Reporting, and Verification (MRV).

## Architecture

- **Frontend**: Next.js (React) + TailwindCSS — deployed on [Vercel](https://vercel.com)
- **Backend & Database**: [Supabase](https://supabase.com) (PostgreSQL + PostGIS, Auth, Storage, Edge Functions)

## Quick Start

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → API** copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 2. Apply database migrations

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link to your remote project (get the project ref from the dashboard URL)
supabase link --project-ref <your-project-ref>

# Push all migrations to your Supabase project
supabase db push
```

### 3. Configure the frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local and fill in your Supabase credentials
```

### 4. Run locally

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Deployment (Vercel)

1. Import the repository in Vercel and set **Root Directory** to `frontend`.
2. Add the following environment variables in **Vercel → Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy.

## CI/CD (GitHub Actions)

Two workflows run automatically:

| Workflow | Trigger | Jobs |
|---|---|---|
| **CI** (`ci.yml`) | Pull request → `main` | Frontend lint + type-check + build; Backend syntax check |
| **Deploy** (`deploy.yml`) | Push to `main` / manual | Supabase migrations → Vercel production deploy |

### Required GitHub Secrets

Configure these in **Repository → Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token (for the CLI) |
| `SUPABASE_DB_PASSWORD` | Supabase database password |
| `SUPABASE_PROJECT_ID` | Supabase project reference ID (from the dashboard URL) |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

## Documents

The original project requirements and blueprints are located in the `docs/` directory.
