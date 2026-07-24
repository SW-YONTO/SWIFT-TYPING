import React from 'react';
import { Activity, Check, Copy } from 'lucide-react';

export default function TelemetryLogStream({
  theme,
  telemetryLogs,
  copiedDeviceId,
  handleCopyDeviceId
}) {
  const subTextClass = theme.textSecondary || 'text-gray-400';

  return (
    <div className={`${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl p-6 space-y-4 transition-all duration-300`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className={`w-5 h-5 ${theme.accent}`} /> Telemetry Log Stream ({telemetryLogs.length})
        </h3>
        <span className={`text-xs ${subTextClass}`}>Scrollable table • Max 500 recent events</span>
      </div>
      <div className={`overflow-x-auto overflow-y-auto max-h-96 border ${theme.border} rounded-xl`}>
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className={`sticky top-0 z-10 ${theme.secondary} ${subTextClass} uppercase font-semibold border-b ${theme.border}`}>
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Device ID</th>
              <th className="p-3">Client</th>
              <th className="p-3">OS</th>
              <th className="p-3">Version</th>
              <th className="p-3">Event Type</th>
              <th className="p-3">Event Data</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.border} font-mono`}>
            {telemetryLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className={`p-4 text-center italic ${subTextClass}`}>Local telemetry mode active. Log stream will populate as pings arrive.</td>
              </tr>
            ) : (
              telemetryLogs.map(log => (
                <tr key={log.id} className="hover:opacity-80 transition-opacity">
                  <td className={`p-3 whitespace-nowrap ${subTextClass}`}>{new Date(log.created_at).toLocaleTimeString()}</td>
                  <td className="p-3 font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{log.device_id ? log.device_id.substring(0, 12) + '...' : 'Unknown'}</span>
                      {log.device_id && (
                        <button
                          onClick={() => handleCopyDeviceId(log.device_id)}
                          title="Copy full device_id & fill ban input"
                          className="p-1 hover:bg-slate-500/20 rounded transition cursor-pointer text-slate-400 hover:text-white"
                        >
                          {copiedDeviceId === log.device_id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className={`p-3 uppercase font-bold ${theme.accent}`}>{log.client_type}</td>
                  <td className={`p-3 ${subTextClass}`}>{log.os_platform}</td>
                  <td className={`p-3 ${subTextClass}`}>{log.app_version}</td>
                  <td className="p-3 font-semibold text-emerald-500">{log.event_type}</td>
                  <td className="p-3">
                    {log.event_data ? (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        {log.event_data.username && (
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
                            👤 {log.event_data.username}
                          </span>
                        )}
                        {log.event_data.tests_completed !== undefined && (
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                            🏆 {log.event_data.tests_completed} tests
                          </span>
                        )}
                        {log.event_data.max_wpm !== undefined && (
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                            ⚡ Max: {log.event_data.max_wpm} WPM
                          </span>
                        )}
                        {log.event_data.avg_wpm !== undefined && (
                          <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                            📈 Avg: {log.event_data.avg_wpm} WPM
                          </span>
                        )}
                        {log.event_data.avg_accuracy !== undefined && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                            🎯 Acc: {log.event_data.avg_accuracy}%
                          </span>
                        )}
                        {log.event_data.total_time_seconds !== undefined && (
                          <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg">
                            ⏱️ {Math.round(log.event_data.total_time_seconds / 60)} mins
                          </span>
                        )}
                        {!log.event_data.username && !log.event_data.tests_completed && (
                          <span className="text-slate-400 italic">{JSON.stringify(log.event_data)}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No data</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
