export interface OnboardingData {
  confirmedSubject: string;
  level: string;
  hoursPerWeek: number;
  goal: string;
}

export interface SSEToolCallEvent {
  toolName: string;
  args: Record<string, unknown>;
}

export interface SSEToolResultEvent {
  toolName: string;
  summary: string;
  success: boolean;
}

export type SSEEvent =
  | { type: "status"; data: { phase: string; message: string; progress: number } }
  | { type: "course_chunk"; data: { content: string; type: string } }
  | { type: "complete"; data: { courseId: string; title: string; moduleCount: number } }
  | { type: "tool_call"; data: SSEToolCallEvent }
  | { type: "tool_result"; data: SSEToolResultEvent };
