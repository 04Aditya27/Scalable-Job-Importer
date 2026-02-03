type ImportLogApi = {
  _id: string;
  sourceUrl: string;
  startedAt: string;
  totalFetched: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: {
    externalId?: string;
    reason:
      | "FEED_TIMEOUT"
      | "FEED_FETCH_FAILED"
      | "XML_PARSE_ERROR"
      | "NO_JOBS_FOUND";
  }[];
};

export async function fetchImportLogs({
  page = 1,
  limit = 10,
  status,
}: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status) params.append("status", status);

    const res = await fetch(`/api/import-logs?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { logs: [], pagination: null };
    }

    const data = await res.json();
    const rawLogs: ImportLogApi[] = Array.isArray(data.logs) ? data.logs : [];

    const normalizedLogs = rawLogs.map((log) => {
      const successCount = (log.newJobs || 0) + (log.updatedJobs || 0);

      const failedReasons = Array.isArray(log.failedJobs)
        ? log.failedJobs.map((f) => f.reason)
        : [];

      let status: "success" | "partial" | "failed";

      if (successCount === 0) {
        status = "failed";
      } else if (failedReasons.length > 0) {
        status = "partial";
      } else {
        status = "success";
      }

      return {
        id: log._id,
        sourceUrl: log.sourceUrl,
        timestamp: log.startedAt,
        totalFetched: log.totalFetched,
        newJobs: log.newJobs,
        updatedJobs: log.updatedJobs,
        failedJobs: failedReasons.length,
        failedJobReasons: failedReasons,
        status,
      };
    });

    return {
      logs: normalizedLogs,
      pagination: data.pagination ?? null,
    };
  } catch (error) {
    console.error("fetchImportLogs error:", error);
    return { logs: [], pagination: null };
  }
}
