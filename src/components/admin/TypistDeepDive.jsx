import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { 
  UserCheck, Download, Filter, TrendingUp, Award, Sliders, 
  Zap, Target, Trophy, Clock, CheckCircle2, Lock, Unlock, PlayCircle, 
  ChevronDown, ChevronUp, Layers, Ban, RotateCcw, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { typingLessons } from '../../data/lessons';

export default function TypistDeepDive({
  theme,
  isDarkMode,
  cardClass,
  subTextClass,
  inputClass,
  selectedTypist,
  typistAnalytics,
  handleExportBackup,
  timeRange,
  setTimeRange,
  isFilterExpanded,
  setIsFilterExpanded,
  handleUnlockLessons,
  handleToggleSingleLesson,
  handleQuickBan,
  handleResetUserProgress,
  setCertificateUser,
  userCompletedLessons = [],
  isBanned = false
}) {
  const [customProgress, setCustomProgress] = useState(50);
  const [isCurriculumSectionExpanded, setIsCurriculumSectionExpanded] = useState(false); // Section folded by default
  const [expandedUnits, setExpandedUnits] = useState({}); // Unit cards folded by default

  const _cardClass  = cardClass || `${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl transition-all duration-300`;
  const _subText    = subTextClass || theme.textSecondary || 'text-gray-500';

  if (!selectedTypist || !typistAnalytics) {
    return (
      <div className={`lg:col-span-2 ${_cardClass} p-6`}>
        <div className="py-20 text-center space-y-3">
          <div className={`w-12 h-12 mx-auto rounded-full ${theme.secondary} flex items-center justify-center border ${theme.border}`}>
            <UserCheck className={`w-6 h-6 ${_subText}`} />
          </div>
          <p className={`text-base font-semibold ${_subText}`}>Select a typist from the left column to view progression stats &amp; management controls.</p>
        </div>
      </div>
    );
  }

  // Calculate Unit Breakdown
  const units = Object.entries(typingLessons).map(([unitId, unitData]) => {
    const totalCount = unitData.lessons.length;
    const completedCount = unitData.lessons.filter(l => 
      userCompletedLessons.some(c => c.lessonId === l.id)
    ).length;

    return {
      id: unitId,
      title: unitData.title,
      description: unitData.description,
      lessons: unitData.lessons,
      totalCount,
      completedCount,
      percentage: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
      isFullyDone: completedCount === totalCount && totalCount > 0
    };
  });

  const ranges = ['1D', '1W', '1M', '3M', '6M'];
  const activeIndex = ranges.indexOf(timeRange);

  const chartStroke   = isDarkMode ? '#94a3b8' : '#64748b';
  const chartGrid     = isDarkMode ? '#374151' : '#e2e8f0';
  const chartAccent   = theme.css?.['--theme-primary'] || '#3b82f6';
  const tooltipBg     = isDarkMode ? '#1f2937' : '#ffffff';
  const tooltipText   = isDarkMode ? '#f9fafb' : '#0f172a';
  const tooltipBorder = isDarkMode ? '#374151' : '#cbd5e1';

  const toggleUnitExpand = (unitId) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  return (
    <div className={`lg:col-span-2 ${_cardClass} p-6 space-y-6`}>
      
      {/* Header Profile Info & Action Controls */}
      <div className={`flex flex-col space-y-4 border-b ${theme.border} pb-5`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <UserCheck className={`w-7 h-7 ${theme.accent}`} /> {selectedTypist.username}
              </h2>
              {isBanned ? (
                <span className="px-2.5 py-0.5 bg-red-500/20 text-red-500 border border-red-500/30 rounded-full text-xs font-black flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Banned
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 rounded-full text-xs font-black flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Active
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 ${_subText}`}>Typist profile inspector and management controls</p>
          </div>

          {/* Timeline Filter */}
          <div
            className={`relative flex items-center p-1 ${theme.secondary} border ${theme.border} rounded-xl transition-all duration-300 overflow-hidden ${
              isFilterExpanded ? 'w-[250px]' : 'w-[90px]'
            }`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setIsFilterExpanded(!isFilterExpanded); }}
              className="p-1.5 hover:opacity-70 rounded-lg transition-colors flex-shrink-0 focus:outline-none cursor-pointer"
            >
              <Filter className={`w-3.5 h-3.5 ${_subText}`} />
            </button>

            <div className={`relative flex items-center gap-0 transition-all duration-300 ${
              isFilterExpanded ? 'opacity-100 ml-1.5' : 'opacity-0 pointer-events-none w-0'
            }`}>
              {isFilterExpanded && (
                <div
                  className={`absolute top-0 bottom-0 ${theme.primary} rounded-lg transition-all duration-300`}
                  style={{ left: `${activeIndex * 40}px`, width: '40px' }}
                />
              )}
              {ranges.map((range) => (
                <button
                  key={range}
                  onClick={(e) => { e.stopPropagation(); setTimeRange(range); }}
                  className={`w-10 h-7 rounded-lg text-xs font-black relative z-10 transition duration-300 flex items-center justify-center cursor-pointer ${
                    timeRange === range ? 'text-white' : `${_subText} hover:opacity-80`
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {!isFilterExpanded && (
              <span
                onClick={(e) => { e.stopPropagation(); setIsFilterExpanded(true); }}
                className={`text-xs font-black ${theme.accent} ml-2 mr-2 select-none cursor-pointer hover:underline`}
              >
                {timeRange}
              </span>
            )}
          </div>
        </div>

        {/* User Management Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => handleQuickBan && handleQuickBan(selectedTypist)}
            className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              isBanned
                ? 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-600'
                : 'bg-red-500/10 hover:bg-red-500/25 border-red-500/30 text-red-500'
            }`}
          >
            <Ban className="w-3.5 h-3.5" /> {isBanned ? 'Unban Typist Account' : 'Suspend / Ban Typist'}
          </button>

          <button
            onClick={() => setCertificateUser({
              username: selectedTypist.username,
              wpm: typistAnalytics.peakWpm,
              accuracy: typistAnalytics.avgAcc,
              date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
            })}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Award className="w-3.5 h-3.5" /> Issue Certificate
          </button>

          <button
            onClick={handleExportBackup}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Export Recovery File
          </button>

          <button
            onClick={() => handleResetUserProgress && handleResetUserProgress(selectedTypist.username)}
            className={`px-3 py-1.5 border ${theme.border} ${theme.cardBg} ${_subText} hover:text-red-500 hover:border-red-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ml-auto`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Progress
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Peak Speed',    value: typistAnalytics.peakWpm,               unit: 'WPM',  valueCls: theme.accent,       icon: <Zap    className={`w-3.5 h-3.5 ${theme.accent}`}  />, border: theme.border },
          { label: 'Avg Accuracy',  value: `${typistAnalytics.avgAcc}%`,          unit: '',     valueCls: 'text-emerald-500', icon: <Target className="w-3.5 h-3.5 text-emerald-500" />, border: 'border-emerald-500/40' },
          { label: 'Lessons Done',  value: typistAnalytics.completedLessonsCount, unit: '',     valueCls: theme.accent,       icon: <Trophy className={`w-3.5 h-3.5 ${theme.accent}`}  />, border: theme.border },
          { label: 'Practice Time', value: typistAnalytics.timeSpentMins,         unit: 'mins', valueCls: 'text-amber-500',   icon: <Clock  className="w-3.5 h-3.5 text-amber-500"  />, border: 'border-amber-500/40' },
        ].map(({ label, value, unit, valueCls, icon, border }) => (
          <div key={label} className={`${theme.cardBg} border ${border} p-4 rounded-2xl`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${_subText}`}>{label}</span>
              {icon}
            </div>
            <p className={`text-3xl font-black ${valueCls}`}>
              {value}{unit && <span className={`text-xs font-normal ml-1.5 ${_subText}`}>{unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Admin Operations Panel with Single Clean Slider */}
      <div className={`p-5 border ${theme.border} rounded-2xl ${theme.secondary} space-y-3`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${_subText} flex items-center gap-1.5`}>
            <Sliders className={`w-3.5 h-3.5 ${theme.accent}`} /> Curriculum Progress Slider
          </h4>
          <span className={`text-xs font-black ${theme.accent}`}>{customProgress}%</span>
        </div>

        {/* Precision Slider + Single Apply Button */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={customProgress}
            onChange={(e) => setCustomProgress(Number(e.target.value))}
            className="flex-1 h-2 w-full rounded-full accent-[var(--theme-primary)] cursor-pointer"
            style={{ '--theme-primary': theme.css?.['--theme-primary'] || '#3b82f6' }}
          />

          <button
            onClick={() => handleUnlockLessons(customProgress)}
            className={`w-full md:w-auto px-5 py-2.5 ${theme.primary} ${theme.primaryHover} text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md active:scale-95 flex-shrink-0`}
          >
            Apply {customProgress}% Progress
          </button>
        </div>
      </div>

      {/* Folded Main Section for Curriculum Breakdown */}
      <div className="space-y-3">
        {/* Clickable Section Header (Folded initially) */}
        <div
          onClick={() => setIsCurriculumSectionExpanded(!isCurriculumSectionExpanded)}
          className={`${theme.cardBg} border ${theme.border} p-4 rounded-2xl cursor-pointer flex justify-between items-center hover:opacity-95 transition select-none`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className={`w-5 h-5 ${theme.accent}`} />
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider">
                Curriculum Breakdown ({units.length} Chapters)
              </h3>
              <p className={`text-[11px] ${_subText}`}>
                {isCurriculumSectionExpanded ? 'Click to collapse chapters list' : 'Folded — click to expand chapter cards & toggle single lessons'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-extrabold ${theme.accent}`}>
              {isCurriculumSectionExpanded ? 'Collapse' : 'Expand Chapters'}
            </span>
            {isCurriculumSectionExpanded ? (
              <ChevronUp className={`w-4 h-4 ${theme.accent}`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${theme.accent}`} />
            )}
          </div>
        </div>

        {/* Render Chapters Grid ONLY when Section is Expanded */}
        {isCurriculumSectionExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 animate-fade-in">
            {units.map(unit => (
              <div key={unit.id} className={`${theme.cardBg} border ${theme.border} p-3.5 rounded-2xl space-y-2`}>
                <div 
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleUnitExpand(unit.id)}
                >
                  <div className="flex items-center gap-2">
                    {unit.isFullyDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : unit.completedCount > 0 ? (
                      <PlayCircle className={`w-4 h-4 ${theme.accent} flex-shrink-0`} />
                    ) : (
                      <Lock className={`w-4 h-4 ${_subText} flex-shrink-0`} />
                    )}
                    <div>
                      <h5 className="text-xs font-bold">{unit.title}</h5>
                      <p className={`text-[10px] ${_subText}`}>{unit.completedCount}/{unit.totalCount} completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black ${unit.isFullyDone ? 'text-emerald-500' : theme.accent}`}>
                      {unit.percentage}%
                    </span>
                    {expandedUnits[unit.id] ? <ChevronUp className={`w-3.5 h-3.5 ${_subText}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${_subText}`} />}
                  </div>
                </div>

                {/* Single Clean Progress Bar */}
                <div className="w-full bg-gray-500/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${unit.isFullyDone ? 'bg-emerald-500' : theme.primary}`} 
                    style={{ width: `${unit.percentage}%` }}
                  />
                </div>

                {/* Expanded Lesson Details with Inline Lock/Unlock Icon Toggle Button */}
                {expandedUnits[unit.id] && (
                  <div className="pt-2 border-t border-dashed border-gray-500/20 space-y-1">
                    {unit.lessons.map(l => {
                      const isDone = userCompletedLessons.some(c => c.lessonId === l.id);
                      return (
                        <div 
                          key={l.id} 
                          className={`flex items-center justify-between text-xs p-2 rounded-xl transition ${
                            isDone 
                              ? 'bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20' 
                              : `${_subText} border border-transparent hover:bg-gray-500/10`
                          }`}
                        >
                          <span className="truncate pr-2">{l.title}</span>
                          
                          {/* Interactive Lock/Unlock Icon Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSingleLesson && handleToggleSingleLesson(selectedTypist.username, l.id);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-600 hover:bg-red-500/20 hover:text-red-500'
                                : 'bg-gray-500/20 text-gray-500 hover:bg-emerald-500/20 hover:text-emerald-600'
                            }`}
                            title={isDone ? 'Click to lock this lesson' : 'Click to unlock this lesson'}
                          >
                            {isDone ? (
                              <>
                                <Unlock className="w-3 h-3 text-emerald-500" />
                                <span>Unlocked</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-gray-400" />
                                <span>Locked</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WPM Progression AreaChart */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${theme.accent}`} /> {timeRange} WPM Speed Progression Timeline
        </h3>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={typistAnalytics.dataPoints}>
              <defs>
                <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={chartAccent} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartAccent} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
              <XAxis dataKey="date" stroke={chartStroke} fontSize={10} tickLine={false} />
              <YAxis stroke={chartStroke} fontSize={10} tickLine={false} domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderRadius: '12px',
                  borderColor: tooltipBorder,
                  color: tooltipText
                }}
              />
              <Area type="monotone" dataKey="wpm" stroke={chartAccent} strokeWidth={3} fillOpacity={1} fill="url(#wpmGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
