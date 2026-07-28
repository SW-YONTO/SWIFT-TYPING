import React from 'react';
import { Activity, Check, Copy, User, Trophy, Zap, TrendingUp, Target, Clock } from 'lucide-react';

export default function TelemetryLogStream({
  theme,
  isDarkMode,
  cardClass,
  subTextClass,
  telemetryLogs,
  copiedDeviceId,
  handleCopyDeviceId,
  handleSelectUser
}) {
  const _cardClass = cardClass || `${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl transition-all duration-300`;
  const _subText = subTextClass || theme.textSecondary || 'text-gray-500';

  // Event type badge colors — adapts to dark vs. light
  const getEventTypeBadge = (type) => {
    const raw = type || 'session_sync';
    if (raw.includes('10s') || raw.includes('session') || raw.includes('daily_summary')) {
      return (
        <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold rounded-md text-[10px]">
          Session Sync
        </span>
      );
    }
    if (raw.includes('ping')) {
      return (
        <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-md text-[10px]">
          Daily Ping
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-extrabold rounded-md text-[10px]">
        {raw.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className={`${_cardClass} p-6 space-y-4`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className={`w-5 h-5 ${theme.accent}`} /> Telemetry Log Stream ({telemetryLogs.length})
        </h3>
        <span className={`text-xs ${_subText}`}>Scrollable table • Max 500 recent events</span>
      </div>
      <div className={`overflow-x-auto overflow-y-auto max-h-96 border ${theme.border} rounded-xl`}>
        <table className="w-full text-left text-xs min-w-[1000px]">
          <thead className={`sticky top-0 z-10 ${theme.secondary} ${_subText} uppercase font-semibold border-b ${theme.border}`}>
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Name</th>
              <th className="p-3">Version</th>
              <th className="p-3">Event Type</th>
              <th className="p-3">Device ID</th>
              <th className="p-3 text-center"><Trophy className={`w-3.5 h-3.5 mx-auto ${theme.accent}`} title="Tests Completed" /></th>
              <th className="p-3 text-center"><Zap className="w-3.5 h-3.5 mx-auto text-amber-500" title="Max WPM" /></th>
              <th className="p-3 text-center"><TrendingUp className="w-3.5 h-3.5 mx-auto text-indigo-500" title="Avg WPM" /></th>
              <th className="p-3 text-center"><Target className="w-3.5 h-3.5 mx-auto text-emerald-500" title="Accuracy" /></th>
              <th className="p-3 text-center"><Clock className="w-3.5 h-3.5 mx-auto text-orange-500" title="Time Spent" /></th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.border} font-mono`}>
            {telemetryLogs.length === 0 ? (
              <tr>
                <td colSpan="10" className={`p-4 text-center italic ${_subText}`}>Local telemetry mode active. Log stream will populate as pings arrive.</td>
              </tr>
            ) : (
              telemetryLogs.map(log => {
                const data = log.event_data || {};
                const username = log.username || data.username;
                const client = log.client_type === 'electron' ? 'desk' : 'web';
                const version = `${client} ${log.app_version || '3.26.9'}`;

                const testsCompleted = log.tests_completed !== undefined ? log.tests_completed : data.tests_completed;
                const maxWpm = log.max_wpm !== undefined ? log.max_wpm : (data.max_wpm !== undefined ? data.max_wpm : data.wpm);
                const avgWpm = log.avg_wpm !== undefined ? log.avg_wpm : (data.avg_wpm !== undefined ? data.avg_wpm : data.wpm);
                const avgAccuracy = log.avg_accuracy !== undefined ? log.avg_accuracy : data.accuracy;
                const totalTime = log.total_time_seconds !== undefined ? log.total_time_seconds : data.total_time_seconds;

                return (
                  <tr key={log.id} className={`hover:${theme.secondary} transition-colors`}>
                    <td className={`p-3 whitespace-nowrap ${_subText}`}>{new Date(log.created_at || Date.now()).toLocaleTimeString()}</td>
                    <td className="p-3 whitespace-nowrap">
                      {username && username !== 'Anonymous Typist' ? (
                        <button
                          onClick={() => handleSelectUser(username)}
                          className={`${theme.accent} hover:underline font-bold transition flex items-center gap-1.5 cursor-pointer text-left focus:outline-none`}
                        >
                          <User className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{username}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectUser(log.device_id || username)}
                          className={`hover:underline font-semibold transition flex items-center gap-1.5 cursor-pointer text-left focus:outline-none ${_subText}`}
                        >
                          <User className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                          <span>{log.device_id ? `Device (${log.device_id.substring(0, 10)})` : 'Anonymous Typist'}</span>
                        </button>
                      )}
                    </td>
                    <td className={`p-3 whitespace-nowrap uppercase font-semibold ${_subText}`}>{version}</td>
                    <td className="p-3 whitespace-nowrap">{getEventTypeBadge(log.event_type)}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] ${_subText}`}>{log.device_id ? log.device_id.substring(0, 12) + '...' : 'Unknown'}</span>
                        {log.device_id && (
                          <button
                            onClick={() => handleCopyDeviceId(log.device_id)}
                            title="Copy full device_id"
                            className={`p-1 hover:opacity-70 rounded transition cursor-pointer ${_subText}`}
                          >
                            {copiedDeviceId === log.device_id
                              ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                              : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={`p-3 text-center font-bold ${theme.accent}`}>
                      {testsCompleted !== undefined ? testsCompleted : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-amber-500">
                      {maxWpm !== undefined ? `${maxWpm}` : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-indigo-500">
                      {avgWpm !== undefined ? `${avgWpm}` : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-500">
                      {avgAccuracy !== undefined ? `${avgAccuracy}%` : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-orange-500">
                      {totalTime !== undefined ? `${Math.round(totalTime / 60)}m` : '-'}
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
