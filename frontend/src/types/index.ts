/**
 * Shared TypeScript types for the application.
 */

/**
 * Authenticated user returned from the backend JWT payload / /auth/me endpoint.
 */
export interface User {
  userId: string;
  email: string;
  name: string;
  image: string;
  onboardingCompleted: boolean;
}

/**
 * Represents a single chat message between the user and the tutor.
 */
export interface Message {
    id: string;
    role: "user" | "tutor";
    content: string;
}

/**
 * Props for the Message component.
 */
export interface MessageProps {
    id: string;
    role: "user" | "tutor";
    content: string;
}

/**
 * Props for the ChatInput component.
 */
export interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}
