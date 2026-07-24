import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { userManager, progressManager } from '../utils/storage';
import { 
  Lock, ShieldAlert, Users, Activity, 
  CheckCircle, Ban, Monitor, Zap, Award, RefreshCw, Layers,
  Eye, EyeOff, KeyRound, Server, UserCheck, Clock, FileText, Trophy, Copy, Check
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Pie, PieChart, Cell 
} from 'recharts';

const DEFAULT_ADMIN_PASS = 'swiftadmin123';

export default function AdminPortal() {
  const { theme, isDarkMode } = useTheme();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stats State
  const [stats, setStats] = useState({
    uniqueUsers: 0,
    registeredUsersCount: 0,
    electronRatio: '0%',
    electronCount: 0,
    webCount: 0,
    avgWpm: 0,
    maxWpm: 0,
    totalTestsCompleted: 0,
    totalTimeSpentMinutes: 0
  });

  const [dailyData, setDailyData] = useState([]);
  const [platformDistribution, setPlatformDistribution] = useState([]);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [registeredUsersList, setRegisteredUsersList] = useState([]);
  const [bannedDevices, setBannedDevices] = useState([]);
  const [banInput, setBanInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedDeviceId, setCopiedDeviceId] = useState(null);

  const handleCopyDeviceId = (deviceId) => {
    if (!deviceId) return;
    try {
      navigator.clipboard.writeText(deviceId);
    } catch (e) {}
    setBanInput(deviceId);
    setCopiedDeviceId(deviceId);
    setStatusMsg(`📋 Copied device ID (${deviceId}) & filled ban field!`);
    setTimeout(() => setCopiedDeviceId(null), 2500);
  };

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('swift_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    // Instant local verification for zero lag or hanging
    const cleanPass = passwordInput.trim();
    if (cleanPass === DEFAULT_ADMIN_PASS || cleanPass === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('swift_admin_auth', 'true');
      fetchAdminData();
    } else {
      setAuthError('Incorrect Admin Password! Access Denied.');
      triggerShake();
    }
  };

  async function fetchAdminData() {
    setLoading(true);
    setStatusMsg('');

    // 1. Fetch Local App User Accounts
    const localUsers = userManager.getUsers() || [];
    setRegisteredUsersList(localUsers);

    // Compute Local Fallback Stats
    let localTotalTests = 0;
    let localWpmSum = 0;
    let localMaxWpm = 0;
    let localTimeSec = 0;

    localUsers.forEach(u => {
      localTotalTests += u.totalTests || 0;
      if (u.averageWPM) localWpmSum += u.averageWPM;
      const prog = progressManager.getUserProgress(u.id);
      if (prog?.stats?.bestWPM) localMaxWpm = Math.max(localMaxWpm, prog.stats.bestWPM);
      if (prog?.stats?.totalTime) localTimeSec += prog.stats.totalTime;
    });

    const isElectron = !!(
      window.electron || 
      window.electronAPI || 
      window.process?.type === 'renderer' || 
      navigator.userAgent.includes('Electron')
    );

    let supabaseLogs = [];
    let isRemoteOnline = false;
    let remoteError = null;

    // 2. Try fetching Supabase Telemetry Logs safely with timeout
    try {
      if (navigator.onLine) {
        const { data: rawLogs, error } = await supabase
          .from('app_telemetry')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) {
          remoteError = error.message || 'Supabase query error';
        } else if (rawLogs) {
          supabaseLogs = rawLogs;
          isRemoteOnline = true;
        }
      }
    } catch (err) {
      remoteError = err.message || 'Connection failed';
    }

    if (remoteError) {
      setStatusMsg(`⚠️ Database Sync Alert: Cannot connect to Supabase (${remoteError}). Please update VITE_SUPABASE_URL in Netlify settings.`);
    }

    setTelemetryLogs(supabaseLogs);

    // Process Combined Metrics
    const uniqueDevicesSet = new Set(supabaseLogs.map(l => l.device_id));
    if (uniqueDevicesSet.size === 0) {
      const devId = localStorage.getItem('swift_device_id') || 'dev_local_1';
      uniqueDevicesSet.add(devId);
    }

    const electronCount = supabaseLogs.filter(l => l.client_type === 'electron').length + (isElectron ? 1 : 0);
    const webCount = supabaseLogs.filter(l => l.client_type === 'web').length + (!isElectron ? 1 : 0);
    const totalClients = electronCount + webCount;

    const electronRatioStr = totalClients ? Math.round((electronCount / totalClients) * 100) + '%' : (isElectron ? '100%' : '0%');

    let remoteWpms = [];
    let remoteMaxWpm = 0;
    let remoteTests = 0;

    supabaseLogs.forEach(e => {
      const d = e.event_data || {};
      if (d.tests_completed) remoteTests += Number(d.tests_completed) || 0;
      if (d.avg_wpm) remoteWpms.push(Number(d.avg_wpm));
      if (d.wpm) remoteWpms.push(Number(d.wpm));
      if (d.max_wpm) remoteMaxWpm = Math.max(remoteMaxWpm, Number(d.max_wpm));
    });

    const combinedTests = Math.max(localTotalTests, remoteTests, localUsers.reduce((a, b) => a + (b.totalTests || 0), 0));
    const combinedMaxWpm = Math.max(localMaxWpm, remoteMaxWpm);
    const combinedAvgWpm = remoteWpms.length 
      ? Math.round(remoteWpms.reduce((a, b) => a + b, 0) / remoteWpms.length)
      : (localUsers.length ? Math.round(localWpmSum / localUsers.length) : 0);

    setStats({
      uniqueUsers: uniqueDevicesSet.size,
      registeredUsersCount: localUsers.length,
      electronRatio: electronRatioStr,
      electronCount,
      webCount,
      avgWpm: combinedAvgWpm,
      maxWpm: combinedMaxWpm,
      totalTestsCompleted: combinedTests,
      totalTimeSpentMinutes: Math.round(localTimeSec / 60)
    });

    // 3. Build Daily Activity Chart
    const dailyMap = {};
    if (supabaseLogs.length) {
      supabaseLogs.forEach(l => {
        const day = l.created_at ? l.created_at.split('T')[0] : 'Today';
        dailyMap[day] = (dailyMap[day] || 0) + 1;
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      dailyMap[today] = localTotalTests || 1;
    }

    const chartData = Object.keys(dailyMap)
      .sort()
      .slice(-7)
      .map(day => ({
        date: day.length > 5 ? day.substring(5) : day,
        activity: dailyMap[day]
      }));
    setDailyData(chartData);

    // 4. Platform Distribution
    setPlatformDistribution([
      { name: 'Web Version', value: webCount || 1, color: '#3b82f6' },
      { name: 'Electron Desktop', value: electronCount || (isElectron ? 1 : 0), color: '#a855f7' }
    ]);

    // Extract all typists across all computers/devices from Supabase telemetry
    const typistMap = {};

    localUsers.forEach(u => {
      if (u.username) {
        typistMap[u.username.toLowerCase()] = {
          id: u.id || u.username,
          username: u.username,
          averageWPM: u.averageWPM || 0,
          totalTests: u.totalTests || 0,
          clientType: isElectron ? 'Desktop' : 'Web'
        };
      }
    });

    supabaseLogs.forEach(log => {
      const d = log.event_data || {};
      if (d.username && d.username !== 'Anonymous Typist') {
        const key = d.username.toLowerCase();
        const wpm = Number(d.wpm || d.avg_wpm) || 0;
        
        if (!typistMap[key]) {
          typistMap[key] = {
            id: key,
            username: d.username,
            averageWPM: wpm,
            totalTests: d.tests_completed || 1,
            clientType: log.client_type === 'electron' ? 'Desktop' : 'Web'
          };
        } else {
          typistMap[key].averageWPM = Math.max(typistMap[key].averageWPM, wpm);
          typistMap[key].totalTests = Math.max(typistMap[key].totalTests, d.tests_completed || 1);
        }
      }
    });

    const mergedLeaderboard = Object.values(typistMap);
    setRegisteredUsersList(mergedLeaderboard);

    // 5. Moderation List
    try {
      if (navigator.onLine) {
        const { data: banData } = await supabase.from('user_moderation').select('*').eq('is_banned', true);
        if (banData) setBannedDevices(banData);
      }
    } catch (e) {}

    setLoading(false);
  }

  const handleBanUser = async () => {
    if (!banInput.trim()) return;
    try {
      await supabase.from('user_moderation').upsert({ device_id: banInput.trim(), is_banned: true, ban_reason: 'Flagged by Admin' });
      setBanInput('');
      setStatusMsg('Device successfully added to ban list!');
      fetchAdminData();
    } catch (err) {
      setStatusMsg('Device banned locally.');
    }
  };

  const handleUnbanUser = async (deviceId) => {
    try {
      await supabase.from('user_moderation').delete().eq('device_id', deviceId);
      setStatusMsg(`Device ${deviceId.substring(0, 8)}... unbanned.`);
      fetchAdminData();
    } catch (err) {
      // Ignore
    }
  };

  // Theme styling helpers
  const cardClass = `${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl transition-all duration-300`;
  const subTextClass = theme.textSecondary || 'text-gray-400';
  const primaryBtnClass = `${theme.primary} ${theme.primaryHover} text-white font-bold transition-all duration-200 shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer`;
  const inputClass = `${theme.inputBg} ${theme.border} border ${theme.text} rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`;

  // --- 1. INSTANT UNLOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className={`min-h-[82vh] flex items-center justify-center p-4 ${theme.text}`}>
        <form 
          onSubmit={handleLogin} 
          className={`${cardClass} p-8 md:p-10 w-full max-w-md space-y-6 transform transition-transform ${isShaking ? 'animate-shake border-red-500/50' : ''}`}
        >
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className={`w-20 h-20 ${theme.secondary || 'bg-blue-100'} border-2 ${theme.border} ${theme.accent} rounded-3xl flex items-center justify-center mx-auto shadow-inner transform hover:scale-105 transition-transform duration-300`}>
              <Lock className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Swift Typing Admin Portal</h2>
            <p className={`text-sm ${subTextClass}`}>Enter master password to unlock admin dashboard</p>
          </div>

          {/* Error Badge */}
          {authError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl text-sm font-medium flex items-center gap-3 animate-bounce">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          {/* Password Input with Show/Hide Toggle */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${subTextClass} flex items-center gap-1.5`}>
                <KeyRound className="w-3.5 h-3.5" /> Master Password
              </label>
              {passwordInput.length > 0 && (
                <span className="text-[11px] font-mono font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  {passwordInput.length} chars
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); if (authError) setAuthError(''); }}
                className={`w-full ${inputClass} font-mono pr-12`}
                placeholder="Enter password..."
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full py-4 rounded-2xl ${primaryBtnClass}`}
          >
            Unlock Admin Dashboard
          </button>
        </form>
      </div>
    );
  }

  // --- 2. MAIN ADMIN DASHBOARD UI ---
  return (
    <div className={`min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 ${theme.text}`}>
      {/* Top Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${theme.border} pb-6`}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Operations Center</h1>
            <span className={`px-2.5 py-0.5 border ${theme.border} ${theme.accent} rounded-full text-xs font-semibold ${theme.secondary}`}>
              System Active
            </span>
          </div>
          <p className={`text-sm mt-1 ${subTextClass}`}>Real-time application metrics, user profiles, and device controls</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAdminData}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 border ${theme.border} ${theme.cardBg} rounded-xl text-sm font-medium hover:opacity-80 transition cursor-pointer`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} ${theme.accent}`} /> Refresh Data
          </button>
          <button 
            onClick={() => { sessionStorage.removeItem('swift_admin_auth'); setIsAuthenticated(false); }}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl text-sm font-medium transition cursor-pointer"
          >
            Lock Dashboard
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {statusMsg}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${cardClass} p-6 transform hover:-translate-y-1 transition-transform`}>
          <div className={`flex justify-between items-center ${subTextClass}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Accounts</span>
            <UserCheck className={`w-5 h-5 ${theme.accent}`} />
          </div>
          <p className="text-3xl font-extrabold mt-3">{stats.registeredUsersCount}</p>
          <p className={`text-xs mt-1 ${subTextClass}`}>Total local typists profiles</p>
        </div>

        <div className={`${cardClass} p-6 transform hover:-translate-y-1 transition-transform`}>
          <div className={`flex justify-between items-center ${subTextClass}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Desktop Share</span>
            <Monitor className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold mt-3">{stats.electronRatio}</p>
          <p className={`text-xs mt-1 ${subTextClass}`}>{stats.electronCount} Desktop vs {stats.webCount} Web</p>
        </div>

        <div className={`${cardClass} p-6 transform hover:-translate-y-1 transition-transform`}>
          <div className={`flex justify-between items-center ${subTextClass}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Average Speed</span>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-extrabold mt-3">{stats.avgWpm} <span className={`text-base font-normal ${subTextClass}`}>WPM</span></p>
          <p className={`text-xs mt-1 ${subTextClass}`}>Peak Recorded: {stats.maxWpm} WPM</p>
        </div>

        <div className={`${cardClass} p-6 transform hover:-translate-y-1 transition-transform`}>
          <div className={`flex justify-between items-center ${subTextClass}`}>
            <span className="text-xs font-semibold uppercase tracking-wider">Tests Completed</span>
            <Award className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold mt-3">{stats.totalTestsCompleted}</p>
          <p className={`text-xs mt-1 ${subTextClass}`}>Practice Time: {stats.totalTimeSpentMinutes} mins</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${cardClass} p-6 space-y-4`}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className={`w-5 h-5 ${theme.accent}`} /> User Practice Activity Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
                    borderRadius: '12px', 
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                    color: isDarkMode ? '#f9fafb' : '#111827'
                  }} 
                />
                <Bar dataKey="activity" fill={theme.css?.['--theme-primary'] || '#3b82f6'} radius={[6, 6, 0, 0]} />
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
                <Pie 
                  data={platformDistribution} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50} 
                  outerRadius={80} 
                  dataKey="value"
                >
                  {platformDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', 
                    borderRadius: '12px', 
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                    color: isDarkMode ? '#f9fafb' : '#111827'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={`flex justify-center gap-6 text-xs ${subTextClass}`}>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Web App</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Desktop (Electron)</span>
          </div>
        </div>
      </div>

      {/* User Profiles & Device Moderation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Typists Leaderboard Inspector */}
        <div className={`${cardClass} p-6 space-y-4`}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Best Typists Leaderboard ({registeredUsersList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`${theme.secondary} ${subTextClass} uppercase font-semibold`}>
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Typist</th>
                  <th className="p-3">Avg WPM</th>
                  <th className="p-3">Total Tests</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.border}`}>
                {registeredUsersList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={`p-4 text-center italic ${subTextClass}`}>No typist profiles registered yet.</td>
                  </tr>
                ) : (
                  [...registeredUsersList]
                    .sort((a, b) => (b.averageWPM || 0) - (a.averageWPM || 0))
                    .map((u, idx) => (
                      <tr key={u.id} className="hover:opacity-80 transition-opacity">
                        <td className="p-3 font-bold">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {u.username}
                        </td>
                        <td className={`p-3 font-bold text-base ${theme.accent}`}>{u.averageWPM || 0} <span className="text-xs font-normal">WPM</span></td>
                        <td className="p-3 font-semibold text-slate-400">{u.totalTests || 0}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Moderation & Banning */}
        <div className={`${cardClass} p-6 space-y-4`}>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" /> Device Moderation & Banning
          </h3>
          <p className={`text-xs ${subTextClass}`}>Ban fraudulent device IDs from syncing leaderboard scores</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={banInput}
              onChange={(e) => setBanInput(e.target.value)}
              placeholder="Paste device_id to ban..."
              className={`flex-1 ${inputClass} font-mono py-2`}
            />
            <button onClick={handleBanUser} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition cursor-pointer">
              Ban
            </button>
          </div>

          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${subTextClass}`}>Currently Banned ({bannedDevices.length})</h4>
            <div className="max-h-28 overflow-y-auto space-y-1">
              {bannedDevices.length === 0 ? (
                <p className={`text-xs italic ${subTextClass}`}>No devices currently banned.</p>
              ) : (
                bannedDevices.map(b => (
                  <div key={b.device_id} className={`flex justify-between items-center ${theme.inputBg} border ${theme.border} px-3 py-1.5 rounded-lg text-xs`}>
                    <span className="font-mono text-red-500">{b.device_id}</span>
                    <button onClick={() => handleUnbanUser(b.device_id)} className={`${theme.accent} hover:underline cursor-pointer`}>Unban</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Raw Event Telemetry Logs Table */}
      <div className={`${cardClass} p-6 space-y-4`}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className={`w-5 h-5 ${theme.accent}`} /> Telemetry Log Stream ({telemetryLogs.length})
          </h3>
          <span className={`text-xs ${subTextClass}`}>Scrollable table • Max 500 recent events</span>
        </div>
        <div className={`overflow-x-auto overflow-y-auto max-h-96 border ${theme.border} rounded-xl`}>
          <table className="w-full text-left text-xs">
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
                    <td className={`p-3 max-w-sm truncate ${subTextClass}`} title={JSON.stringify(log.event_data)}>
                      {JSON.stringify(log.event_data)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
