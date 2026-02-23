import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CourseEmptyState() {
  return (
    <div className="neo-surface flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 px-8 py-16 text-center">
      {/* Icon */}
      <div className="neo-inset mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
        <BookOpen className="h-8 w-8 text-primary/60" />
      </div>

      {/* Text */}
      <h3 className="font-playfair text-xl font-bold text-foreground">No courses yet</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
        Create your first AI-generated course and start learning at your own pace.
      </p>

      {/* CTA */}
      <Button
        asChild
        size="lg"
        className="skeuo-gold mt-8 rounded-full px-8 hover:!opacity-100 gap-2"
      >
        <Link href="/create-course">
          <Plus className="h-5 w-5" />
          Create Your First Course
        </Link>
      </Button>
    </div>
  );
}
