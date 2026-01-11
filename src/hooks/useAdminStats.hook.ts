import { useQuery } from "@tanstack/react-query";

interface TopUser {
  user_id: number;
  count: number;
}

interface GrowthDataPoint {
  month: string;
  count: number;
}

export interface AdminStats {
  overview: {
    totalUsers: number;
    totalCrates: number;
    totalReleases: number;
  };
  recentActivity: {
    last7Days: {
      newUsers: number;
      newCrates: number;
      newReleases: number;
    };
    last30Days: {
      newUsers: number;
      newCrates: number;
      newReleases: number;
    };
  };
  topUsers: {
    byCrates: TopUser[];
    byReleases: TopUser[];
  };
  growth: {
    users: GrowthDataPoint[];
    crates: GrowthDataPoint[];
    releases: GrowthDataPoint[];
  };
}

async function fetchAdminStats(): Promise<AdminStats> {
  const response = await fetch("/api/admin/stats", {
    credentials: "include",
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Forbidden: Admin access required");
    }
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in");
    }
    throw new Error(`Failed to fetch admin stats: ${response.statusText}`);
  }

  return response.json();
}

export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ["adminStats"],
    queryFn: fetchAdminStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });
};
