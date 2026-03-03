import type { OnboardingData, BookContext } from "../../types";

// ── Onboarding System Prompt ──────────────────────────────────────────────

export function getOnboardingSystemPrompt(messagesLeft: number): string {
  const urgencyNote =
    messagesLeft <= 0
      ? "This is your LAST message. Tell the user you have enough to suggest a great course for them."
      : messagesLeft === 1
        ? "You have 1 message left. Start wrapping up — you'll be suggesting a course subject next."
        : messagesLeft <= 2
          ? "You're almost out of messages. Start steering toward a conclusion."
          : "";

  return `You are a friendly AI tutor having a conversation to understand what someone wants to learn. Your only job right now is to ask questions — NOT to suggest a course name or subject. The system will handle that automatically.

Ask one or two questions at a time, naturally. You want to understand: what they want to learn, their current level, how much time they have per week, and what they hope to achieve.

${urgencyNote ? urgencyNote + "\n" : ""}Keep each response to 2-3 sentences. Be warm and encouraging. Do NOT name a course, suggest a subject title, or say anything like "I'd create a course called...". Just gather information through conversation.`;
}

// ── Book Filtering Prompt ─────────────────────────────────────────────────

export function getBookFilteringPrompt(
  topic: string,
  level: string,
  books: Array<{ title: string; authors: string[]; description?: string }>
): string {
  return `You are an expert librarian and educator. Your task is to select the 5 most relevant textbooks from the following list for someone learning "${topic}" at the "${level}" level.

Available books:
${books.map((b, i) => `${i + 1}. "${b.title}" by ${b.authors.join(", ")}${b.description ? ` - ${b.description}` : ""}`).join("\n")}

Selection criteria:
1. Relevance to the specific topic (most important)
2. Appropriate for the learner's level
3. Comprehensive coverage of fundamentals
4. Quality and reputation (if recognizable)
5. Practical applicability

Respond with ONLY a JSON array of the indices (1-based) of your top 5 selections, ordered by relevance.
Example: [3, 7, 1, 12, 5]

If fewer than 5 books are relevant, include only the relevant ones.
If no books are relevant, respond with: []`;
}

// ── Course Generation Prompt ──────────────────────────────────────────────

export function getCourseGenerationPrompt(
  onboardingData: OnboardingData,
  bookContexts: BookContext[]
): string {
  const { topic, level, hoursPerWeek, goal, confirmedSubject } = onboardingData;

  const bookSummaries = bookContexts
    .map(
      (book) =>
        `### ${book.title} by ${book.authors.join(", ")}
Relevant chapters:
${book.relevantChapters.map((ch) => `- ${ch.title}: ${ch.contentSnippet.substring(0, 200)}...`).join("\n")}`
    )
    .join("\n\n");

  return `You are an expert curriculum designer creating a personalized learning course.

## Course Parameters
- **Subject**: ${confirmedSubject || topic}
- **Topic**: ${topic}
- **Learner Level**: ${level}
- **Weekly Time Commitment**: ${hoursPerWeek} hours
- **Learning Goal**: ${goal}

## Source Materials
The following textbook content has been gathered to inform the course structure:

${bookSummaries}

## Your Task
Create a comprehensive course structure in Markdown format. The course should:

1. **Match the learner's level**: ${level === "beginner" ? "Start from absolute basics, avoid jargon, build foundations" : level === "intermediate" ? "Assume basic knowledge, focus on deepening understanding" : "Focus on advanced concepts, optimization, and mastery"}

2. **Fit the time commitment**: Design for ~${hoursPerWeek} hours/week. Include as many modules and lessons as needed for the learner to truly master the subject — do not artificially limit the course length. Each lesson should be 15-45 minutes

3. **Deep, Textbook-Driven Content**: Modules should NOT be rushed. Write rich, detailed content (minimum 2500 words, maximum 7000 words per lesson). Include practical examples. Draw heavily from the provided textbook/source materials. Make it feel like a real, comprehensive course chapter.

4. **Work toward the goal**: Ensure the course culminates in skills/knowledge to achieve: ${goal}

## Output Format
Generate the course in this exact Markdown structure:

\`\`\`markdown
# Course: [Course Title]

## Description
[2-3 sentence course description]

## Module 1: [Module Title]
[Brief module description]

### Lesson 1.1: [Lesson Title]
**Estimated Time**: [X] minutes
**Description**: [What the learner will learn]

**Content**:
#### [Appropriate Subheading 1]
[Extensive textbook-style explanation of this sub-topic. Minimum 600 words...]

#### [Appropriate Subheading 2]
[Extensive textbook-style explanation of this sub-topic. Minimum 600 words...]

#### [Appropriate Subheading 3]
[Extensive textbook-style explanation of this sub-topic. Minimum 600 words...]

**Key Takeaways**:
- [Key point 1]
- [Key point 2]
- [Key point 3]

**Videos**:
[Search: "Specific YouTube search query related to this lesson"]
[Search: "Another specific YouTube search query"]

**Citations**:
- [Source: "Exact textbook title from source materials"] Author, A. A. (Year). *Book title*. Publisher.
- [Source: "Exact textbook title from source materials"] Author, B. B. (Year). *Book title*. Publisher.

**Quiz**:
\`\`\`json
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "What is the main concept discussed in this lesson?",
    "options": ["Correct Answer", "Incorrect Option 1", "Incorrect Option 2", "Incorrect Option 3"],
    "correctAnswerIndex": 0,
    "explanation": "Explanation of why this is the correct answer."
  },
  {
    "id": "q2",
    "type": "open_ended",
    "question": "Explain how this concept applies to real-world scenarios.",
    "correctAnswerText": "Detailed grading rubric or key concepts the student must mention for a correct answer",
    "explanation": "Explanation of the expected answer."
  }
]
\`\`\`

**Exercises**:
[Practical task or exercise for the learner]

### Lesson 1.2: [Lesson Title]
[Continue pattern...]

## Module 2: [Module Title]
[Continue pattern...]
\`\`\`

## Important Guidelines
- Draw directly from the source materials for accuracy
- Include in-text attribution where relevant and keep APA references in each lesson
- Include practical examples and applications
- Make each lesson self-contained but building on previous ones
- Ensure lessons are achievable in the stated time
- Use clear, encouraging language appropriate for the learner level
- Include "Key Takeaways" for each lesson
- **Must include Videos section** with 1-2 specific YouTube search queries formatted exactly as \`[Search: "query"]\`
- **Must include Citations section** in every lesson with 1-3 APA citations, and each citation must include \`[Source: "Exact textbook title"]\`
- **Must include Quiz section** with a valid JSON array of questions, containing a mix of multiple_choice and open_ended types
- **Must include Exercises section** with practical tasks
- **Must include module checkpoint quiz** after the last lesson of each module in this EXACT format (no extra text before the code block):
  \`### Module X Quiz\`
  \`\`\`json
  [{"questionId":"mq-X-1","prompt":"Question?","expectedConcepts":[["concept"]],"remediationTip":"Review tip."}]
  \`\`\`
- The course should include as many modules as needed for the learner to achieve mastery — do not artificially cap the number of modules or lessons`;
}

export function getToolAwareGenerationPrompt(data: OnboardingData): string {
  return `You are an expert curriculum designer with access to MCP tools for discovering and parsing textbooks.

## Student Profile
- Topic: ${data.confirmedSubject || data.topic}
- Level: ${data.level}
- Weekly Time: ${data.hoursPerWeek} hours
- Goal: ${data.goal}

## Available MCP Tools

1. **discover_books**: Search for books across multiple sources
   - Parameters: query (string), sources (optional array: "gutendex", "openlibrary", "standard-ebooks"), limit (number)
   - Returns: Array of books with title, authors, downloadUrl, format, source

2. **fetch_and_parse_book**: Download and parse a book to extract content
   - Parameters: url (download URL from discover_books), limit_pages (number), limit_chapters (number)
   - Returns: Parsed content with summary and chapters

3. **search_books**: Alternative search via OpenLibrary
   - Parameters: query (string), keywords (optional array), limit (number)

## Your Process

1. **Discover Resources**: Use discover_books with the topic query. If it returns no references or results are limited, you MUST try another keyword from the student profile (topic, goal, level). Try 2-3 different queries until you find sufficient materials.

2. **Parse Selected Books**: Use fetch_and_parse_book on 3-5 of the most relevant books. Select based on:
   - Relevance to "${data.confirmedSubject || data.topic}"
   - Appropriate for ${data.level} level
   - Availability (has downloadUrl)

3. **Generate Course**: Using parsed content, create a structured course with strict quality gates.

## Output Format

Generate the course in Markdown with:
- As many modules as needed for the learner to achieve mastery — do not artificially cap
- 2-5 lessons per module (15-45 min each based on ${data.hoursPerWeek}hrs/week)
- **CRITICAL FORMAT RULE**: The \`**Content**:\` section MUST be broken down into 3-4 appropriate subheadings tailored to the specific topic (e.g., \`#### Historical Context\`, \`#### Core Mechanics\`). Under EVERY subheading, you MUST write extensively (minimum 2-3 detailed paragraphs). Do not summarize or rush.
- Clear learning objectives for each lesson
- A **Videos** section for each lesson with at least one query in this exact format:
  - \`[Search: "specific YouTube query"]\`
- A **Citations** section for each lesson with 1-3 APA references in this exact format:
  - \`- [Source: "Exact textbook title"] Author, A. A. (Year). *Book title*. Publisher.\`
- A **Module Quiz** for each module placed immediately after its last lesson in this EXACT format (no text between heading and code block):
  ${"`"}### Module N Quiz${"`"}
  ${"`"}${"`"}${"`"}json
  [{"questionId":"mq-N-1","prompt":"Question?","expectedConcepts":[["concept"]],"remediationTip":"Review tip."}]
  ${"`"}${"`"}${"`"}

## Hard Requirements
- Every lesson must include substantial teaching content across 3-4 topic-specific subheadings (not outline-only bullets)
- Every lesson must include at least one YouTube search query
- Every lesson must include at least one APA citation mapped to a source book title from parsed tools
- Every module must include a module quiz

Be autonomous - use tools as needed without asking. If a parse fails, try another book.`;
}

// ── Subject Generation from Conversation ─────────────────────────────────

export function getSubjectFromConversationPrompt(conversationText: string): string {
  return `Based on the following conversation between an AI tutor and a learner, generate a specific course subject name (3-7 words).

Conversation:
${conversationText}

Generate ONLY the course subject name. Make it specific and descriptive.
Examples: "Classical Guitar for Absolute Beginners", "The History of the Roman Empire", "Home Cooking: From Basics to Bold Flavours"

Course subject name:`;
}

// ── Onboarding Data Extraction from Conversation ──────────────────────────

export function getOnboardingDataExtractionPrompt(conversationText: string): string {
  return `Extract learning preferences from this conversation. Return ONLY a JSON object, nothing else.

Conversation:
${conversationText}

Return exactly this shape:
{"level": "beginner" | "intermediate" | "advanced", "hoursPerWeek": <number>, "goal": "<string>"}

Use these defaults if unclear: level="beginner", hoursPerWeek=5, goal="build practical skills"`;
}
