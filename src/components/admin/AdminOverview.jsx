import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Pie, PieChart, Cell
} from 'recharts';
import { Activity, Layers, UserCheck, Monitor, Zap, Award, AlertTriangle, RefreshCw } from 'lucide-react';
import TelemetryLogStream from './TelemetryLogStream';

export default function AdminOverview({
  theme,
  isDarkMode,
  cardClass,
  subTextClass,
  stats,
  dailyData,
  platformDistribution,
  telemetryLogs,
  copiedDeviceId,
  handleCopyDeviceId,
  handleSelectUser,
  loading = false,
  registeredUsersList = []
}) {
  const chartStroke   = isDarkMode ? '#94a3b8' : '#64748b';
  const tooltipBg     = isDarkMode ? '#1f2937' : '#ffffff';
  const tooltipText   = isDarkMode ? '#f9fafb' : '#0f172a';
  const tooltipBorder = isDarkMode ? '#374151' : '#e5e7eb';
  const barFill       = theme.css?.['--theme-primary'] || '#3b82f6';

  // Anomaly Detection (B7)
  const suspiciousUsers = registeredUsersList.filter(
    u => (u.averageWPM || 0) > 160 || (u.totalTests > 500 && (u.averageWPM || 0) > 140)
  );

  const metricCards = [
    { label: 'Registered Accounts', value: stats.registeredUsersCount, sub: 'Active typist profiles', icon: <UserCheck className={`w-5 h-5 ${theme.accent}`} /> },
    { label: 'Desktop Share',       value: stats.electronRatio,         sub: `${stats.electronCount} Desktop vs ${stats.webCount} Web`, icon: <Monitor className="w-5 h-5 text-purple-500" /> },
    { label: 'Average Speed',       value: `${stats.avgWpm} WPM`,      sub: `Peak Recorded: ${stats.maxWpm} WPM`, icon: <Zap className="w-5 h-5 text-amber-500" /> },
    { label: 'Tests Completed',     value: stats.totalTestsCompleted,  sub: `Practice Time: ${stats.totalTimeSpentMinutes} mins`, icon: <Award className="w-5 h-5 text-emerald-500" /> },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`${cardClass} p-6 h-28 bg-gray-500/10`} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${cardClass} p-6 h-72 bg-gray-500/10`} />
          <div className={`${cardClass} p-6 h-72 bg-gray-500/10`} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Anomaly Flag Banner (B7) */}
      {suspiciousUsers.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 animate-bounce" />
            <div>
              <p className="text-xs font-black">Anomaly Alert: {suspiciousUsers.length} typist(s) flagged for unusually high WPM (&gt;160 WPM)</p>
              <p className={`text-[11px] ${subTextClass}`}>Flagged: {suspiciousUsers.map(u => u.username).join(', ')}</p>
            </div>
          </div>
          <button
            onClick={() => handleSelectUser && handleSelectUser(suspiciousUsers[0].username)}
            className="px-3 py-1.5 bg-amber-500 text-white font-bold rounded-xl text-xs flex-shrink-0 cursor-pointer"
          >
            Inspect Account
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map(({ label, value, sub, icon }) => (
          <div key={label} className={`${cardClass} p-6 transform hover:-translate-y-1 transition-transform`}>
            <div className={`flex justify-between items-center ${subTextClass}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
              {icon}
            </div>
            <p className="text-3xl font-extrabold mt-3">{value}</p>
            <p className={`text-xs mt-1 ${subTextClass}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${cardClass} p-6 space-y-4`}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className={`w-5 h-5 ${theme.accent}`} /> User Practice Activity Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" stroke={chartStroke} fontSize={12} />
                <YAxis stroke={chartStroke} fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', borderColor: tooltipBorder, color: tooltipText }} />
                <Bar dataKey="activity" fill={barFill} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardClass} p-6 space-y-4`}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" /> Platform Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {platformDistribution.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', borderColor: tooltipBorder, color: tooltipText }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={`flex justify-center gap-6 text-xs ${subTextClass}`}>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Web App</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500" /> Desktop</span>
          </div>
        </div>
      </div>

      {/* Telemetry Log Stream */}
      <TelemetryLogStream
        theme={theme}
        isDarkMode={isDarkMode}
        cardClass={cardClass}
        subTextClass={subTextClass}
        telemetryLogs={telemetryLogs}
        copiedDeviceId={copiedDeviceId}
        handleCopyDeviceId={handleCopyDeviceId}
        handleSelectUser={handleSelectUser}
      />
    </div>
  );
}
