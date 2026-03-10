# API Reference

All endpoints are served from the Express backend (default port 5000). Protected routes require a valid JWT cookie.

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/google` | No | Initiates Google OAuth flow |
| GET | `/auth/google/callback` | No | Google OAuth callback, sets JWT cookie and redirects |
| GET | `/auth/me` | Yes | Returns current authenticated user |
| POST | `/auth/logout` | Yes | Clears backend auth cookie |

## User

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/user/profile` | Yes | Get user profile |
| PATCH | `/user/preferences` | Yes | Update user preferences |
| PUT | `/user/complete-onboarding` | Yes | Mark onboarding as completed |

## Chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat/message` | Yes | Send a message in the onboarding chat |
| POST | `/chat/confirm-subject` | Yes | Confirm course subject to trigger generation |
| GET | `/chat/conversations` | Yes | List all conversations for the user |
| GET | `/chat/conversation` | Yes | Get the current active conversation |
| GET | `/chat/conversation/:id` | Yes | Get a specific conversation by ID |
| POST | `/chat/restart` | Yes | Start a new conversation |

## Course (Generation)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/course/generate` | Yes | Start course generation |
| GET | `/course/jobs/:jobId` | Yes | Get generation job status |
| GET | `/course/jobs/:jobId/events` | Yes | SSE stream of generation progress |
| GET | `/course/generation-status/:conversationId` | Yes | Get generation status by conversation |
| GET | `/course` | Yes | List user's generated courses |
| GET | `/course/:id` | Yes | Get a specific course |
| PUT | `/course/:id/progress` | Yes | Update course progress |

## Courses (Enrolled/Explore)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/courses/bootstrap` | Yes | Bootstrap initial course data |
| GET | `/courses/explore` | Yes | Browse available courses |
| GET | `/courses/:courseId/preview` | Yes | Preview a course before enrolling |
| POST | `/courses/:courseId/enroll` | Yes | Enroll in a course |
| GET | `/courses/:courseId/lessons/:lessonId` | Yes | Get lesson content |
| POST | `/courses/:courseId/lessons/:lessonId/assistant` | Yes | Streaming AI lesson assistant |
| POST | `/courses/:courseId/lessons/:lessonId/quiz-attempts` | Yes | Submit a lesson quiz attempt |
| POST | `/courses/:courseId/complete` | Yes | Mark course as completed |
| GET | `/courses/:courseId/certificate` | Yes | Get completion certificate data |
| GET | `/courses/:courseId/certificate/download` | Yes | Download certificate as PDF |
| PATCH | `/courses/:courseId/publish` | Yes | Publish/unpublish a course |
| GET | `/courses/mine/list` | Yes | List courses created by the user |
| GET | `/courses/:courseId/modules/:moduleId/quiz` | Yes | Get module quiz |
| POST | `/courses/:courseId/modules/:moduleId/quiz-attempts` | Yes | Submit a module quiz attempt |

## Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/overview` | Yes | Get dashboard summary (enrolled courses, progress, stats) |

## TTS

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/tts/synthesize` | Yes | Synthesize text to speech audio |

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check endpoint |

## Common Patterns

### Authentication

All protected endpoints expect a valid JWT in an httpOnly cookie named `token`. Unauthenticated requests receive a `401` response.

### Streaming Responses

Two endpoints use streaming:

- **`GET /course/jobs/:jobId/events`** — Server-Sent Events for generation progress. Events include `phase`, `progress`, `lessonComplete`, `error`, and `complete`.
- **`POST /courses/:courseId/lessons/:lessonId/assistant`** — Streams AI assistant responses chunk by chunk via `text/event-stream`.

### Error Format

```json
{
  "error": "Human-readable error message"
}
```

Standard HTTP status codes are used: `400` (bad request), `401` (unauthorized), `404` (not found), `500` (server error).
