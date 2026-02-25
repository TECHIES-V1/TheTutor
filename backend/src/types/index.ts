// ── Chat & Conversation Types ─────────────────────────────────────────────

export type ConversationPhase =
  | "onboarding"
  | "resource_retrieval"
  | "course_generation"
  | "completed";

export type OnboardingPhase =
  | "topic"
  | "level"
  | "time"
  | "goal"
  | "confirmation";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface OnboardingData {
  topic?: string;
  level?: ExperienceLevel;
  hoursPerWeek?: number;
  goal?: string;
  confirmedSubject?: string;
  suggestedSubject?: string;
}

export interface MessageMetadata {
  phase: OnboardingPhase;
  extractedData?: Partial<OnboardingData>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
  phase: ConversationPhase;
  onboardingProgress: number;
  requiresConfirmation: boolean;
}

// ── Course Types ──────────────────────────────────────────────────────────

export type CourseStatus = "generating" | "active" | "completed" | "archived";

export interface LessonResource {
  title: string;
  url: string;
  type: "article" | "video" | "book" | "exercise";
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  estimatedMinutes: number;
  videoLinks?: string[];
  resources?: LessonResource[];
  completed: boolean;
  order: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
  lessons: Lesson[];
}

export interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
  lastAccessedAt?: Date;
}

// ── MCP Types ─────────────────────────────────────────────────────────────

export type BookSource = "gutendex" | "openlibrary" | "standard-ebooks";

export interface DiscoveredBook {
  id: string;
  title: string;
  authors: string[];
  source: BookSource;
  downloadUrl?: string;
  format?: string;
  description?: string;
  subjects?: string[];
  publishYear?: number;
}

export interface ParsedChapter {
  title: string;
  content: string;
  order: number;
}

export interface ParsedContent {
  summary: string;
  chapters: ParsedChapter[];
  totalPages?: number;
  wordCount?: number;
}

export interface MCPSearchResult {
  books: DiscoveredBook[];
  totalFound: number;
  query: string;
}

export interface MCPFetchParseResult {
  success: boolean;
  title: string;
  authors: string[];
  content: ParsedContent;
  error?: string;
}

// ── SSE Event Types ───────────────────────────────────────────────────────

export interface SSEStatusEvent {
  phase: string;
  message: string;
  progress?: number;
}

export interface SSEResourcesEvent {
  type: "discovered" | "selected";
  count: number;
  books?: Array<{ title: string; authors: string[]; source: string }>;
  message: string;
}

export interface SSEParsingProgressEvent {
  current: number;
  total: number;
  book: string;
  status: "downloading" | "parsing" | "complete" | "failed";
}

export interface SSECourseChunkEvent {
  content: string;
  type: "module_header" | "lesson" | "resource" | "content";
}

export interface SSECompleteEvent {
  courseId: string;
  title: string;
  description: string;
  moduleCount: number;
  lessonCount: number;
  estimatedHours: number;
}

export type SSEErrorCode =
  | "MCP_UNAVAILABLE"
  | "AI_ERROR"
  | "PARSING_FAILED"
  | "TIMEOUT";

export interface SSEErrorEvent {
  code: SSEErrorCode;
  message: string;
  retryable: boolean;
  phase: string;
}

export interface SSEToolCallEvent {
  toolName: string;
  toolCallId: string;
  args: Record<string, unknown>;
}

export interface SSEToolResultEvent {
  toolName: string;
  toolCallId: string;
  summary: string;
}

export type SSEEvent =
  | { type: "status"; data: SSEStatusEvent }
  | { type: "resources"; data: SSEResourcesEvent }
  | { type: "parsing_progress"; data: SSEParsingProgressEvent }
  | { type: "course_chunk"; data: SSECourseChunkEvent }
  | { type: "complete"; data: SSECompleteEvent }
  | { type: "error"; data: SSEErrorEvent }
  | { type: "tool_call"; data: SSEToolCallEvent }
  | { type: "tool_result"; data: SSEToolResultEvent };

// ── Generation Context ────────────────────────────────────────────────────

export interface BookContext {
  title: string;
  authors: string[];
  relevantChapters: Array<{
    title: string;
    contentSnippet: string;
  }>;
}

export interface GenerationContext {
  onboardingData: OnboardingData;
  books: BookContext[];
  totalContentLength: number;
}

// ── API Request/Response Types ────────────────────────────────────────────

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
}

export interface ConfirmSubjectRequest {
  conversationId: string;
  confirmed: boolean;
}

export interface GenerateCourseRequest {
  conversationId: string;
}

export interface UpdateProgressRequest {
  lessonId: string;
  completed: boolean;
}

// ── Error Types ───────────────────────────────────────────────────────────

export type ErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "NO_CONVERSATION"
  | "INVALID_PHASE"
  | "AI_ERROR"
  | "MCP_UNAVAILABLE"
  | "PARSING_FAILED"
  | "TIMEOUT"
  | "DB_ERROR";

export interface APIError {
  error: string;
  code: ErrorCode;
}
