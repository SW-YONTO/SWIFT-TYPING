import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { UserCheck, Download, Filter, TrendingUp, Award, Sliders } from 'lucide-react';

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
  const [customProgress, setCustomProgress] = useState(50);

  if (!selectedTypist || !typistAnalytics) {
    return (
      <div className={`lg:col-span-2 ${cardClass} p-6`}>
        <div className="py-20 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/40 flex items-center justify-center border border-slate-700/50">
            <UserCheck className={`w-6 h-6 ${subTextClass}`} />
          </div>
          <p className={`text-base font-semibold ${subTextClass}`}>Select a typist from the left column to view progression stats.</p>
        </div>
      </div>
    );
  }

  // Find active filter index for sliding indicator translation
  const ranges = ['1D', '1W', '1M', '3M', '6M'];
  const activeIndex = ranges.indexOf(timeRange);

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

          {/* Collapsible/Expandable Timeline Filter Switcher with Sliding indicator */}
          <div 
            className={`relative flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl transition-all duration-300 overflow-hidden ${
              isFilterExpanded ? 'w-[230px]' : 'w-[80px]'
            }`}
          >
            {/* Filter Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterExpanded(!isFilterExpanded);
              }}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 focus:outline-none cursor-pointer"
              title="Toggle filter options"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Sliding Indicator & Options Wrapper */}
            <div className={`relative flex items-center gap-0.5 transition-all duration-300 ${
              isFilterExpanded ? 'opacity-100 ml-1.5' : 'opacity-0 pointer-events-none w-0'
            }`}>
              {isFilterExpanded && (
                <div 
                  className="absolute top-0 bottom-0 bg-blue-600 rounded-lg transition-all duration-300 shadow-lg shadow-blue-600/30"
                  style={{
                    left: `${activeIndex * 36}px`,
                    width: '36px'
                  }}
                />
              )}
              
              {ranges.map((range) => (
                <button
                  key={range}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTimeRange(range);
                  }}
                  className={`w-9 py-1 rounded-lg text-xs font-black relative z-10 transition duration-300 text-center cursor-pointer ${
                    timeRange === range
                      ? 'text-white font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Collapsed active badge */}
            {!isFilterExpanded && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFilterExpanded(true);
                }}
                className="text-xs font-black text-blue-400 ml-1.5 mr-2 select-none cursor-pointer hover:underline"
              >
                {timeRange}
              </span>
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
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-blue-500" /> Admin Controls
        </h4>
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Production-Grade Adjustable Curriculum Progress Controls */}
          <div className="flex items-center gap-3 bg-slate-850 border border-slate-700/60 p-2.5 rounded-2xl shadow-inner">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Adjust Curriculum Progress</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customProgress}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    setCustomProgress(val);
                  }}
                  className="w-14 text-center bg-slate-900 border border-slate-700 rounded-xl py-1 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <span className="text-xs text-slate-300 font-black">%</span>
              </div>
            </div>
            <button
              onClick={() => handleUnlockLessons(customProgress)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-505 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md shadow-blue-600/10 active:scale-95 border border-blue-500/20"
              title={`Adjust typist completed lessons progress directly to ${customProgress}%`}
            >
              Apply Progress Update
            </button>
          </div>

          <button
            onClick={() => setCertificateUser({
              username: selectedTypist.username,
              wpm: typistAnalytics.peakWpm,
              accuracy: typistAnalytics.avgAcc,
              date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
            })}
            className="px-4 py-3 bg-purple-650 hover:bg-purple-600 text-white font-black rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/10 active:scale-95 border border-purple-500/30"
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
