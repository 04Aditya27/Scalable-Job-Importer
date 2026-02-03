"use client";

import { useEffect, useState } from "react";
import ImportHistoryTable from "@/components/ImportHistoryTable";
import { fetchImportLogs } from "@/lib/fetchImportLogs";

type ImportLog = {
  id: string;
  sourceUrl: string;
  timestamp: string;
  totalFetched: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: number;
  failedJobReasons: string[];
  status: "success" | "partial" | "failed";
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function HomePage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const data = await fetchImportLogs({ page, status });

      if (!cancelled) {
        setLogs(data.logs);
        setPagination(data.pagination);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page, status]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Import History</h1>

        <div className="mb-4">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading && (
          <div className="mb-2 text-sm text-gray-500">
            Loading import history…
          </div>
        )}

        <ImportHistoryTable logs={logs} />

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center text-sm">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
