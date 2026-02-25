import { OnboardingData, SSEEvent } from "../../types";
import { streamCourseWithMCPTools } from "../ai/nova";
import { Course } from "../../models/Course";
import mongoose, { Types } from "mongoose";

// This is a placeholder, you'll need your actual parseCourseContent function
function parseCourseContent(content: string) {
  // Simple mock implementation
  return {
    modules: [{ title: "Module 1", lessons: [{ title: "Lesson 1", content: content.substring(0, 100) }] }]
  };
}

export async function* generate(
  conversationId: string, 
  userId: string,
  onboardingData: OnboardingData
): AsyncGenerator<SSEEvent> {
  // Create course document
  const course = new Course({ 
    userId, 
    conversationId, 
    title: onboardingData.confirmedSubject, 
    status: "generating" 
  });
  await course.save();

  yield { 
    type: "status", 
    data: { 
      phase: "course_generation", 
      message: "AI is searching for resources...", 
      progress: 10 
    } 
  };

  // Stream with tools - AI drives the process
  const resourceIds: string[] = [];
  let courseContent = "";

  for await (const event of streamCourseWithMCPTools(onboardingData, course._id.toString(), userId)) {
    // Collect resource IDs from tool results (if we track parsed books)
    if (event.type === "tool_result" && event.data.toolName === "fetch_and_parse_book") {
      // In a real implementation, you'd likely get the resourceId from the tool result
      // For now, we mock it or extract it if available
      // resourceIds.push(event.data.resourceId);
    }
    if (event.type === "course_chunk") {
      courseContent += event.data.content;
    }
    yield event;
  }

  // Finalize: parse content into modules, save course
  const parsed = parseCourseContent(courseContent);
  course.modules = parsed.modules;
  course.resources = resourceIds.map(id => new Types.ObjectId(id));
  course.status = "active";
  await course.save();

  yield { 
    type: "complete", 
    data: { 
      courseId: course._id.toString(), 
      title: course.title, 
      moduleCount: parsed.modules.length 
    } 
  };
}
