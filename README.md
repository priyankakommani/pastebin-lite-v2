# Pastebin-Lite v2

This version of Pastebin-Lite is designed for a decoupled deployment:
- **Backend**: Render (Standalone Node.js/Hono)
- **Database**: Aiven (PostgreSQL)
- **Frontend**: Vercel (Vite/React)

## Project Structure

```text
pastebin-lite-v2/
├── backend/          # Hono server + Prisma
└── frontend/         # Vite/React SPA
```

## Setup Instructions

### 1. Database (Aiven)
1. Log in to [Aiven](https://aiven.io/).
2. Create a new **PostgreSQL** service.
3. Copy the **Connection URI**.
4. Important: Ensure the URI ends with `?sslmode=require`.

### 2. Backend (Render)
1. Create a new **Web Service** on Render.
2. Connect your repository (or upload the `backend` folder).
3. Set the **Root Directory** to `backend`.
4. Set the **Build Command** to `npm install && npm run build && npx prisma generate`.
5. Set the **Start Command** to `npm start`.
6. Add Environment Variable:
   - `DATABASE_URL`: Your Aiven PostgreSQL Connection URI.

### 3. Frontend (Vercel)
1. Create a new project on Vercel.
2. Connect your repository.
3. Set the **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `VITE_API_URL`: The URL of your Render backend (e.g., `https://pastebin-backend.onrender.com`).
5. Deploy.

## Local Development

1. **Backend**:
   ```bash
   cd backend
   npm install
   # Create .env with your DATABASE_URL
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   # Create .env with VITE_API_URL=http://localhost:3000
   npm run dev
   ```
