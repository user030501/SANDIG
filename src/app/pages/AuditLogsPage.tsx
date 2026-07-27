import type { AuditLog } from "../data/mockData";
import { useApi } from "../lib/useApi";

export function AuditLogsPage() {
  const { data, loading, error } = useApi<AuditLog[]>("/dashboard/audit-logs");
  const logs = data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">System activity and action history for the Administrator account</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
          <option value="">All Users</option>
          <option>Maria Santos</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
          <option value="">All Modules</option>
          <option>PWD Profiles</option>
          <option>Welfare Assessment</option>
          <option>Referrals</option>
          <option>At-Risk Cases</option>
          <option>Reports</option>
          <option>Account Settings</option>
        </select>
        <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Module</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{log.user}</td>
                  <td className="px-4 py-3 text-gray-700">{log.action}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.dateTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          {loading ? "Loading…" : error ? error : `Showing ${logs.length} recent entries`}
        </div>
      </div>
    </div>
  );
}
