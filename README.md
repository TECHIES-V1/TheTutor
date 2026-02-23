# TheTutor — AI-Powered Learning Platform

An AI-powered learning platform where users sign in with Google, create personalised courses through a chat interface, and track their progress from a dashboard.

---

## Project Structure

The project is split into two separate apps inside one repository:

```
TheTutor/
├── frontend/          ← Next.js web app (what users see)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (main)/
│   │   │   │   ├── create-course/     ← Chat interface to create a course
│   │   │   │   └── dashboard/         ← User dashboard
│   │   │   ├── api/auth/callback/     ← Handles redirect after Google login
│   │   │   ├── auth/signin/           ← Sign-in page
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               ← Landing page
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── dashboard/             ← Sidebar, empty course state
│   │   │   ├── landing/               ← Navbar, Hero, Features, CTA, etc.
│   │   │   ├── onboarding/            ← Chat input, chat messages
│   │   │   ├── providers/             ← Auth context (AuthProvider)
│   │   │   └── ui/                    ← Shared UI (button, input, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts                 ← Fetch wrapper for backend calls
│   │   │   └── utils.ts
│   │   ├── types/index.ts             ← TypeScript interfaces
│   │   └── utils/dummyTutorResponses.ts
│   ├── proxy.ts                       ← Route protection (reads JWT cookie)
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── .env.local                     ← Frontend environment variables
│
├── backend/           ← Express API (auth, user data)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts            ← MongoDB connection
│   │   │   └── passport.ts            ← Google OAuth setup
│   │   ├── middleware/
│   │   │   └── auth.ts                ← JWT verification middleware
│   │   ├── models/
│   │   │   └── User.ts                ← User schema (MongoDB)
│   │   ├── routes/
│   │   │   ├── auth.ts                ← /auth/* endpoints
│   │   │   └── user.ts                ← /user/* endpoints
│   │   └── index.ts                   ← Express app entry point
│   ├── tsconfig.json
│   └── .env                           ← Backend environment variables
│
├── .gitignore
└── README.md
```

---

## What We've Built So Far

### Landing Page
A full marketing landing page with sections for the hero, features, how it works, and a call-to-action. The design uses a black and gold luxury theme throughout.

### Authentication (Google Sign-In)
Users sign in with their Google account. The entire auth flow runs through the Express backend — there is no third-party auth library in the frontend. Here's how it works:

1. User clicks **Continue with Google** on the sign-in page
2. Browser navigates to the backend at `localhost:5000/auth/google`
3. Backend handles the Google OAuth flow using Passport.js
4. On success, the backend creates (or finds) the user in MongoDB, signs a JWT, and sets it as a secure httpOnly cookie
5. Backend redirects the browser back to the frontend at `/api/auth/callback`
6. The frontend callback route reads the cookie, checks if the user has created a course yet, and sends them to the right page

Accounts are created automatically on first sign-in — no separate registration step.

### Course Creation (`/create-course`)
After signing in, new users land here. It's a chat interface where the AI tutor asks questions to build a personalised course. Once the conversation is complete, the course is marked as created and the user is sent to their dashboard.

Users can return to this page from the dashboard at any time to create additional courses.

### Dashboard (`/dashboard`)
The main app page after a user has created their first course. Includes:
- A sidebar with navigation and a **New Course** button
- A welcome greeting with the user's name
- Stats row (streak, courses enrolled, hours learned)
- A courses section — currently shows an empty state with a prompt to create a course

### Route Protection
The `proxy.ts` file acts as a gatekeeper for every page:
- Signed-out users trying to access `/dashboard` or `/create-course` are redirected to the sign-in page
- Signed-in users who haven't created a course yet can't access `/dashboard` — they go to `/create-course` first
- Signed-in users who have already created a course skip `/create-course` and go straight to `/dashboard`
- Signed-in users who visit the sign-in page are sent back to the app

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB database (local or Atlas)
- A Google OAuth app (Client ID and Secret from Google Cloud Console)

### 1. Set up environment variables

**`backend/.env`**
```
PORT=5000
MONGODB_URI=<your MongoDB connection string>
GOOGLE_CLIENT_ID=<your Google Client ID>
GOOGLE_CLIENT_SECRET=<your Google Client Secret>
JWT_SECRET=<a long random secret string>
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
JWT_SECRET=<same secret as backend JWT_SECRET>
```



### 4. Start the backend

```bash
cd backend
npm run dev
```

Runs on `http://localhost:5000`

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

Runs on `http://localhost:3000`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, 
| Animations | Framer Motion |
| Backend | Express, TypeScript |
| Auth | Passport.js (Google OAuth 2.0) |
| Database | MongoDB (Mongoose) |
| Sessions | JWT in httpOnly cookies |
| Icons | Lucide React |
| Fonts | Playfair Display, Lato |
