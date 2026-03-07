"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/PageLoader";

export default function CreateCourseEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/create-course/new");
  }, [router]);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <PageLoader
        title="Opening course builder..."
        subtitle="Preparing your conversation workspace."
      />
    </div>
  );
}
