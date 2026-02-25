# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Backend** (Express + TypeScript, runs on port 5000):
```bash
cd backend && npm run dev    # Start dev server with hot reload
cd backend && npm run build  # Compile TypeScript to dist/
```

**Frontend** (Next.js 16 + React 19, runs on port 3000):
```bash
cd frontend && npm run dev   # Start Next.js dev server
cd frontend && npm run build # Production build
cd frontend && npm run lint  # Run ESLint
```

Both servers must run simultaneously for full functionality.

## Architecture Overview

This is a monorepo with two separate apps:
- `frontend/` - Next.js web application
- `backend/` - Express API server

### Authentication Flow

Auth is handled entirely by the backend using Passport.js (Google OAuth). No auth library in frontend.

1. User clicks "Continue with Google" → browser navigates to `backend/auth/google`
2. Backend handles OAuth, creates/finds user in MongoDB, signs JWT
3. JWT stored as httpOnly cookie, browser redirected to `/api/auth/callback`
4. Frontend reads cookie via `proxy.ts` middleware for route protection

Key files:
- `backend/src/config/passport.ts` - Google OAuth strategy
- `backend/src/routes/auth.ts` - Auth endpoints
- `frontend/proxy.ts` - Next.js middleware for route protection (reads JWT directly)
- `frontend/src/components/providers/AuthProvider.tsx` - Client-side auth context

### Route Protection Logic (`proxy.ts`)

- Unauthenticated → protected routes redirect to `/auth/signin`
- Authenticated + no course created → `/dashboard` redirects to `/create-course`
- Authenticated + course created → `/create-course` redirects to `/dashboard`
- Authenticated → `/auth/signin` redirects to appropriate page

### Frontend Structure

Uses Next.js App Router with route groups:
- `src/app/(main)/` - Authenticated app pages (dashboard, create-course, explore) with shared sidebar layout
- `src/app/auth/` - Sign-in page
- `src/app/api/auth/callback/` - OAuth callback handler

Component organization:
- `components/ui/` - shadcn/ui components (new-york style)
- `components/landing/` - Marketing page sections
- `components/dashboard/` - Sidebar, empty states
- `components/onboarding/` - Chat interface components
- `components/explore/` - Course discovery components

### API Communication

All backend calls go through `src/lib/api.ts` which wraps fetch with:
- `credentials: "include"` for cookie auth
- Base URL from `NEXT_PUBLIC_BACKEND_URL`

### Styling

- Tailwind CSS v4 with CSS variables for theming
- Design theme: black background with gold accents
- Fonts: Playfair Display (headings), Lato (body)
- Framer Motion for animations
- Class `skeuo-gold` for gold gradient buttons/badges

## Environment Variables

**backend/.env**:
- `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`

**frontend/.env.local**:
- `NEXT_PUBLIC_BACKEND_URL`, `JWT_SECRET` (must match backend)
