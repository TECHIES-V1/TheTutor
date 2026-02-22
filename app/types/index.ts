/**
 * Shared TypeScript types for the application.
 */

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
