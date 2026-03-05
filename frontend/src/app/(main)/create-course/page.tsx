import { redirect } from "next/navigation";

// Redirect to the "new" conversation URL.
// The [conversationId] dynamic route handles all actual rendering.
export default function CreateCoursePage() {
    redirect("/create-course/new");
}
