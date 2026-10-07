"use client";

export interface ScanLog {
  id: string;
  scannedAt: string;
  totalFound: number;
  totalMatched: number;
  newAdded: number;
  status: string;
  message: string | null;
}

export interface ScanLogsTabProps {
  scanLogs: ScanLog[];
  isDark: boolean;
}

export function ScanLogsTab({ scanLogs, isDark }: ScanLogsTabProps) {
  const logsList = Array.isArray(scanLogs) ? scanLogs : [];

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl p-6 border transition ${
          isDark
            ? "bg-slate-900/80 border-slate-800"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <h2
          className={`text-[23px] font-bold mb-4 ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Daily 12:00 PM Scanner Logs
        </h2>
        <div className="space-y-3">
          {logsList.length === 0 ? (
            <p className="text-[17px] text-slate-500">
              No scan executions logged yet.
            </p>
          ) : (
            logsList.map((log) => (
              <div
                key={log.id}
                className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                  isDark
                    ? "bg-slate-950 border-slate-800"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <p
                    className={`text-[17px] font-bold ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    📅 Scan Execution:{" "}
                    {new Date(log.scannedAt).toLocaleString("sv-SE")}
                  </p>
                  <p
                    className={`text-[16px] mt-0.5 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {log.message}
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-[16px]">
                  <span
                    className={`px-3 py-0.5 rounded font-semibold border ${
                      isDark
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {log.totalMatched} Matched
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded font-semibold border ${
                      isDark
                        ? "bg-slate-800 text-slate-300 border-slate-700"
                        : "bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                  >
                    {log.totalFound} Scanned
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
