"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CoursePreviewResponse } from "@/types/course";

interface UseCoursePreviewResult {
  data: CoursePreviewResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useCoursePreview(courseId: string): UseCoursePreviewResult {
  const [data, setData] = useState<CoursePreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!courseId) {
      setData(null);
      setError("Invalid course id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/courses/${courseId}/preview`);
      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const message =
          errorPayload?.error ??
          `Could not load course preview (HTTP ${response.status}).`;
        throw new Error(message);
      }
      const payload = (await response.json()) as CoursePreviewResponse;
      setData(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load course preview."
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  return { data, loading, error, reload: loadPreview };
}
