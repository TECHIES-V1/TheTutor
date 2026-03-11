<p align="center">
  <img src="media/vector/default-monochrome.svg" alt="TheTutor" width="900" />
</p>

<p align="center">
  <strong>AI-powered course generation platform that turns any topic into a structured learning experience — powered by Amazon Nova, grounded in real textbooks via MCP.</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/AI-Amazon%20Nova%20(Bedrock)-FF9900?logo=amazonaws" alt="Amazon Nova" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/frontend-Next.js%2016-black?logo=next.js" alt="Next.js" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/backend-Express%20%2B%20TypeScript-3178C6?logo=typescript" alt="Express" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/data-MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  <a href="#further-mcp"><img src="https://img.shields.io/badge/MCP-Further--MCP-8A2BE2" alt="MCP" /></a>
</p>

---

## Overview

Most AI learning tools generate shallow, generic content with no grounding in real material. **TheTutor** is different — it discovers real textbooks through a custom MCP pipeline, then uses Amazon Nova to synthesize structured courses grounded in actual published material. Every lesson includes quizzes, exercises, source citations, and curated video resources.

Our tagline: **Just Ask.**

<!--[![Watch the video](https://img.youtube.com/vi/H0lXggWL4DM/maxresdefault.jpg)](https://youtu.be/H0lXggWL4DM)

### [Watch this video on YouTube](https://youtu.be/H0lXggWL4DM) -->

### Highlights

- **Full course from a single topic** — modules, lessons, quizzes, exercises, and video resources generated end-to-end
- **Grounded in real textbooks** — a custom MCP server discovers and parses books from OpenLibrary, Gutendex, and Standard Ebooks so content is sourced, not hallucinated
- **Real-time generation** — watch your course build live via Server-Sent Events with per-lesson progress updates
- **Crash-resilient pipeline** — two-pass parallel lesson generation with automatic recovery from interrupted jobs
- **Voice read-aloud** — synchronized text highlighting as lessons are narrated via AWS Polly
- **AI lesson assistant** — ask follow-up questions in context while studying any lesson
- **AI-graded quizzes** — open-ended answers evaluated by Nova, not just multiple choice
- **Course certificates** — earn and download certificates on completion
- **Community learning** — explore, enroll in, and learn from courses published by others

---

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Course Generation Pipeline](#course-generation-pipeline)
- [Further-MCP](#further-mcp)
- [Project Structure](#project-structure)
- [API Surface](#api-surface)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)
- [Developers](#developers)
- [License](#license)

---

## How It Works

| Step | What Happens |
|:---:|---|
| **1. Sign In** | One-click Google OAuth. Secure JWT cookie auth, no passwords. |
| **2. Chat** | Tell the AI tutor what you want to learn. It asks about your level, goals, and study preferences to tailor the course to you. |
| **3. Generate** | TheTutor discovers real books via MCP, builds a structured outline, and generates every lesson — with quizzes, exercises, citations, and videos — all streamed to you in real time. |
| **4. Learn** | Study at your own pace with voice narration, text highlighting, an AI assistant for questions, and earn a certificate when you finish. |

---

## Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,js,html,css,nodejs,react,nextjs,express,tailwind,mongodb,aws,bash,md" alt="Tech stack icons" />
</p>

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, shadcn/ui |
| Backend | Express, TypeScript, Node.js, Zod validation, Pino structured logging |
| AI | Amazon Bedrock (`@ai-sdk/amazon-bedrock`) with Amazon Nova |
| MCP Integration | Further-MCP (HTTP + FastMCP) for real textbook discovery & parsing |
| Data | MongoDB + Mongoose, Upstash Redis (caching + rate limiting) |
| Auth | Google OAuth 2.0 (Passport.js) + JWT httpOnly cookie auth |
| Media | YouTube Data API, AWS Polly (text-to-speech) |

## Architecture

```mermaid
flowchart LR
    U[User] --> FE[Next.js Frontend]
    FE --> PX[proxy.ts Middleware]
    FE -->|REST + SSE| BE[Express Backend]
    BE --> DB[(MongoDB)]
    BE --> REDIS[(Upstash Redis)]
    BE -->|AI SDK| NOVA[Amazon Bedrock: Nova]
    BE -->|HTTP| MCP[Further-MCP Server]
    MCP --> SRC[OpenLibrary + Gutendex + Standard Ebooks]
    BE --> YT[YouTube Data API]
    BE --> POLLY[AWS Polly TTS]
```

### Auth Flow

```mermaid
sequenceDiagram
    participant User
    participant FE as Frontend
    participant BE as Backend
    participant Google

    User->>FE: Click "Continue with Google"
    FE->>BE: GET /auth/google
    BE->>Google: OAuth redirect
    Google-->>BE: Callback with auth code
    BE->>BE: Create/find user, sign JWT
    BE->>FE: Redirect to /api/auth/callback?token=JWT
    FE->>FE: Set frontend-domain cookie, redirect
    FE->>FE: proxy.ts reads JWT for route protection
```

## Course Generation Pipeline

The generation pipeline uses a **job-based architecture** with 4 phases, crash recovery, and real-time SSE broadcasting:

```mermaid
sequenceDiagram
    participant User
    participant FE as Frontend
    participant API as Backend
    participant MCP as Further-MCP
    participant Nova as Amazon Nova
    participant DB as MongoDB

    User->>FE: Confirm subject → Click Generate
    FE->>API: POST /course/generate
    API-->>FE: { jobId }
    FE->>API: GET /course/jobs/:jobId/events (SSE)

    Note over API: Phase 1: MCP Discovery
    API->>MCP: discover_books + fetch_and_parse
    MCP-->>API: Book contexts + source refs

    Note over API: Phase 2: Outline
    API->>Nova: Generate structured outline (retry 2×)
    Nova-->>API: CourseOutline JSON
    API-->>FE: SSE: outline_done

    Note over API: Phase 3: Parallel Lesson Gen
    loop p-limit(4) parallel + sequential fallback
        API->>Nova: Generate lesson content
        Nova-->>API: Lesson markdown + quiz + citations
        API->>DB: Atomic $set on curriculum[i].lessons[j]
        API-->>FE: SSE: lesson_done
    end

    Note over API: Phase 4: Video Enrichment
    loop p-limit(6) parallel
        API->>API: YouTube search per lesson
        API->>DB: Update videoReferences
    end
    API-->>FE: SSE: complete

    API->>DB: Finalize course, create enrollment
```

### Key Pipeline Files

| File | Purpose |
|---|---|
| `backend/src/services/course/jobRunner.ts` | 4-phase pipeline orchestrator with crash recovery |
| `backend/src/services/course/lessonGen.ts` | Single lesson content generation (markdown + quiz + exercises) |
| `backend/src/services/course/outline.ts` | Structured course outline generation |
| `backend/src/services/mcp/discovery.ts` | MCP book discovery + parsing pipeline |
| `backend/src/services/sse/broadcaster.ts` | SSE client management + broadcasting |
| `backend/src/config/ai.ts` | Nova model config per generation phase |

## Further-MCP

> TheTutor uses a **custom MCP server** built specifically for this project so Amazon Nova can discover, fetch, and parse real books before generating course content — ensuring lessons are grounded in actual published material, not hallucinated.

<p align="center">
  <a href="https://github.com/TECHIES-V1/futher-mcp"><img src="https://img.shields.io/badge/GitHub-futher--mcp-181717?style=for-the-badge&logo=github&logoColor=res" alt="Further-MCP GitHub" /></a>
  <a href="https://futher-mcp-production.up.railway.app"><img src="https://img.shields.io/badge/Railway-Live%20MCP-0B0D0E?style=for-the-badge&logo=railway&logoColor=green" alt="Railway MCP" /></a>
  <a href="https://futher-mcp-production.up.railway.app/health"><img src="https://img.shields.io/badge/Health-Endpoint-2EA44F?style=for-the-badge&logo=fastapi&logoColor=blue" alt="MCP Health Endpoint" /></a>
</p>

**Repository:** [https://github.com/TECHIES-V1/futher-mcp](https://github.com/TECHIES-V1/futher-mcp)
**Live on Railway:** [https://futher-mcp-production.up.railway.app](https://futher-mcp-production.up.railway.app)
**Health Check:** [https://futher-mcp-production.up.railway.app/health](https://futher-mcp-production.up.railway.app/health)

Further-MCP combines OpenLibrary discovery with EPUB/PDF parsing and exposes both FastAPI routes and FastMCP tools. In TheTutor, this powers book discovery and content extraction during course generation.

| Capability | What Further-MCP Provides | How TheTutor Uses It |
|---|---|---|
| Discovery | OpenLibrary + Gutendex + Standard Ebooks aggregation | Finds high-signal books for a learner's topic |
| Parsing | EPUB/PDF metadata, TOC, chapter extraction | Feeds structured source context to Nova for grounded content |
| Interfaces | FastAPI + FastMCP pack | Works for HTTP pipelines and MCP tool mode |
| Hosting | Railway deployment | Production-ready MCP endpoint for the generation flow |

### FastMCP Tools

- `discover_books(query, sources?, limit?)`
- `fetch_and_parse_book(url, limit_pages?, limit_chapters?)`
- `search_books(query, keywords?, limit?)`

## Project Structure

```text
TheTutor/
├── frontend/                         # Next.js 16 app
│   ├── src/app/                      # App Router pages
│   │   ├── (main)/                   # Authenticated app (dashboard, learn, explore, settings)
│   │   ├── auth/                     # Sign-in page
│   │   └── api/auth/                 # OAuth callback + logout handlers
│   ├── src/components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── landing/                  # Marketing page sections
│   │   ├── dashboard/                # Sidebar, empty states
│   │   ├── onboarding/              # Course creation chat UI
│   │   ├── course/                   # Lesson viewer, AI assistant, quiz
│   │   ├── explore/                  # Course discovery components
│   │   └── providers/                # AuthProvider, ThemeProvider
│   ├── src/lib/                      # api.ts, seo.ts, backendUrl.ts
│   └── proxy.ts                      # JWT-based route protection middleware
├── backend/                          # Express API
│   ├── src/routes/                   # auth, user, chat, course, courses, dashboard, tts
│   ├── src/services/
│   │   ├── ai/                       # Nova prompts, generation, grading
│   │   ├── mcp/                      # MCP client + discovery pipeline
│   │   ├── course/                   # jobRunner, lessonGen, outline, contextBuilder
│   │   ├── sse/                      # SSE broadcaster + client management
│   │   ├── youtube/                  # YouTube video enrichment
│   │   └── cache/                    # Upstash Redis chat caching
│   ├── src/middleware/               # auth, sse, rateLimiter, validate, requestLogger
│   ├── src/models/                   # Mongoose schemas (User, Course, Enrollment, etc.)
│   ├── src/config/                   # database, passport, ai, logger, publicUrls
│   └── src/utils/                    # errors, auth helpers
├── docs/                             # Architecture, API reference, deployment guide
└── README.md
```

## API Surface

### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/auth/google` | No | Start Google OAuth flow |
| GET | `/auth/google/callback` | No | OAuth callback, issues JWT |
| GET | `/auth/me` | Yes | Current user payload |
| POST | `/auth/logout` | Yes | Clear auth cookie |

### Chat (Onboarding)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/chat/message` | Yes | Send onboarding chat message |
| POST | `/chat/confirm-subject` | Yes | Confirm/reject suggested subject |
| GET | `/chat/conversations` | Yes | List user conversations |
| GET | `/chat/conversation` | Yes | Get active conversation |
| GET | `/chat/conversation/:id` | Yes | Get conversation by ID |
| POST | `/chat/restart` | Yes | Restart onboarding |

### Course Generation
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/course/generate` | Yes | Start job-based generation |
| GET | `/course/jobs/:jobId` | Yes | Poll job status (JSON) |
| GET | `/course/jobs/:jobId/events` | Yes | Real-time SSE progress stream |
| GET | `/course/generation-status/:id` | Yes | Legacy generation status |

### Courses
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/courses/explore` | Optional | Browse published courses |
| GET | `/courses/:id/preview` | Optional | Course preview with outline |
| POST | `/courses/:id/enroll` | Yes | Enroll in a course |
| GET | `/courses/:id/lessons/:lessonId` | Yes | Get lesson content |
| POST | `/courses/:id/lessons/:lessonId/assistant` | Yes | AI lesson assistant (streaming) |
| POST | `/courses/:id/lessons/:lessonId/quiz-attempts` | Yes | Submit + AI-grade quiz answers |
| POST | `/courses/:id/complete` | Yes | Complete course, earn certificate |
| PATCH | `/courses/:id/publish` | Yes | Toggle course visibility |

### Dashboard & User
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/overview` | Yes | Dashboard stats + course cards |
| GET | `/user/profile` | Yes | Full user profile |
| PATCH | `/user/preferences` | Yes | Update theme preference |
| POST | `/tts/synthesize` | Yes | Text-to-speech via AWS Polly |

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB (local or Atlas)
- Google OAuth app credentials
- AWS credentials with Bedrock access to Amazon Nova

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Create `backend/.env` and `frontend/.env.local` — see [Environment Variables](#environment-variables) below.

### 3. Run both servers

```bash
# Terminal 1
cd backend && npm run dev     # http://localhost:5000

# Terminal 2
cd frontend && npm run dev    # http://localhost:3000
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret (must match frontend) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `FRONTEND_URL` | Yes | CORS + post-auth redirect (e.g. `http://localhost:3000`) |
| `AWS_ACCESS_KEY_ID` | Yes | AWS credential for Bedrock |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS credential for Bedrock |
| `AWS_REGION` | Yes | Bedrock region (e.g. `us-east-1`) |
| `AI_MODEL` | No | Nova model ID (default: `amazon.nova-pro-v1:0`) |
| `YT_API_KEY` | Optional | YouTube video enrichment |
| `MCP_BASE_URL` | No | Further-MCP HTTP endpoint |
| `PORT` | No | Express port (default: `5000`) |
| `LESSON_CONCURRENCY` | No | Parallel lesson gen workers (default: `4`) |
| `VIDEO_CONCURRENCY` | No | Parallel video fetch workers (default: `6`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Browser-facing backend URL |
| `JWT_SECRET` | Yes | JWT verification in `proxy.ts` (must match backend) |

## Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:

- [Architecture](docs/architecture.md) — System design, auth flow, theme system, deployment topology
- [Course Generation](docs/course-generation.md) — Pipeline phases, MCP integration, crash recovery
- [API Reference](docs/api-reference.md) — Complete route documentation with request/response schemas
- [Deployment Guide](docs/deployment.md) — Environment setup, Vercel/Railway config, production checklist
- [Wiki Pages](https://github.com/TECHIES-V1/TheTutor/wiki) — Official wiki link

## Developers

| Name | Role  | GitHub |
|---|---|---|
| **Tobiloba Sulaimon** | Full-Stack Lead & CTO  | [tobilobacodes00](https://github.com/tobilobacodes00) |
| **Robert Dominic** | Frontend Developer  | [robert-dominic](https://github.com/robert-dominic) |
| **Joanna Bassey** | Frontend Developer & SEO  | [DevBytes-J](https://github.com/DevBytes-J) |
| **Daniel Fadehan** | Backend Engineer  | [fadexadex](https://github.com/fadexadex) |
| **Collins Joel** | MCP & Prompt Engineer | [Contractor-x](https://github.com/Contractor-x) |

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
