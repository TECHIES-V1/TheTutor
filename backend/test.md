# TheTutor Backend API Testing Guide

This document provides detailed instructions for testing all backend endpoints.

## Prerequisites

1. **Start MongoDB** (if not using a cloud instance)
2. **Configure Environment Variables** in `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/thetutor
   JWT_SECRET=your-jwt-secret
   FRONTEND_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # AWS Bedrock (for AI features)
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1

   # MCP Server
   MCP_BASE_URL=https://futher-mcp-production.up.railway.app

   # AI Config
   AI_MODEL=us.amazon.nova-pro-v1:0
   ```

3. **Start the backend**:
   ```bash
   cd backend && npm run dev
   ```

---

## Authentication Setup

All endpoints (except `/health`) require authentication via JWT cookie.

### Option 1: Manual Testing with Browser Auth

1. Start both frontend and backend
2. Navigate to `http://localhost:3000`
3. Click "Continue with Google" to authenticate
4. Open browser DevTools → Application → Cookies
5. Copy the `token` cookie value

### Option 2: Create Test Token (Development Only)

You can create a test JWT token for API testing:

```javascript
// Run in Node.js or add to a test script
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    userId: '507f1f77bcf86cd799439011', // Replace with actual MongoDB user ID
    email: 'test@example.com',
    name: 'Test User',
    image: '',
    onboardingCompleted: false
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Token:', token);
```

---

## Testing with cURL

### Health Check (No Auth Required)

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{"status":"ok"}
```

---

## Chat Endpoints

### POST /chat/message - Send a Message

**Start a new conversation:**
```bash
curl -X POST http://localhost:5000/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"message": "I want to learn Python programming"}'
```

**Continue existing conversation:**
```bash
curl -X POST http://localhost:5000/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "message": "I am a complete beginner",
    "conversationId": "CONVERSATION_ID_FROM_PREVIOUS_RESPONSE"
  }'
```

**Expected Response (200 OK):**
```json
{
  "conversationId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "message": {
    "id": "uuid-string",
    "role": "assistant",
    "content": "That's great! Python is an excellent choice...",
    "timestamp": "2026-02-24T10:30:00.000Z",
    "metadata": {
      "phase": "level",
      "extractedData": {
        "topic": "Python programming"
      }
    }
  },
  "phase": "onboarding",
  "onboardingProgress": 2,
  "requiresConfirmation": false
}
```

**Error Response (401 Unauthorized):**
```json
{"error":"Unauthorized"}
```

---

### GET /chat/conversation - Get Active Conversation

```bash
curl http://localhost:5000/chat/conversation \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "conversation": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "messages": [...],
    "phase": "onboarding",
    "onboardingData": {
      "topic": "Python programming",
      "level": "beginner"
    },
    "status": "active",
    "createdAt": "2026-02-24T10:00:00.000Z",
    "updatedAt": "2026-02-24T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{"error":"No active conversation","code":"NO_CONVERSATION"}
```

---

### GET /chat/conversation/:id - Get Specific Conversation

```bash
curl http://localhost:5000/chat/conversation/65a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

---

### POST /chat/confirm-subject - Confirm or Reject Subject

**Confirm the subject:**
```bash
curl -X POST http://localhost:5000/chat/confirm-subject \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "conversationId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "confirmed": true
  }'
```

**Expected Response (200 OK) - Confirmed:**
```json
{
  "success": true,
  "conversationId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "phase": "resource_retrieval",
  "subject": "Introduction to Python Programming",
  "message": "Subject confirmed. Ready for course generation."
}
```

**Reject and restart:**
```bash
curl -X POST http://localhost:5000/chat/confirm-subject \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "conversationId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "confirmed": false
  }'
```

---

### POST /chat/restart - Restart Conversation

```bash
curl -X POST http://localhost:5000/chat/restart \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{}'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "newConversationId": "65b2c3d4e5f6g7h8i9j0k1l2",
  "message": "Conversation restarted"
}
```

---

## Course Endpoints

### POST /course/generate - Generate Course (SSE Stream)

This endpoint returns a Server-Sent Events stream. Use a tool that supports SSE or test with curl:

```bash
curl -X POST http://localhost:5000/course/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -H "Accept: text/event-stream" \
  -d '{"conversationId": "65a1b2c3d4e5f6g7h8i9j0k1"}'
```

**Example SSE Output:**
```
event: status
data: {"phase":"resource_retrieval","message":"Searching for textbooks about \"Python programming\"...","progress":10}

event: resources
data: {"type":"discovered","count":18,"message":"Found 18 potential textbooks"}

event: status
data: {"phase":"filtering","message":"Selecting the most relevant textbooks...","progress":25}

event: resources
data: {"type":"selected","count":5,"books":[{"title":"Think Python","authors":["Allen B. Downey"],"source":"gutendex"}],"message":"Selected 5 textbooks for parsing"}

event: parsing_progress
data: {"current":1,"total":5,"book":"Think Python","status":"downloading"}

event: parsing_progress
data: {"current":1,"total":5,"book":"Think Python","status":"complete"}

event: status
data: {"phase":"course_generation","message":"Generating course content with AI...","progress":80}

event: course_chunk
data: {"content":"# Course: Introduction to Python Programming\n\n","type":"content"}

event: course_chunk
data: {"content":"## Description\nThis course will take you from absolute beginner...","type":"content"}

event: complete
data: {"courseId":"65c3d4e5f6g7h8i9j0k1l2m3","title":"Introduction to Python Programming","description":"...","moduleCount":4,"lessonCount":16,"estimatedHours":12}
```

---

### GET /course/generation-status/:conversationId

```bash
curl http://localhost:5000/course/generation-status/65a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "conversationId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "status": "completed",
  "courseId": "65c3d4e5f6g7h8i9j0k1l2m3"
}
```

---

### GET /course - List All Courses

```bash
# List all courses
curl "http://localhost:5000/course" \
  -H "Cookie: token=YOUR_JWT_TOKEN"

# Filter by status
curl "http://localhost:5000/course?status=active" \
  -H "Cookie: token=YOUR_JWT_TOKEN"

# With pagination
curl "http://localhost:5000/course?limit=10&offset=0" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "courses": [
    {
      "id": "65c3d4e5f6g7h8i9j0k1l2m3",
      "title": "Introduction to Python Programming",
      "description": "...",
      "subject": "Python Programming",
      "level": "beginner",
      "status": "active",
      "progress": {
        "completedLessons": 3,
        "totalLessons": 16,
        "percentComplete": 19
      },
      "estimatedHours": 12,
      "moduleCount": 4,
      "createdAt": "2026-02-24T12:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### GET /course/:id - Get Course Details

```bash
curl http://localhost:5000/course/65c3d4e5f6g7h8i9j0k1l2m3 \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "course": {
    "id": "65c3d4e5f6g7h8i9j0k1l2m3",
    "title": "Introduction to Python Programming",
    "description": "...",
    "subject": "Python Programming",
    "level": "beginner",
    "status": "active",
    "estimatedHours": 12,
    "modules": [
      {
        "id": "uuid",
        "title": "Getting Started with Python",
        "description": "...",
        "order": 0,
        "completed": false,
        "lessons": [
          {
            "id": "uuid",
            "title": "Installing Python",
            "description": "...",
            "estimatedMinutes": 15,
            "content": "# Installing Python\n\n...",
            "completed": false
          }
        ]
      }
    ],
    "progress": {...},
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### PUT /course/:id/progress - Update Lesson Progress

```bash
curl -X PUT http://localhost:5000/course/65c3d4e5f6g7h8i9j0k1l2m3/progress \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "lessonId": "lesson-uuid-here",
    "completed": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "progress": {
    "completedLessons": 4,
    "totalLessons": 16,
    "percentComplete": 25
  },
  "moduleCompleted": false,
  "courseCompleted": false
}
```

---

## Testing Full Onboarding Flow

Here's a complete sequence to test the entire flow:

### Step 1: Start Conversation
```bash
curl -X POST http://localhost:5000/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT" \
  -d '{"message": "I want to learn machine learning"}'
```

### Step 2: Answer Level Question
```bash
curl -X POST http://localhost:5000/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT" \
  -d '{"message": "I have some Python experience but new to ML", "conversationId": "CONV_ID"}'
```

### Step 3: Answer Time Question
```bash
curl -X POST http://localhost:5000/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT" \
  -d '{"message": "About 5 hours per week", "conversationId": "CONV_ID"}'
```

### Step 4: Answer Goal Question
```bash
curl -X POST http://localhost:5000/chat/message \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT" \
  -d '{"message": "I want to build predictive models for my work", "conversationId": "CONV_ID"}'
```

### Step 5: Confirm Subject
```bash
curl -X POST http://localhost:5000/chat/confirm-subject \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT" \
  -d '{"conversationId": "CONV_ID", "confirmed": true}'
```

### Step 6: Generate Course
```bash
curl -X POST http://localhost:5000/course/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT" \
  -H "Accept: text/event-stream" \
  -d '{"conversationId": "CONV_ID"}'
```

### Step 7: View Generated Course
```bash
curl http://localhost:5000/course/COURSE_ID \
  -H "Cookie: token=YOUR_JWT"
```

---

## Testing with JavaScript (Browser Console)

```javascript
// Helper function for authenticated requests
async function apiCall(method, path, body = null) {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`http://localhost:5000${path}`, options);
  return response.json();
}

// Test chat
const result = await apiCall('POST', '/chat/message', {
  message: 'I want to learn Python'
});
console.log(result);
```

---

## Testing SSE with EventSource (Browser)

```javascript
// Must be on same origin or have CORS configured
const eventSource = new EventSource(
  'http://localhost:5000/course/generate',
  { withCredentials: true }
);

eventSource.addEventListener('status', (e) => {
  console.log('Status:', JSON.parse(e.data));
});

eventSource.addEventListener('course_chunk', (e) => {
  console.log('Chunk:', JSON.parse(e.data));
});

eventSource.addEventListener('complete', (e) => {
  console.log('Complete:', JSON.parse(e.data));
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  console.error('Error:', JSON.parse(e.data));
  eventSource.close();
});
```

**Note:** EventSource only supports GET requests. For POST with SSE, use fetch:

```javascript
async function streamCourse(conversationId) {
  const response = await fetch('http://localhost:5000/course/generate', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    let currentEvent = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ') && currentEvent) {
        const data = JSON.parse(line.slice(6));
        console.log(`[${currentEvent}]`, data);
      }
    }
  }
}

// Usage
streamCourse('your-conversation-id');
```

---

## MCP Server Health Check

Verify the MCP server is accessible:

```bash
curl https://futher-mcp-production.up.railway.app/health
```

Test book discovery:

```bash
curl "https://futher-mcp-production.up.railway.app/discovery/search?query=python&limit=5"
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | No valid JWT token |
| `FORBIDDEN` | 403 | Not authorized for resource |
| `NOT_FOUND` | 404 | Resource not found |
| `NO_CONVERSATION` | 404 | No active conversation |
| `INVALID_PHASE` | 400 | Wrong conversation phase |
| `AI_ERROR` | 500 | AI model failure |
| `MCP_UNAVAILABLE` | 503 | MCP server unreachable |
| `PARSING_FAILED` | 500 | Book parsing failed |
| `TIMEOUT` | 504 | Operation timeout |
| `DB_ERROR` | 500 | Database error |

---

## Troubleshooting

### "Unauthorized" Error
- Ensure JWT token is valid and not expired
- Check that cookie is being sent (credentials: 'include')

### "No active conversation" Error
- User may not have started onboarding
- Previous conversation may have been completed

### AI Errors
- Verify AWS credentials are configured
- Check AWS Bedrock service is available in your region
- Ensure you have access to the Nova model

### MCP Unavailable
- Check MCP server health endpoint
- Verify MCP_BASE_URL is correct
- Server may be temporarily down

### SSE Not Working
- Ensure Accept header includes text/event-stream
- Check for proxy/nginx buffering issues
- Verify CORS is configured correctly
