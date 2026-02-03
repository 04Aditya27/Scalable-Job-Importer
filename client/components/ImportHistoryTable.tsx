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

export default function ImportHistoryTable({ logs }: { logs: ImportLog[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">No import runs yet</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-sm text-gray-700">
          <tr>
            <Th>Run Time</Th>
            <Th>Source URL</Th>
            <Th>Total</Th>
            <Th>New</Th>
            <Th>Updated</Th>
            <Th>Failed</Th>
            <Th>Status</Th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50 text-sm">
              <Td>{new Date(log.timestamp).toLocaleString()}</Td>

              <Td truncate title={log.sourceUrl}>
                {log.sourceUrl}
              </Td>

              <Td center>{log.totalFetched}</Td>
              <Td center>{log.newJobs}</Td>
              <Td center>{log.updatedJobs}</Td>
              <Td center>{log.failedJobs}</Td>

              <Td center>
                <StatusBadge status={log.status} />

                {log.failedJobReasons.length > 0 && (
                  <button
                    className="ml-2 text-xs text-blue-600 underline"
                    onClick={() =>
                      alert(
                        "Failure reasons:\n\n" +
                          Array.from(new Set(log.failedJobReasons)).join("\n"),
                      )
                    }
                  >
                    View reason
                  </button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="p-3 border border-gray-200 font-semibold text-left">
      {children}
    </th>
  );
}

function Td({
  children,
  center,
  truncate,
  title,
}: {
  children: React.ReactNode;
  center?: boolean;
  truncate?: boolean;
  title?: string;
}) {
  return (
    <td
      title={title}
      className={`p-3 border border-gray-200 ${
        center ? "text-center" : "text-left"
      } ${truncate ? "max-w-xs truncate" : ""}`}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: ImportLog["status"] }) {
  const map = {
    success: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${map[status]}`}
    >
      {status}
    </span>
  );
}
