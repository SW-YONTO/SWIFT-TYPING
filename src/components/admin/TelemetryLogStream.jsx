import React from 'react';
import { Activity, Check, Copy, User, Trophy, Zap, TrendingUp, Target, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function TelemetryLogStream({
  theme,
  telemetryLogs,
  copiedDeviceId,
  handleCopyDeviceId,
  handleSelectUser
}) {
  const { isDarkMode } = useTheme();
  const subTextClass = theme.textSecondary || 'text-gray-400';

  const getEventTypeColor = (type) => {
    if (isDarkMode) {
      switch (type) {
        case 'daily_summary':
          return 'text-blue-400 font-bold';
        case 'login':
          return 'text-emerald-400 font-bold';
        case 'on_startup':
          return 'text-purple-400 font-bold';
        case 'history_migration':
          return 'text-amber-400 font-bold';
        default:
          return 'text-slate-400';
      }
    } else {
      switch (type) {
        case 'daily_summary':
          return 'text-blue-600 font-bold';
        case 'login':
          return 'text-emerald-600 font-bold';
        case 'on_startup':
          return 'text-purple-700 font-bold';
        case 'history_migration':
          return 'text-amber-600 font-bold';
        default:
          return 'text-slate-600';
      }
    }
  };

  return (
    <div className={`${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl p-6 space-y-4 transition-all duration-300`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className={`w-5 h-5 ${theme.accent}`} /> Telemetry Log Stream ({telemetryLogs.length})
        </h3>
        <span className={`text-xs ${subTextClass}`}>Scrollable table • Max 500 recent events</span>
      </div>
      <div className={`overflow-x-auto overflow-y-auto max-h-96 border ${theme.border} rounded-xl`}>
        <table className="w-full text-left text-xs min-w-[1000px]">
          <thead className={`sticky top-0 z-10 ${theme.secondary} ${subTextClass} uppercase font-semibold border-b ${theme.border}`}>
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Name</th>
              <th className="p-3">Version</th>
              <th className="p-3">Event Type</th>
              <th className="p-3">Device ID</th>
              <th className="p-3 text-center"><Trophy className="w-3.5 h-3.5 mx-auto text-blue-500 dark:text-blue-400" title="Tests Completed" /></th>
              <th className="p-3 text-center"><Zap className="w-3.5 h-3.5 mx-auto text-amber-500 dark:text-amber-400" title="Max WPM" /></th>
              <th className="p-3 text-center"><TrendingUp className="w-3.5 h-3.5 mx-auto text-indigo-500 dark:text-indigo-400" title="Avg WPM" /></th>
              <th className="p-3 text-center"><Target className="w-3.5 h-3.5 mx-auto text-emerald-500 dark:text-emerald-400" title="Accuracy" /></th>
              <th className="p-3 text-center"><Clock className="w-3.5 h-3.5 mx-auto text-orange-500 dark:text-orange-400" title="Time Spent" /></th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.border} font-mono`}>
            {telemetryLogs.length === 0 ? (
              <tr>
                <td colSpan="10" className={`p-4 text-center italic ${subTextClass}`}>Local telemetry mode active. Log stream will populate as pings arrive.</td>
              </tr>
            ) : (
              telemetryLogs.map(log => {
                const data = log.event_data || {};
                const client = log.client_type === 'electron' ? 'desk' : 'web';
                const version = `${client} ${log.app_version || '3.26.8'}`;

                return (
                  <tr key={log.id} className="hover:bg-slate-500/5 dark:hover:bg-slate-800/20 transition-colors">
                    <td className={`p-3 whitespace-nowrap ${subTextClass}`}>{new Date(log.created_at).toLocaleTimeString()}</td>
                    <td className="p-3 whitespace-nowrap">
                      {data.username ? (
                        <button
                          onClick={() => handleSelectUser(data.username)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold transition flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                        >
                          <User className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{data.username}</span>
                        </button>
                      ) : (
                        <span className="text-gray-500 dark:text-slate-500 italic">Anonymous</span>
                      )}
                    </td>
                    <td className={`p-3 whitespace-nowrap uppercase font-semibold ${subTextClass}`}>{version}</td>
                    <td className={`p-3 whitespace-nowrap ${getEventTypeColor(log.event_type)}`}>{log.event_type}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-600 dark:text-slate-400 text-[11px]">{log.device_id ? log.device_id.substring(0, 12) + '...' : 'Unknown'}</span>
                        {log.device_id && (
                          <button
                            onClick={() => handleCopyDeviceId(log.device_id)}
                            title="Copy full device_id"
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
                    <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400">
                      {data.tests_completed !== undefined ? data.tests_completed : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                      {data.max_wpm !== undefined ? `${data.max_wpm} WPM` : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {data.avg_wpm !== undefined ? `${data.avg_wpm} WPM` : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {data.avg_accuracy !== undefined ? `${data.avg_accuracy}%` : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-orange-600 dark:text-orange-400">
                      {data.total_time_seconds !== undefined ? `${Math.round(data.total_time_seconds / 60)}m` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
