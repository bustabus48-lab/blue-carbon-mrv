# GAB CLIMATE SMART — MASTER AI BLUEPRINT
**CRITICAL INSTRUCTION:** You are a senior Next.js and Supabase developer working for GAB Climate Smart Investment Ltd. You MUST read this entire file before executing any task, planning any sprint, or writing any code.

---

## 1. PROJECT CONTEXT & STACK
- **Organisation:** GAB Climate Smart Investment Ltd — Ghanaian agribusiness (farm, agribusiness, consultancy, land divisions)
- **Projects:** GAB OS (company dashboard), GAB Farms ERP (farm operations), Blue Carbon MRV, GAB Ramsar Map
- **Core Stack:** Next.js (App Router), Supabase Pro (PostgreSQL + PostGIS), Vercel (hosting + AI SDK), Mapbox GL JS, Tailwind CSS, shadcn/ui
- **Goal:** Tier 3 scientific data accuracy, secure cloud deployment, and strict Human-in-the-Loop (HITL) data entry

---

## 2. DYNAMIC ARCHITECTURE CHECK (AVOID AMNESIA)
- Do NOT assume you know what is already built.
- Before proposing new UI components or routes, run `ls -la app/` and `ls -la components/` to check the existing structure.
- Never duplicate existing modules (e.g., Soil Lab, Map Views, Farm Agent).

---

## 3. ENVIRONMENT BOOTSTRAP — READ THIS BEFORE WRITING ANY CODE

### Step 1 — Pull all app secrets from Vercel (single source of truth)
All project secrets live in Vercel Environment Variables. Run from inside the project directory:
```bash
vercel env pull .env.local
```
Requires Vercel CLI auth (see Section 4). Never hardcode keys. Never ask the user for keys.

### Step 2 — Verify keys are present
After pulling `.env.local`, confirm these are set before writing any data code:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
```
For GAB OS only, also check:
```
ERP_SUPABASE_URL
ERP_SUPABASE_SERVICE_ROLE_KEY
```

---

## 4. CLI AUTHENTICATION — EXACT LOCATIONS

### Vercel CLI
- **Binary:** globally installed at `~/.nvm/versions/node/v24.13.0/bin/vercel` (v50.28.0)
- **Local auth:** token stored at `~/Library/Application Support/com.vercel.cli/auth.json`
- **Cloud/CI auth:** set env var `VERCEL_TOKEN`
- **Team ID:** `team_lo3ulbRrV03KJe87XF043ftU`
- **Account:** `bustabus48-7182` (bustabus48-lab)
- **Check:** `vercel whoami`
- **Env sync:** `vercel env pull .env.local` (run inside project directory)

### Supabase CLI
- **Binary:** NOT globally installed — always use `npx supabase` (v2.78.1)
- **Local auth:** token stored in macOS Keychain as service `"Supabase CLI"` (base64-encoded `go-keyring-base64:...`)
  - Retrieve: `security find-generic-password -s "Supabase CLI" -w | sed 's/go-keyring-base64://' | base64 -d`
- **Cloud/CI auth:** set env var `SUPABASE_ACCESS_TOKEN`
- **Check:** `npx supabase projects list`
- **DB push:** `npx supabase db push` — works with `SUPABASE_ACCESS_TOKEN` alone, NO database password needed
- **Link project:** `npx supabase link --project-ref <REF_ID>`

### GitHub CLI
- **Binary:** installed at `~/bin/gh` (v2.88.0) — `~/bin` must be in PATH
- **PATH fix:** `export PATH="$HOME/bin:$PATH"` (already added to `~/.zshrc`)
- **Local auth:** token stored in macOS Keychain as `gh:github.com` (base64-encoded `go-keyring-base64:...`)
  - Retrieve: `security find-internet-password -s github.com -w | sed 's/go-keyring-base64://' | base64 -d`
- **Cloud/CI auth:** set env var `GH_TOKEN`
- **Account:** `bustabus48-lab`
- **Org:** `GAB-Climate-Smart`
- **Check:** `gh auth status`

---

## 5. PROJECT REGISTRY — ALL SUPABASE & VERCEL IDs

| Project | Supabase Ref | Vercel Project ID | Vercel URL | GitHub Repo |
|---|---|---|---|---|
| GAB OS | `wodaprxocrpuyspbdcoj` | `prj_7duoMp2yRrEpCGoOjnpwrZeAcMY3` | gab-os.vercel.app | GAB-Climate-Smart/gab-os |
| Farm ERP (web) | `hyopniuqpiostogtacly` | `prj_vH7wYD6qUh5Y3rZAfd8rERPka6e3` | gab-farms-erp-web.vercel.app | GAB-Climate-Smart/gab-farms-erp |
| Blue Carbon MRV | `eavqytqxeaswfbytguxs` | `prj_D1dy10r3f6wPaZCBmCaG6noAuR0Z` | blue-carbon-mrv-green.vercel.app | GAB-Climate-Smart/blue-carbon-mrv |
| GAB Ramsar Map | `wmgbqjmsizixhjosbflg` | `prj_vEhKNQ1shC13FUd5exdputc96VBZ` | gab-ramsar-map.vercel.app | GAB-Climate-Smart/gab-ramsar-map |
| GAB Website | `xnwfyjhcdgjblkuxncpg` | — | — | — |

**Supabase Org ID:** `iiyyvaspzrcqrqpkxarm`
**Vercel Team ID:** `team_lo3ulbRrV03KJe87XF043ftU`

**Farm ERP local path:** `~/Desktop/Prism_Project_Biodiversity_Plan 2/gab-farms-erp` (monorepo — Next.js app lives in `apps/web/`)
**Farm ERP env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
**Farm ERP Vercel link:** run `vercel link --project gab-farms-erp-web` from the repo root, then `vercel env pull .env.local`

---

## 6. TWO-DATABASE ARCHITECTURE (GAB OS ONLY)
GAB OS reads farm data FROM the ERP — never write farm data to GAB OS:

| | GAB OS | Farm ERP |
|---|---|---|
| **Purpose** | Company OS: finance, alerts, projects, consultancy | Source of truth for ALL farm data |
| **Supabase Ref** | `wodaprxocrpuyspbdcoj` | `hyopniuqpiostogtacly` |
| **Client** | `createClient()` from `@/lib/supabase` | `erpAdminClient()` from `@/lib/erpClient` |
| **Env var** | `NEXT_PUBLIC_SUPABASE_URL` | `ERP_SUPABASE_URL` |
| **Owns** | transactions, alerts, buyers, projects | blocks, produce_lots, tasks, inputs, block_metrics |

---

## 7. CI/CD — GITHUB ACTIONS PATTERN (BLUE CARBON MRV REFERENCE)
This is the correct, working pattern for all projects using GitHub Actions:
```yaml
- name: Deploy database migrations
  run: supabase db push          # SUPABASE_ACCESS_TOKEN alone is sufficient — no DB password
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

- name: Deploy to Vercel
  working-directory: ${{ github.workspace }}
  run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }} --yes
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```
**Do NOT use `amondnet/vercel-action`** — it has a broken path resolution bug.
**Do NOT set `SUPABASE_DB_PASSWORD`** — the access token handles auth.

---

## 8. CLI WORKFLOW
```bash
# Database migrations
npx supabase db push                          # push migrations to linked project
npx supabase gen types typescript --project-id <REF> > types/database.ts

# Local dev
vercel dev                                    # pulls env vars automatically

# Env sync
vercel env pull .env.local                   # always run this first in any project

# Deploy
git push origin main                          # Vercel auto-deploys on push to main
```

---

## 9. SECRETS POLICY (STRICT)
- **NEVER** hardcode API keys, tokens, or passwords in code
- **NEVER** commit `.env.local` to git (already in `.gitignore`)
- **NEVER** ask the user for keys — pull from Vercel or read `process.env`
- All app secrets flow: Vercel Dashboard → `vercel env pull` → `.env.local` → `process.env`
- All CI secrets flow: GitHub repo Settings → Secrets → workflow `${{ secrets.NAME }}`

---

## 10. END OF SHIFT PROTOCOL (CI/CD)
You are not finished until the code is in the cloud:
```bash
git status
git add .
git commit -m "feat/fix: [brief description]"
git push origin main
```
Vercel auto-deploys on push to `main`. Confirm at vercel.com/dashboard.
