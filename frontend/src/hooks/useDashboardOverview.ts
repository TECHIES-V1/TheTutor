"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DashboardOverview } from "@/types/course";

interface UseDashboardOverviewResult {
  overview: DashboardOverview | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDashboardOverview(isAuthLoading: boolean): UseDashboardOverviewResult {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/dashboard/overview");
      if (!response.ok) {
        setError("Could not load dashboard data.");
        return;
      }
      const data = (await response.json()) as DashboardOverview;
      setOverview(data);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
      loadOverview();
    }
  }, [isAuthLoading, loadOverview]);

  return { overview, loading, error, reload: loadOverview };
}

