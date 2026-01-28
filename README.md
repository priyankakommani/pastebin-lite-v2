# Pastebin-Lite v2

This version of Pastebin-Lite is migrated to use raw PostgreSQL via the `pg` client.
- **Backend**: Render (Hono + pg)
- **Database**: Aiven (PostgreSQL)
- **Frontend**: Vercel (Vite/React)

## Project Structure

```text
pastebin-lite-v2/
├── backend/          # Hono server (Node.js)
│   └── src/          # API logic & DB connection
└── frontend/         # Vite/React Application
```

## Utility & Test Commands

Run these from the `backend/` directory:

| Command | Description |
| :--- | :--- |
| `npx tsx src/test-api.ts` | **Run Functional Tests** (TTL, View Limits, Health) |
| `npx tsx src/view-pastes.ts` | **View Database Records** (Table view of all pastes) |
| `npx tsx src/list-tables.ts` | **List All Tables** in the database |

## Local Development

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env with:
# DATABASE_URL="your_aiven_postgres_url"
# PORT=3000
# TEST_MODE=1 (to enable functional test headers)
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Create .env with:
# VITE_API_URL=http://localhost:3000
npm run dev
```

## Deployment

### Render (Backend - Web Service)
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `backend`

### Vercel (Frontend)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `frontend`
- **Env Variable**: `VITE_API_URL` (points to your Render URL)
