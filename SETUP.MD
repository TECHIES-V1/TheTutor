# TheTutor Setup Guide

This file explains setup in 3 levels:

1. **Experienced**
2. **Average**
3. **Absolute Beginner**

---

## 1. Experienced

### Prerequisites

- Node.js `18+`
- npm
- MongoDB connection string
- Google OAuth credentials
- AWS credentials (Bedrock/Nova access)

### Steps (Line-by-Line)

```bash
# 1) Clone and enter project
git clone https://github.com/TECHIES-V1/TheTutor.git
cd TheTutor

# 2) Install backend deps
cd backend
npm install

# 3) Create backend env
cat > .env << 'ENV'
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=<your_mongodb_uri>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
JWT_SECRET=<your_shared_jwt_secret>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your_aws_access_key_id>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>
AI_MODEL=us.amazon.nova-pro-v1:0
MCP_BASE_URL=https://futher-mcp-production.up.railway.app
MCP_SSE_URL=http://0.0.0.0:8002/mcp/sse
YOUTUBE_API_KEY=<optional>
ENV

# 4) Start backend
npm run dev
```

Open a new terminal:

```bash
# 5) Install frontend deps
cd TheTutor/frontend
npm install

# 6) Create frontend env
cat > .env.local << 'ENV'
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
JWT_SECRET=<same_as_backend_jwt_secret>
ENV

# 7) Start frontend
npm run dev
```

### Verify

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/health`

---

## 2. Average User

### What you are setting up

You will run **two apps**:

- `backend` (Express API) on port `5000`
- `frontend` (Next.js UI) on port `3000`

### Step A: Get the code

```bash
git clone https://github.com/TECHIES-V1/TheTutor.git
cd TheTutor
```

### Step B: Setup backend

```bash
cd backend
npm install
```

Create `backend/.env` and paste:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=<your_mongodb_uri>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
JWT_SECRET=<your_shared_jwt_secret>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your_aws_access_key_id>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>
AI_MODEL=us.amazon.nova-pro-v1:0
MCP_BASE_URL=https://futher-mcp-production.up.railway.app
MCP_SSE_URL=http://0.0.0.0:8002/mcp/sse
YOUTUBE_API_KEY=<optional>
```

Run backend:

```bash
npm run dev
```

### Step C: Setup frontend

Open another terminal:

```bash
cd TheTutor/frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
JWT_SECRET=<same_as_backend_jwt_secret>
```

Run frontend:

```bash
npm run dev
```

### Step D: Confirm it works

1. Visit `http://localhost:5000/health` and confirm you get `{ "status": "ok" }`.
2. Visit `http://localhost:3000`.
3. Click sign in and verify the app routes correctly.

### Optional: Use local MCP instead of Railway

If you run your own MCP server, set in `backend/.env`:

```env
MCP_BASE_URL=http://localhost:8002
MCP_SSE_URL=http://0.0.0.0:8002/mcp/sse
```

---

## 3. Absolute Beginner

If this is your first time running a full-stack project, follow this exactly.

### Step 1: Install required tools

Install these first:

- **Node.js LTS (18 or newer)**: https://nodejs.org
- **Git**: https://git-scm.com/downloads
- A code editor (VS Code recommended): https://code.visualstudio.com

### Step 2: Open your terminal and download the project

```bash
git clone https://github.com/TECHIES-V1/TheTutor.git
cd TheTutor
```

If `git` is not recognized it signifies Git is not installed correctly yet.

### Step 3: Prepare backend (server)

```bash
cd backend
npm install
```

Wait until install completes.

Now create a file named `.env` inside the `backend` folder.

Add this (replace values inside `<...>`):

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=<your_mongodb_uri>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
JWT_SECRET=<your_shared_jwt_secret>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your_aws_access_key_id>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>
AI_MODEL=us.amazon.nova-pro-v1:0
MCP_BASE_URL=https://futher-mcp-production.up.railway.app
MCP_SSE_URL=http://0.0.0.0:8002/mcp/sse
YOUTUBE_API_KEY=<optional>
```

Start backend:

```bash
npm run dev
```

Keep this terminal open.

### Step 4: Prepare frontend (website)

Open a **new** terminal window/tab and run:

```bash
cd TheTutor/frontend
npm install
```

Create a file named `.env.local` inside the `frontend` folder.

Add:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
JWT_SECRET=<same_as_backend_jwt_secret>
```

Start frontend:

```bash
npm run dev
```

Keep this terminal open too.

### Step 5: Test the app

- Open browser to: `http://localhost:3000`
- Open backend health check: `http://localhost:5000/health`

If both pages open, setup is complete.

### Step 6: If something fails

- `npm: command not found` -> reinstall Node.js.
- `EADDRINUSE` -> that port is busy; stop old process or change port.
- `MongoDB connection failed` -> your `MONGODB_URI` is wrong or database not reachable.
- Google sign-in fails -> check `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and callback URL config.
- AI generation fails -> verify AWS credentials and Bedrock model access.

---

## Notes

- Backend and frontend must run **at the same time** in separate terminals.
- `JWT_SECRET` must match between backend `.env` and frontend `.env.local`.
- This project uses Amazon Nova and Further-MCP (Railway hosted by default).
