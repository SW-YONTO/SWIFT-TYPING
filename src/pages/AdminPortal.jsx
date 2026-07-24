import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { userManager, progressManager } from '../utils/storage';
import { typingLessons } from '../data/lessons';
import { 
  Users, Activity, CheckCircle, Ban, Monitor, Zap, Award, RefreshCw, Layers,
  UserCheck, Trophy, LayoutDashboard, Search, LogOut, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Pie, PieChart, Cell
} from 'recharts';

import AdminLockScreen from '../components/admin/AdminLockScreen';
import TelemetryLogStream from '../components/admin/TelemetryLogStream';
import CompletionCertificate from '../components/admin/CompletionCertificate';
import TypistDeepDive from '../components/admin/TypistDeepDive';

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
  const [banReasonInput, setBanReasonInput] = useState('Abuse of service or leaderboard cheating.');
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedDeviceId, setCopiedDeviceId] = useState(null);
  
  // Certificate Modal State
  const [certificateUser, setCertificateUser] = useState(null);

  // Enterprise Sidebar & Typist Inspector States
  const getInitialTab = () => {
    const hash = window.location.hash;
    if (hash.includes('#users') || hash.includes('/users')) return 'users';
    if (hash.includes('#moderation') || hash.includes('/moderation')) return 'moderation';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab()); 
  const [selectedTypist, setSelectedTypist] = useState(null);
  const [timeRange, setTimeRange] = useState('1D'); // '1D' | '1W' | '1M' | '3M' | '6M'
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = `#/admin#${tab}`;
  };

  const handleSelectUser = (username) => {
    if (!username) return;
    setActiveTab('users');
    window.location.hash = `#/admin#users/${username}`;
    const found = registeredUsersList.find(
      u => u.username?.toLowerCase() === username.toLowerCase()
    );
    if (found) {
      setSelectedTypist(found);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('#users/') || hash.includes('/users/')) {
        const parts = hash.split('/');
        const username = parts[parts.length - 1];
        if (username && registeredUsersList.length > 0) {
          const found = registeredUsersList.find(
            u => u.username?.toLowerCase() === username.toLowerCase()
          );
          if (found) {
            setSelectedTypist(found);
            setActiveTab('users');
          }
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    if (registeredUsersList.length > 0) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [registeredUsersList]);

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

  const handleUnlockLessons = (percentage) => {
    if (!selectedTypist) return;
    
    // Find the local user profile matching selected typist
    const localUsers = userManager.getUsers() || [];
    const localUser = localUsers.find(u => u.username?.toLowerCase() === selectedTypist.username?.toLowerCase());
    if (!localUser) {
      setStatusMsg("⚠️ Cannot change progress: Typist profile is remote-only or not registered on this local computer.");
      return;
    }

    // Get complete flat list of lessons
    const flatLessons = [];
    Object.values(typingLessons).forEach(unit => {
      unit.lessons.forEach(l => {
        flatLessons.push({
          lessonId: l.id,
          wpm: 55 + Math.floor(Math.random() * 25),
          accuracy: 94 + Math.floor(Math.random() * 5),
          completedAt: new Date().toISOString()
        });
      });
    });

    const unlockCount = Math.ceil(flatLessons.length * (percentage / 100));
    const completedLessons = flatLessons.slice(0, unlockCount);

    const progress = progressManager.getUserProgress(localUser.id);
    progress.completedLessons = completedLessons;
    
    // Also simulate stats accumulation
    progress.stats.totalTests = Math.max(progress.stats.totalTests, unlockCount);
    progress.stats.totalTime = Math.max(progress.stats.totalTime, unlockCount * 90);
    progress.stats.bestWPM = Math.max(progress.stats.bestWPM, 75);
    
    progressManager.saveUserProgress(localUser.id, progress);
    setStatusMsg(`🔓 Successfully unlocked ${percentage}% (${unlockCount}/${flatLessons.length}) lessons for ${selectedTypist.username}!`);
    
    // Refresh admin data metrics
    fetchAdminData();
  };

  // Compute deep analytics for selected typist
  const getTypistAnalytics = () => {
    if (!selectedTypist) return null;

    const username = selectedTypist.username?.toLowerCase() || '';

    // Filter telemetry logs for this typist
    const typistLogs = telemetryLogs.filter(
      l => l.event_data?.username?.toLowerCase() === username
    );

    // Get local user progress if available
    let localProg = null;
    try {
      const localUsers = userManager.getUsers() || [];
      const u = localUsers.find(lu => lu.username?.toLowerCase() === username);
      if (u) {
        localProg = progressManager.getUserProgress(u.id);
      }
    } catch (e) {}

    // Combine data points
    let dataPoints = [];
    const now = Date.now();
    let daysCutoff = 30;
    if (timeRange === '1D') daysCutoff = 1;
    else if (timeRange === '1W') daysCutoff = 7;
    else if (timeRange === '1M') daysCutoff = 30;
    else if (timeRange === '3M') daysCutoff = 90;
    else if (timeRange === '6M') daysCutoff = 180;
    const cutoffTime = now - daysCutoff * 24 * 60 * 60 * 1000;

    // Add telemetry logs
    typistLogs.forEach(l => {
      const t = new Date(l.created_at).getTime();
      if (t >= cutoffTime) {
        dataPoints.push({
          date: new Date(l.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          timestamp: t,
          wpm: Number(l.event_data?.wpm || l.event_data?.avg_wpm) || 0,
          accuracy: Number(l.event_data?.accuracy || l.event_data?.avg_accuracy) || 0
        });
      }
    });

    // Add local test results if any
    if (localProg?.testResults) {
      localProg.testResults.forEach(r => {
        const t = new Date(r.completedAt || Date.now()).getTime();
        if (t >= cutoffTime) {
          dataPoints.push({
            date: new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            timestamp: t,
            wpm: Number(r.wpm) || 0,
            accuracy: Number(r.accuracy) || 0
          });
        }
      });
    }

    // Sort chronologically
    dataPoints.sort((a, b) => a.timestamp - b.timestamp);

    // If no points, create default baseline
    if (dataPoints.length === 0) {
      dataPoints = [
        { date: 'Initial', wpm: selectedTypist.averageWPM || 0, accuracy: 95 }
      ];
    }

    const peakWpm = Math.max(selectedTypist.averageWPM || 0, ...dataPoints.map(d => d.wpm));
    const avgAcc = dataPoints.length 
      ? Math.round(dataPoints.reduce((acc, d) => acc + (d.accuracy || 95), 0) / dataPoints.length)
      : 95;
    const completedLessonsCount = localProg?.completedLessons?.length || 0;

    return {
      dataPoints,
      peakWpm,
      avgAcc,
      completedLessonsCount,
      totalTests: Math.max(selectedTypist.totalTests || 0, dataPoints.length),
      timeSpentMins: Math.round((localProg?.stats?.totalTime || (dataPoints.length * 90)) / 60)
    };
  };

  const handleExportBackup = () => {
    if (!selectedTypist || !typistAnalytics) return;

    // Filter telemetry logs for this typist
    const username = selectedTypist.username?.toLowerCase() || '';
    const logs = telemetryLogs.filter(
      log => log.event_data?.username?.toLowerCase() === username
    );

    let totalTests = 0;
    let totalTime = 0;
    let maxWpm = 0;
    let wpmSum = 0;
    let accSum = 0;
    const testResults = [];

    logs.forEach(log => {
      const data = log.event_data || {};
      const tests = Number(data.tests_completed) || 1;
      const wpm = Number(data.avg_wpm || data.wpm) || 0;
      const acc = Number(data.avg_accuracy || data.accuracy) || 95;
      const time = Number(data.total_time_seconds || data.time_spent_seconds) || (tests * 60);

      totalTests += tests;
      totalTime += time;
      maxWpm = Math.max(maxWpm, Number(data.max_wpm || wpm) || 0);
      wpmSum += wpm * tests;
      accSum += acc * tests;

      // Reconstruct simulated test entries for recovery
      for (let i = 0; i < tests; i++) {
        testResults.push({
          wpm: wpm,
          accuracy: acc,
          timeSpent: Math.round(time / tests),
          completedAt: log.created_at,
          testTitle: `Telemetry Recovery Test ${i + 1}`,
          type: 'test'
        });
      }
    });

    const avgWpm = totalTests ? Math.round(wpmSum / totalTests) : (selectedTypist.averageWPM || 0);
    const avgAcc = totalTests ? Math.round(accSum / totalTests) : 95;

    const backupData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      user: {
        id: selectedTypist.id || `recovered_${Date.now()}`,
        username: selectedTypist.username,
        avatar: selectedTypist.avatar || 'avatar1.png',
        createdAt: new Date().toISOString(),
        totalTests: totalTests || selectedTypist.totalTests || 0,
        averageWPM: avgWpm,
        averageAccuracy: avgAcc
      },
      progress: {
        completedLessons: [],
        testResults: testResults,
        settings: {
          theme: 'blue',
          timeLimit: 60,
          wordLimit: 50,
          showVirtualHand: false
        },
        stats: {
          totalTests: totalTests || selectedTypist.totalTests || 0,
          totalTime: totalTime,
          totalCharacters: (totalTests || selectedTypist.totalTests || 0) * avgWpm * 5,
          bestWPM: maxWpm,
          bestAccuracy: avgAcc
        }
      },
      streak: {
        currentStreak: 1,
        bestStreak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        activeDates: logs.map(l => new Date(l.created_at).toISOString().split('T')[0])
      },
      achievements: [],
      keyStats: {}
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swift-typing-recovery-${selectedTypist.username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMsg(`💾 Successfully exported recovery file for ${selectedTypist.username}! Send this file to the user.`);
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

    // 2. Try fetching Supabase Daily Telemetry safely
    try {
      if (navigator.onLine) {
        let { data: dailyLogs, error: dailyErr } = await supabase
          .from('user_daily_telemetry')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(500);

        if (!dailyErr && dailyLogs && dailyLogs.length > 0) {
          supabaseLogs = dailyLogs.map(d => ({
            id: d.summary_id,
            device_id: d.device_id,
            client_type: d.client_type,
            os_platform: d.os_platform,
            app_version: d.app_version,
            event_type: 'daily_summary',
            created_at: d.updated_at || d.last_seen,
            event_data: {
              username: d.username,
              tests_completed: d.tests_completed,
              max_wpm: d.max_wpm,
              avg_wpm: d.avg_wpm,
              avg_accuracy: d.avg_accuracy,
              total_time_seconds: d.total_time_seconds
            }
          }));
          isRemoteOnline = true;
        } else {
          // Fallback to app_telemetry if daily summary is empty
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
      await supabase.from('user_moderation').upsert({ 
        device_id: banInput.trim(), 
        is_banned: true, 
        ban_reason: banReasonInput.trim() || 'Abuse of service or leaderboard cheating.' 
      });
      setBanInput('');
      setBanReasonInput('Abuse of service or leaderboard cheating.');
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
      <AdminLockScreen
        theme={theme}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        authError={authError}
        setAuthError={setAuthError}
        isShaking={isShaking}
        handleLogin={handleLogin}
      />
    );
  }

  const typistAnalytics = getTypistAnalytics();

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
          <p className={`text-sm mt-1 ${subTextClass}`}>Real-time telemetry, user deep-dive analytics, and moderation controls</p>
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
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Lock
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {statusMsg}
        </div>
      )}

      {/* Enterprise Sidebar & Tab Navigation Bar */}
      <div className={`flex items-center gap-2 border-b ${theme.border} pb-3 overflow-x-auto`}>
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'overview' 
              ? `${theme.accent} ${theme.secondary || 'bg-blue-500/15'} border ${theme.border}` 
              : `${subTextClass} hover:opacity-80`
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Overview Dashboard
        </button>

        <button
          onClick={() => {
            handleTabChange('users');
            if (!selectedTypist && registeredUsersList.length > 0) {
              setSelectedTypist(registeredUsersList[0]);
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'users' 
              ? `${theme.accent} ${theme.secondary || 'bg-blue-500/15'} border ${theme.border}` 
              : `${subTextClass} hover:opacity-80`
          }`}
        >
          <Users className="w-4 h-4" /> Typist Profiles & Progression ({registeredUsersList.length})
        </button>

        <button
          onClick={() => handleTabChange('moderation')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'moderation' 
              ? `text-red-500 bg-red-500/10 border border-red-500/30` 
              : `${subTextClass} hover:opacity-80`
          }`}
        >
          <Ban className="w-4 h-4 text-red-500" /> Moderation & Bans ({bannedDevices.length})
        </button>
      </div>

      {/* --- TAB 1: OVERVIEW DASHBOARD --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`${cardClass} p-6 transform hover:-translate-y-1 transition-transform`}>
              <div className={`flex justify-between items-center ${subTextClass}`}>
                <span className="text-xs font-semibold uppercase tracking-wider">Registered Accounts</span>
                <UserCheck className={`w-5 h-5 ${theme.accent}`} />
              </div>
              <p className="text-3xl font-extrabold mt-3">{stats.registeredUsersCount}</p>
              <p className={`text-xs mt-1 ${subTextClass}`}>Active typist profiles</p>
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

          {/* Telemetry log stream sub-component */}
          <TelemetryLogStream
            theme={theme}
            telemetryLogs={telemetryLogs}
            copiedDeviceId={copiedDeviceId}
            handleCopyDeviceId={handleCopyDeviceId}
            handleSelectUser={handleSelectUser}
          />
        </div>
      )}

      {/* --- TAB 2: TYPIST PROFILES & PROGRESSION INSPECTOR --- */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Typist Selector List */}
          <div className={`${cardClass} p-6 space-y-4`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Users className={`w-5 h-5 ${theme.accent}`} /> Select Typist ({registeredUsersList.length})
            </h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-3 ${subTextClass}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username..."
                className={`w-full ${inputClass} pl-9 text-xs py-2`}
              />
            </div>

            {/* Typists List */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {registeredUsersList
                .filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(u => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedTypist(u)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      selectedTypist?.username === u.username
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 font-extrabold shadow-sm'
                        : 'border-slate-700/50 hover:bg-slate-800/20 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {u.username}
                      </p>
                      <p className={`text-xs ${subTextClass}`}>{u.clientType || 'Web/Desktop'} • {u.totalTests || 0} tests</p>
                    </div>
                    <span className={`text-sm font-extrabold ${theme.accent}`}>{u.averageWPM || 0} WPM</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Right Column: Deep-Dive Progress Inspector (1D / 1W / 1M / 3M / 6M Charts) */}
          <TypistDeepDive
            theme={theme}
            selectedTypist={selectedTypist}
            typistAnalytics={typistAnalytics}
            handleExportBackup={handleExportBackup}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            isFilterExpanded={isFilterExpanded}
            setIsFilterExpanded={setIsFilterExpanded}
            handleUnlockLessons={handleUnlockLessons}
            setCertificateUser={setCertificateUser}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* --- TAB 3: MODERATION & BANS --- */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${cardClass} p-6 space-y-4`}>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" /> Device Moderation & Banning
            </h3>
            <p className={`text-xs ${subTextClass}`}>Ban fraudulent device IDs from syncing leaderboard scores</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${subTextClass}`}>Device ID</label>
                <input
                  type="text"
                  value={banInput}
                  onChange={(e) => setBanInput(e.target.value)}
                  placeholder="Paste device_id to ban..."
                  className={`w-full ${inputClass} font-mono py-2.5 text-xs`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${subTextClass}`}>Reason for Suspension</label>
                <input
                  type="text"
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="Enter custom reason..."
                  className={`w-full ${inputClass} py-2.5 text-xs`}
                />
              </div>
              <button 
                onClick={handleBanUser} 
                className="w-full py-3 bg-red-600 hover:bg-red-505 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" /> Ban Device ID & Account
              </button>
            </div>
          </div>

          <div className={`${cardClass} p-6 space-y-4`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${subTextClass}`}>Currently Banned ({bannedDevices.length})</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {bannedDevices.length === 0 ? (
                <p className={`text-xs italic ${subTextClass}`}>No devices currently banned.</p>
              ) : (
                bannedDevices.map(b => (
                  <div key={b.device_id} className={`flex justify-between items-center ${theme.inputBg} border ${theme.border} p-3 rounded-xl text-xs`}>
                    <span className="font-mono text-red-500 font-bold">{b.device_id}</span>
                    <button onClick={() => handleUnbanUser(b.device_id)} className={`${theme.accent} hover:underline cursor-pointer font-bold`}>Unban</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion certificate modal */}
      <CompletionCertificate
        certificateUser={certificateUser}
        setCertificateUser={setCertificateUser}
      />
    </div>
  );
}
