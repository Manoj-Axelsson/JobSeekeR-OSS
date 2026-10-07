"use client";

import type { Application } from "@/types/domain";

export interface ApplicationsTrackerTabProps {
  applications: Application[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  months: string[];
  onOpenAktivitetsrapport: () => void;
  onUpdateAppStatus: (appId: string, status: Application["status"]) => Promise<void> | void;
  onUndoApplication: (jobId: string) => Promise<void> | void;
  isDark: boolean;
}

/**
 * Pure helper function to filter applications by calendar month tag.
 * Returns all applications if selectedMonth is empty.
 */
export function filterApplicationsByMonth(
  applications: Application[],
  selectedMonth: string
): Application[] {
  if (!selectedMonth) return applications;
  return applications.filter((app) => app.monthlyTag === selectedMonth);
}

/**
 * Returns Tailwind text color classes based on application workflow status.
 */
export function getStatusTextColor(status: Application["status"]): string {
  switch (status) {
    case "APPLIED":
      return "text-cyan-600 font-bold";
    case "INTERVIEWING":
      return "text-purple-600 font-bold";
    case "OFFER":
      return "text-emerald-600 font-bold";
    case "REJECTED":
      return "text-red-600 font-bold";
    default:
      return "text-slate-600 font-semibold";
  }
}

export function ApplicationsTrackerTab({
  applications,
  selectedMonth,
  onSelectMonth,
  months,
  onOpenAktivitetsrapport,
  onUpdateAppStatus,
  onUndoApplication,
  isDark,
}: ApplicationsTrackerTabProps) {
  return (
    <div className="space-y-6">
      {/* Month Tabs Header & Aktivitetsrapport Export */}
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-2xl border gap-4 transition ${
          isDark
            ? "bg-slate-900/60 border-slate-800"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div>
          <h2
            className={`text-[23px] font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Monthly Job Application Log &amp; Arbetsförmedlingen Compliance
          </h2>
          <p
            className={`text-[17px] mt-0.5 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Track jobs applied each month and generate your official Swedish{" "}
            <strong>Aktivitetsrapport</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[17px] font-medium ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Select Month:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className={`border rounded-xl px-4 py-2.5 text-[17px] focus:outline-none focus:border-emerald-600 ${
                isDark
                  ? "bg-slate-950 border-slate-800 text-slate-200"
                  : "bg-slate-50 border-slate-300 text-slate-900"
              }`}
            >
              {months.length === 0 ? (
                <option value="">No Month Logs Yet</option>
              ) : (
                months.map((m) => (
                  <option key={m} value={m}>
                    📅 {m}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* AKTIVITETSRAPPORT EXPORT BUTTON */}
          <button
            onClick={onOpenAktivitetsrapport}
            className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[16px] font-bold rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/20 flex items-center space-x-2"
          >
            <span>📄 Export Swedish Aktivitetsrapport (PDF / Print)</span>
          </button>
        </div>
      </div>

      {/* Applications Table */}
      {applications.length === 0 ? (
        <div
          className={`text-center py-16 rounded-2xl border ${
            isDark
              ? "bg-slate-900/40 border-slate-800"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <p
            className={`text-[22px] font-semibold ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            No applications logged for {selectedMonth || "this month"}
          </p>
          <p
            className={`text-[17px] mt-1 ${
              isDark ? "text-slate-500" : "text-slate-500"
            }`}
          >
            Mark jobs as &quot;Applied&quot; from the Daily Feed tab to start
            tracking your applications.
          </p>
        </div>
      ) : (
        <div
          className={`overflow-x-auto rounded-2xl border shadow-sm transition ${
            isDark
              ? "bg-slate-900/80 border-slate-800"
              : "bg-white border-slate-200"
          }`}
        >
          <table className="w-full text-left text-[17px]">
            <thead
              className={`uppercase tracking-wider border-b ${
                isDark
                  ? "bg-slate-950 text-slate-400 border-slate-800"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <tr>
                <th className="py-4 px-5 font-bold text-[18px]">
                  Job Title &amp; Company
                </th>
                <th className="py-4 px-5 font-bold text-[18px]">Location</th>
                <th className="py-4 px-5 font-bold text-[18px]">
                  Date Applied
                </th>
                <th className="py-4 px-5 font-bold text-[18px]">Status</th>
                <th className="py-4 px-5 font-bold text-[18px]">
                  Resume / CV Version
                </th>
                <th className="py-4 px-5 font-bold text-right text-[18px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? "divide-slate-800/60" : "divide-slate-200"
              }`}
            >
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className={
                    isDark
                      ? "hover:bg-slate-800/40 transition"
                      : "hover:bg-slate-50 transition"
                  }
                >
                  <td className="py-4 px-5">
                    <p
                      className={`font-bold text-[19px] ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {app.job?.title || "Job Title"}
                    </p>
                    <p
                      className={`text-[16px] ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {app.job?.company || "Company"}
                    </p>
                  </td>
                  <td
                    className={`py-4 px-5 text-[17px] ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {app.job?.location || "Sweden"}
                  </td>
                  <td
                    className={`py-4 px-5 text-[17px] ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    {new Date(app.appliedAt).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="py-4 px-5">
                    <select
                      value={app.status}
                      onChange={(e) =>
                        onUpdateAppStatus(
                          app.id,
                          e.target.value as Application["status"]
                        )
                      }
                      className={`text-[16px] font-semibold px-3 py-2 rounded-lg border focus:outline-none ${
                        isDark
                          ? "bg-slate-950 border-slate-800"
                          : "bg-slate-50 border-slate-300"
                      } ${getStatusTextColor(app.status)}`}
                    >
                      <option value="APPLIED">Applied</option>
                      <option value="INTERVIEWING">Interviewing</option>
                      <option value="OFFER">Offer Received 🎉</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </td>
                  <td
                    className={`py-4 px-5 text-[16px] ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {app.resumeVersion}
                  </td>
                  <td className="py-4 px-5 text-right flex items-center justify-end space-x-3">
                    {app.job?.webpageUrl && (
                      <a
                        href={app.job.webpageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[16px] text-amber-400 hover:text-white font-semibold underline"
                      >
                        Ad Link ↗
                      </a>
                    )}
                    <button
                      onClick={() => onUndoApplication(app.jobId)}
                      className="px-3 py-1.5 bg-amber-800/80 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                      title="Undo accidental application status and remove from tracker"
                    >
                      ↩️ Undo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
