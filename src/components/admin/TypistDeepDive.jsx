import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { UserCheck, Download, Filter, TrendingUp, Award } from 'lucide-react';

export default function TypistDeepDive({
  theme,
  selectedTypist,
  typistAnalytics,
  handleExportBackup,
  timeRange,
  setTimeRange,
  isFilterExpanded,
  setIsFilterExpanded,
  handleUnlockLessons,
  setCertificateUser,
  isDarkMode
}) {
  const cardClass = `${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl transition-all duration-300`;
  const subTextClass = theme.textSecondary || 'text-gray-400';

  if (!selectedTypist || !typistAnalytics) {
    return (
      <div className={`lg:col-span-2 ${cardClass} p-6`}>
        <div className="py-20 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/40 flex items-center justify-center border border-slate-700/50">
            <UserCheck className={`w-6 h-6 ${subTextClass}`} />
          </div>
          <p className={`text-base font-semibold ${subTextClass}`}>Select a typist from the left column to view 1M/3M/6M progression stats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`lg:col-span-2 ${cardClass} p-6 space-y-6`}>
      {/* Header Profile Info */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${theme.border} pb-4`}>
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <UserCheck className={`w-7 h-7 ${theme.accent}`} /> {selectedTypist.username}
          </h2>
          <p className={`text-xs mt-1 ${subTextClass}`}>Deep progression telemetry inspector for user</p>
        </div>

        {/* Action controls (Export Recovery File & Timeline filter) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportBackup}
            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Generate JSON recovery backup file from daily summary telemetry"
          >
            <Download className="w-3.5 h-3.5" /> Export Recovery File
          </button>

          {/* Collapsible/Expandable Timeline Filter Switcher */}
          <div 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center gap-1.5 p-1 bg-slate-500/10 border border-slate-500/20 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden ${
              isFilterExpanded ? 'max-w-[320px]' : 'max-w-[80px]'
            }`}
            title={isFilterExpanded ? 'Click to collapse filter options' : 'Click to expand filter options'}
          >
            <Filter className="w-3.5 h-3.5 ml-1.5 text-slate-400 flex-shrink-0" />
            
            {isFilterExpanded ? (
              <div className="flex items-center gap-1">
                {['1D', '1W', '1M', '3M', '6M'].map((range) => (
                  <button
                    key={range}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeRange(range);
                      setIsFilterExpanded(false);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      timeRange === range
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs font-extrabold text-blue-400 mr-2 flex-shrink-0">{timeRange}</span>
            )}
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl text-center">
          <p className={`text-xs uppercase font-semibold ${subTextClass}`}>Peak Speed</p>
          <p className="text-2xl font-black mt-1 text-blue-400">{typistAnalytics.peakWpm} <span className="text-xs font-normal text-slate-400">WPM</span></p>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl text-center">
          <p className={`text-xs uppercase font-semibold ${subTextClass}`}>Avg Accuracy</p>
          <p className="text-2xl font-black mt-1 text-emerald-400">{typistAnalytics.avgAcc}%</p>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl text-center">
          <p className={`text-xs uppercase font-semibold ${subTextClass}`}>Lessons Done</p>
          <p className="text-2xl font-black mt-1 text-purple-400">{typistAnalytics.completedLessonsCount}</p>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl text-center">
          <p className={`text-xs uppercase font-semibold ${subTextClass}`}>Practice Time</p>
          <p className="text-2xl font-black mt-1 text-amber-400">{typistAnalytics.timeSpentMins} <span className="text-xs font-normal text-slate-400">mins</span></p>
        </div>
      </div>

      {/* Admin Operations Panel */}
      <div className={`p-5 border ${theme.border} rounded-2xl bg-slate-900/10 space-y-4`}>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Controls</h4>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleUnlockLessons(50)}
            className="px-4 py-2 border border-slate-600 hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Set user completed lessons progress to 50%"
          >
            Unlock 50% Lessons
          </button>
          <button
            onClick={() => handleUnlockLessons(100)}
            className="px-4 py-2 border border-slate-600 hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Set user completed lessons progress to 100%"
          >
            Unlock 100% Lessons
          </button>
          <button
            onClick={() => setCertificateUser({
              username: selectedTypist.username,
              wpm: typistAnalytics.peakWpm,
              accuracy: typistAnalytics.avgAcc,
              date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
            })}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" /> Issue Completion Certificate
          </button>
        </div>
      </div>

      {/* WPM Progression AreaChart */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" /> {timeRange} WPM Speed Progression Timeline
        </h3>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={typistAnalytics.dataPoints}>
              <defs>
                <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#f3f4f6'} vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 'auto']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
                  borderRadius: '12px', 
                  borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                  color: isDarkMode ? '#f9fafb' : '#111827'
                }} 
              />
              <Area type="monotone" dataKey="wpm" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#wpmGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
