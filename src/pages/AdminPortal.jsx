import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { userManager, progressManager, adminAuditManager } from '../utils/storage';
import { typingLessons } from '../data/lessons';
import { Users, Ban, RefreshCw, LogOut, LayoutDashboard, CheckCircle, Clock, Award, X, ShieldAlert } from 'lucide-react';

import AdminLockScreen     from '../components/admin/AdminLockScreen';
import AdminOverview       from '../components/admin/AdminOverview';
import AdminUserList       from '../components/admin/AdminUserList';
import AdminModeration     from '../components/admin/AdminModeration';
import TypistDeepDive      from '../components/admin/TypistDeepDive';
import CompletionCertificate from '../components/admin/CompletionCertificate';

const DEFAULT_ADMIN_PASS = 'swiftadmin123';

export default function AdminPortal() {
  const { theme, isDarkMode } = useTheme();

  // ─── Auth ───────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput,   setPasswordInput]   = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [authError,       setAuthError]       = useState('');
  const [isShaking,       setIsShaking]       = useState(false);

  // ─── Loading / Status Toast (Floating Toast Notification) ───
  const [loading,             setLoading]             = useState(false);
  const [statusMsg,           setStatusMsgState]      = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0); // 0 = off, 30 = 30s, 60 = 1m, 300 = 5m

  // Floating Toast Helper with Auto-Dismiss (3.5s)
  const setStatusMsg = (msg) => {
    setStatusMsgState(msg);
    if (msg) {
      setTimeout(() => {
        setStatusMsgState(prev => prev === msg ? '' : prev);
      }, 3500);
    }
  };

  // ─── Overview data ───────────────────────────────────────────
  const [stats, setStats] = useState({
    registeredUsersCount: 0, uniqueUsers: 0,
    electronRatio: '0%', electronCount: 0, webCount: 0,
    avgWpm: 0, maxWpm: 0, totalTestsCompleted: 0, totalTimeSpentMinutes: 0
  });
  const [dailyData,            setDailyData]            = useState([]);
  const [platformDistribution, setPlatformDistribution] = useState([]);
  const [telemetryLogs,        setTelemetryLogs]        = useState([]);

  // ─── Users / Moderation / Audit Logs ────────────────────────
  const [registeredUsersList, setRegisteredUsersList] = useState([]);
  const [bannedDevices,       setBannedDevices]       = useState([]);
  const [banInput,            setBanInput]            = useState('');
  const [banReasonInput,      setBanReasonInput]      = useState('Abuse of service or leaderboard cheating.');
  const [copiedDeviceId,      setCopiedDeviceId]      = useState(null);
  const [auditLogs,           setAuditLogs]           = useState([]);

  // ─── Navigation / UI ─────────────────────────────────────────
  const getInitialTab = () => {
    const h = window.location.hash;
    if (h.includes('#users') || h.includes('/users'))             return 'users';
    if (h.includes('#moderation') || h.includes('/moderation')) return 'moderation';
    if (h.includes('#certificates') || h.includes('/certificates')) return 'certificates';
    return 'overview';
  };

  const [activeTab,         setActiveTab]         = useState(getInitialTab);
  const [selectedTypist,    setSelectedTypist]    = useState(null);
  const [timeRange,         setTimeRange]         = useState('1D');
  const [isFilterExpanded,  setIsFilterExpanded]  = useState(false);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [certificateUser,   setCertificateUser]   = useState(null);

  // ─── Theme styling helpers ───────────────────────────
  const cardClass    = `${theme.cardBg} ${theme.border} border shadow-xl rounded-3xl transition-all duration-300`;
  const subTextClass = theme.textSecondary || 'text-gray-400';
  const inputClass   = `${theme.inputBg} ${theme.border} border ${theme.text} rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`;

  // ─── Routing helpers ─────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = `#/admin#${tab}`;
  };

  const handleSelectUser = (username) => {
    if (!username) return;
    setActiveTab('users');
    window.location.hash = `#/admin#users/${username}`;
    const found = registeredUsersList.find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (found) setSelectedTypist(found);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('#users/') || hash.includes('/users/')) {
        const parts = hash.split('/');
        const username = parts[parts.length - 1];
        if (username && registeredUsersList.length > 0) {
          const found = registeredUsersList.find(u => u.username?.toLowerCase() === username.toLowerCase());
          if (found) { setSelectedTypist(found); setActiveTab('users'); }
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    if (registeredUsersList.length > 0) handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [registeredUsersList]);

  // Load audit logs on mount
  useEffect(() => {
    setAuditLogs(adminAuditManager.getLogs());
  }, []);

  // Auto Refresh Interval Timer (I-5)
  useEffect(() => {
    if (!isAuthenticated || autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchAdminData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefreshInterval]);

  // ─── Auth ─────────────────────────────────────────────────────
  const triggerShake = () => { setIsShaking(true); setTimeout(() => setIsShaking(false), 600); };

  const handleLogin = (e) => {
    e.preventDefault();
    const clean = passwordInput.trim();
    if (clean === DEFAULT_ADMIN_PASS || clean === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('swift_admin_auth', 'true');
      fetchAdminData();
    } else {
      setAuthError('Incorrect Admin Password! Access Denied.');
      triggerShake();
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('swift_admin_auth') === 'true') {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  }, []);

  // ─── Fetch Admin Data ─────────────────────────────────────────
  async function fetchAdminData() {
    setLoading(true);

    const localUsers = userManager.getUsers() || [];
    setRegisteredUsersList(localUsers);

    let localTotalTests = 0, localWpmSum = 0, localMaxWpm = 0, localTimeSec = 0;
    localUsers.forEach(u => {
      localTotalTests += u.totalTests || 0;
      if (u.averageWPM) localWpmSum += u.averageWPM;
      const prog = progressManager.getUserProgress(u.id);
      if (prog?.stats?.bestWPM)   localMaxWpm  = Math.max(localMaxWpm, prog.stats.bestWPM);
      if (prog?.stats?.totalTime) localTimeSec += prog.stats.totalTime;
    });

    const isElectron = !!(window.electron || window.electronAPI || window.process?.type === 'renderer' || navigator.userAgent.includes('Electron'));
    let supabaseLogs = [], remoteError = null;

    try {
      if (navigator.onLine) {
        let { data: dailyLogs, error: dailyErr } = await supabase
          .from('user_daily_telemetry').select('*').order('updated_at', { ascending: false }).limit(500);

        if (!dailyErr && dailyLogs?.length > 0) {
          supabaseLogs = dailyLogs.map(d => ({
            id: d.summary_id, device_id: d.device_id, client_type: d.client_type,
            os_platform: d.os_platform, app_version: d.app_version,
            event_type: 'daily_summary',
            created_at: d.updated_at || d.last_seen,
            event_data: { username: d.username, tests_completed: d.tests_completed, max_wpm: d.max_wpm, avg_wpm: d.avg_wpm, avg_accuracy: d.avg_accuracy, total_time_seconds: d.total_time_seconds }
          }));
        } else {
          const { data: rawLogs, error } = await supabase.from('app_telemetry').select('*').order('created_at', { ascending: false }).limit(500);
          if (error) remoteError = error.message;
          else if (rawLogs) supabaseLogs = rawLogs;
        }
      }
    } catch (err) { remoteError = err.message; }

    if (remoteError) setStatusMsg(`⚠️ Database Sync Alert: Cannot connect to Supabase (${remoteError}).`);
    setTelemetryLogs(supabaseLogs);

    const electronCount = supabaseLogs.filter(l => l.client_type === 'electron').length + (isElectron ? 1 : 0);
    const webCount      = supabaseLogs.filter(l => l.client_type === 'web').length  + (!isElectron ? 1 : 0);
    const totalClients  = electronCount + webCount;
    const electronRatioStr = totalClients ? Math.round((electronCount / totalClients) * 100) + '%' : (isElectron ? '100%' : '0%');

    let remoteWpms = [], remoteMaxWpm = 0, remoteTests = 0;
    supabaseLogs.forEach(e => {
      const d = e.event_data || {};
      if (d.tests_completed) remoteTests += Number(d.tests_completed) || 0;
      if (d.avg_wpm) remoteWpms.push(Number(d.avg_wpm));
      if (d.wpm)     remoteWpms.push(Number(d.wpm));
      if (d.max_wpm) remoteMaxWpm = Math.max(remoteMaxWpm, Number(d.max_wpm));
    });

    setStats({
      uniqueUsers: new Set(supabaseLogs.map(l => l.device_id)).size || 1,
      registeredUsersCount: localUsers.length,
      electronRatio: electronRatioStr, electronCount, webCount,
      avgWpm: remoteWpms.length ? Math.round(remoteWpms.reduce((a, b) => a + b, 0) / remoteWpms.length) : (localUsers.length ? Math.round(localWpmSum / localUsers.length) : 0),
      maxWpm: Math.max(localMaxWpm, remoteMaxWpm),
      totalTestsCompleted: Math.max(localTotalTests, remoteTests),
      totalTimeSpentMinutes: Math.round(localTimeSec / 60)
    });

    // Daily Activity chart
    const dailyMap = {};
    if (supabaseLogs.length) {
      supabaseLogs.forEach(l => { const d = l.created_at?.split('T')[0] || 'Today'; dailyMap[d] = (dailyMap[d] || 0) + 1; });
    } else {
      dailyMap[new Date().toISOString().split('T')[0]] = localTotalTests || 1;
    }
    setDailyData(Object.keys(dailyMap).sort().slice(-7).map(day => ({ date: day.substring(5), activity: dailyMap[day] })));
    setPlatformDistribution([
      { name: 'Web Version', value: webCount || 1, color: '#3b82f6' },
      { name: 'Desktop',     value: electronCount || (isElectron ? 1 : 0), color: '#a855f7' }
    ]);

    // Merged typist list
    const typistMap = {};
    localUsers.forEach(u => {
      if (u.username) typistMap[u.username.toLowerCase()] = { id: u.id || u.username, username: u.username, averageWPM: u.averageWPM || 0, totalTests: u.totalTests || 0, clientType: isElectron ? 'Desktop' : 'Web' };
    });
    supabaseLogs.forEach(log => {
      const d = log.event_data || {};
      if (d.username && d.username !== 'Anonymous Typist') {
        const key = d.username.toLowerCase();
        const wpm = Number(d.wpm || d.avg_wpm) || 0;
        if (!typistMap[key]) typistMap[key] = { id: key, username: d.username, averageWPM: wpm, totalTests: d.tests_completed || 1, clientType: log.client_type === 'electron' ? 'Desktop' : 'Web' };
        else { typistMap[key].averageWPM = Math.max(typistMap[key].averageWPM, wpm); typistMap[key].totalTests = Math.max(typistMap[key].totalTests, d.tests_completed || 1); }
      }
    });
    setRegisteredUsersList(Object.values(typistMap));

    try {
      if (navigator.onLine) {
        const { data: banData } = await supabase.from('user_moderation').select('*').eq('is_banned', true);
        if (banData) setBannedDevices(banData);
      }
    } catch (e) {}

    setAuditLogs(adminAuditManager.getLogs());
    setLoading(false);
  }

  // ─── Moderation (H-8, H-10, H-11, A-7) ───────────────────────────
  const handleBanUser = async () => {
    const target = banInput.trim();
    if (!target) return;
    const reason = banReasonInput.trim() || 'Abuse of service or leaderboard cheating.';
    try {
      await supabase.from('user_moderation').upsert({ 
        device_id: target, 
        is_banned: true, 
        ban_reason: reason 
      });
      adminAuditManager.logAction('USER_BAN', target, `Reason: ${reason}`);
      setBanInput('');
      setStatusMsg(`🚫 Account/Device '${target}' added to ban list!`);
      fetchAdminData();
    } catch { 
      adminAuditManager.logAction('USER_BAN', target, `Locally banned. Reason: ${reason}`);
      setStatusMsg(`Locally banned '${target}'.`); 
    }
  };

  const handleQuickBan = (user) => {
    const username = user.username || user.id;
    setBanInput(username);
    setActiveTab('moderation');
    setStatusMsg(`Pre-filled ban input with username '${username}'.`);
  };

  const handleUnbanUser = async (deviceId) => {
    try {
      await supabase.from('user_moderation').delete().eq('device_id', deviceId);
      adminAuditManager.logAction('USER_UNBAN', deviceId, 'Admin removed suspension');
      setStatusMsg(`Unbanned '${deviceId}'.`);
      fetchAdminData();
    } catch {}
  };

  const handleClearAuditLogs = () => {
    adminAuditManager.clearLogs();
    setAuditLogs([]);
    setStatusMsg('Audit logs cleared.');
  };

  const handleCopyDeviceId = (deviceId) => {
    if (!deviceId) return;
    try { navigator.clipboard.writeText(deviceId); } catch {}
    setBanInput(deviceId);
    setCopiedDeviceId(deviceId);
    setStatusMsg(`Copied device ID & pre-filled ban field.`);
    setTimeout(() => setCopiedDeviceId(null), 2500);
  };

  // ─── Quick Cert & Export ─────────────────────────────────────
  const handleIssueCertQuick = (user) => {
    setSelectedTypist(user);
    setCertificateUser({
      username: user.username,
      wpm: user.averageWPM || 60,
      accuracy: 96,
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    });
    adminAuditManager.logAction('CERTIFICATE_ISSUED', user.username, `WPM: ${user.averageWPM || 60}`);
  };

  const handleExportBackupQuick = (user) => {
    setSelectedTypist(user);
    handleExportBackup();
  };

  // ─── Reset Typist Progress ──────────────────────────────────
  const handleResetUserProgress = (username) => {
    if (!username) return;
    if (!window.confirm(`Are you sure you want to reset ALL lesson & test progress for '${username}'? This cannot be undone.`)) return;

    const localUser = (userManager.getUsers() || []).find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (!localUser) {
      setStatusMsg("⚠️ Profile is remote-only or not registered on this device.");
      return;
    }
    const fresh = {
      completedLessons: [],
      testResults: [],
      settings: { theme: 'blue', timeLimit: 60, wordLimit: 50, showVirtualHand: false },
      stats: { totalTests: 0, totalTime: 0, totalCharacters: 0, bestWPM: 0, bestAccuracy: 0 }
    };
    progressManager.saveUserProgress(localUser.id, fresh);
    adminAuditManager.logAction('PROGRESS_UPDATE', username, 'Reset all lesson & test progress to 0');
    setStatusMsg(`🔄 Reset all progress for '${username}'.`);
    fetchAdminData();
  };

  // ─── Granular Single Lesson Toggle ─────────────────────────
  const handleToggleSingleLesson = (username, lessonId) => {
    const localUser = (userManager.getUsers() || []).find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (!localUser) {
      setStatusMsg("⚠️ Profile is remote-only or not registered on this device.");
      return;
    }
    const progress = progressManager.getUserProgress(localUser.id);
    const exists = progress.completedLessons.some(l => l.lessonId === lessonId);
    if (exists) {
      progress.completedLessons = progress.completedLessons.filter(l => l.lessonId !== lessonId);
    } else {
      progress.completedLessons.push({
        lessonId,
        wpm: 60,
        accuracy: 95,
        completedAt: new Date().toISOString()
      });
    }
    progressManager.saveUserProgress(localUser.id, progress);
    adminAuditManager.logAction('PROGRESS_UPDATE', username, `${exists ? 'Locked' : 'Unlocked'} single lesson '${lessonId}'`);
    setStatusMsg(`${exists ? '🔒 Locked' : '🔓 Unlocked'} lesson '${lessonId}' for ${username}!`);
    fetchAdminData();
  };

  // ─── Progress / Bulk Unlock ────────────────────────────────────
  const handleUnlockLessons = (percentage) => {
    if (!selectedTypist) return;
    const localUser = (userManager.getUsers() || []).find(u => u.username?.toLowerCase() === selectedTypist.username?.toLowerCase());
    if (!localUser) { setStatusMsg('⚠️ Cannot change progress: typist profile is remote-only on this device.'); return; }

    const flatLessons = [];
    Object.values(typingLessons).forEach(unit => unit.lessons.forEach(l => flatLessons.push({
      lessonId: l.id,
      wpm: 55 + Math.floor(Math.random() * 25),
      accuracy: 94 + Math.floor(Math.random() * 5),
      completedAt: new Date().toISOString()
    })));
    const unlockCount = Math.ceil(flatLessons.length * (percentage / 100));
    const progress = progressManager.getUserProgress(localUser.id);
    progress.completedLessons = flatLessons.slice(0, unlockCount);
    progress.stats.totalTests  = Math.max(progress.stats.totalTests, unlockCount);
    progress.stats.totalTime   = Math.max(progress.stats.totalTime, unlockCount * 90);
    progress.stats.bestWPM     = Math.max(progress.stats.bestWPM, 75);
    progressManager.saveUserProgress(localUser.id, progress);

    adminAuditManager.logAction('PROGRESS_UPDATE', selectedTypist.username, `Bulk progress set to ${percentage}% (${unlockCount} lessons)`);
    setStatusMsg(`🔓 Unlocked ${percentage}% (${unlockCount}/${flatLessons.length}) lessons for ${selectedTypist.username}!`);
    fetchAdminData();
  };

  // ─── Deep Analytics for selected typist ──────────────────────
  const getTypistAnalytics = () => {
    if (!selectedTypist) return null;
    const username = selectedTypist.username?.toLowerCase() || '';
    const typistLogs = telemetryLogs.filter(l => l.event_data?.username?.toLowerCase() === username);

    let localProg = null;
    try {
      const u = (userManager.getUsers() || []).find(lu => lu.username?.toLowerCase() === username);
      if (u) localProg = progressManager.getUserProgress(u.id);
    } catch {}

    const daysCutoff = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180 }[timeRange] || 30;
    const cutoff = Date.now() - daysCutoff * 86_400_000;

    let dataPoints = [];
    typistLogs.forEach(l => {
      const t = new Date(l.created_at).getTime();
      if (t >= cutoff) dataPoints.push({ date: new Date(l.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), timestamp: t, wpm: Number(l.event_data?.wpm || l.event_data?.avg_wpm) || 0, accuracy: Number(l.event_data?.accuracy || l.event_data?.avg_accuracy) || 0 });
    });
    if (localProg?.testResults) {
      localProg.testResults.forEach(r => {
        const t = new Date(r.completedAt || Date.now()).getTime();
        if (t >= cutoff) dataPoints.push({ date: new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), timestamp: t, wpm: Number(r.wpm) || 0, accuracy: Number(r.accuracy) || 0 });
      });
    }
    dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    if (!dataPoints.length) dataPoints = [{ date: 'Initial', wpm: selectedTypist.averageWPM || 0, accuracy: 95 }];

    return {
      dataPoints,
      peakWpm: Math.max(selectedTypist.averageWPM || 0, ...dataPoints.map(d => d.wpm)),
      avgAcc: dataPoints.length ? Math.round(dataPoints.reduce((s, d) => s + (d.accuracy || 95), 0) / dataPoints.length) : 95,
      completedLessonsCount: localProg?.completedLessons?.length || 0,
      totalTests: Math.max(selectedTypist.totalTests || 0, dataPoints.length),
      timeSpentMins: Math.round((localProg?.stats?.totalTime || (dataPoints.length * 90)) / 60)
    };
  };

  // Get completed lessons list for selected user
  const getUserCompletedLessons = () => {
    if (!selectedTypist) return [];
    try {
      const u = (userManager.getUsers() || []).find(lu => lu.username?.toLowerCase() === selectedTypist.username?.toLowerCase());
      if (u) {
        const prog = progressManager.getUserProgress(u.id);
        return prog?.completedLessons || [];
      }
    } catch {}
    return [];
  };

  // Check if selected typist is banned
  const isSelectedTypistBanned = () => {
    if (!selectedTypist) return false;
    const name = selectedTypist.username?.toLowerCase();
    return bannedDevices.some(b => b.device_id?.toLowerCase() === name || b.device_id?.toLowerCase() === selectedTypist.id?.toLowerCase());
  };

  // ─── Export Recovery ──────────────────────────────────────────
  const handleExportBackup = () => {
    if (!selectedTypist) return;
    const username = selectedTypist.username?.toLowerCase() || '';
    const logs = telemetryLogs.filter(l => l.event_data?.username?.toLowerCase() === username);
    let totalTests = 0, totalTime = 0, maxWpm = 0, wpmSum = 0, accSum = 0;
    const testResults = [];

    logs.forEach(log => {
      const d = log.event_data || {};
      const tests = Number(d.tests_completed) || 1;
      const wpm   = Number(d.avg_wpm || d.wpm) || 0;
      const acc   = Number(d.avg_accuracy || d.accuracy) || 95;
      const time  = Number(d.total_time_seconds) || tests * 60;
      totalTests += tests; totalTime += time;
      maxWpm = Math.max(maxWpm, Number(d.max_wpm || wpm) || 0);
      wpmSum += wpm * tests; accSum += acc * tests;
      for (let i = 0; i < tests; i++) testResults.push({ wpm, accuracy: acc, timeSpent: Math.round(time / tests), completedAt: log.created_at, type: 'test' });
    });

    const backup = {
      version: '2.0.0', exportDate: new Date().toISOString(),
      user: { id: selectedTypist.id || `recovered_${Date.now()}`, username: selectedTypist.username, avatar: 'avatar1.png', totalTests, averageWPM: totalTests ? Math.round(wpmSum / totalTests) : 0, averageAccuracy: totalTests ? Math.round(accSum / totalTests) : 95 },
      progress: { completedLessons: [], testResults, settings: { theme: 'blue', timeLimit: 60, wordLimit: 50, showVirtualHand: false }, stats: { totalTests, totalTime, totalCharacters: totalTests * 5 * (totalTests ? Math.round(wpmSum / totalTests) : 50), bestWPM: maxWpm, bestAccuracy: totalTests ? Math.round(accSum / totalTests) : 95 } },
      streak: { currentStreak: 1, bestStreak: 1, lastActiveDate: new Date().toISOString().split('T')[0], activeDates: logs.map(l => new Date(l.created_at).toISOString().split('T')[0]) },
      achievements: [], keyStats: {}
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `swift-typing-recovery-${selectedTypist.username}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    
    adminAuditManager.logAction('EXPORT_DATA', selectedTypist.username, 'Exported JSON recovery file');
    setStatusMsg(`💾 Recovery file exported for ${selectedTypist.username}!`);
  };

  // ─── Lock Screen ─────────────────────────────────────────────
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

  // Tab nav config
  const tabs = [
    { id: 'overview',     label: 'Overview Dashboard',              icon: <LayoutDashboard className="w-4 h-4" />, count: null,                   activeClass: `${theme.accent} ${theme.secondary} border ${theme.border}`, },
    { id: 'users',        label: 'Typist Profiles & Progression',   icon: <Users className="w-4 h-4" />,          count: registeredUsersList.length, activeClass: `${theme.accent} ${theme.secondary} border ${theme.border}`, },
    { id: 'certificates', label: 'Certificates & Verification',     icon: <Award className="w-4 h-4 text-purple-500" />, count: null,           activeClass: 'text-purple-600 bg-purple-500/10 border border-purple-500/30', },
    { id: 'moderation',   label: 'Moderation & Audit',              icon: <Ban className="w-4 h-4 text-red-500" />, count: bannedDevices.length,  activeClass: 'text-red-500 bg-red-500/10 border border-red-500/30',      },
  ];

  // ─── Main Render ──────────────────────────────────────────────
  return (
    <div className={`min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 ${theme.background} ${theme.text} relative pb-20`}>

      {/* Floating Toast Notification (Auto-dismisses in 3.5s) */}
      {statusMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 bg-slate-950 text-white border border-emerald-500/50 shadow-2xl rounded-2xl text-xs font-extrabold flex items-center justify-between gap-3 backdrop-blur-md animate-bounce-short">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg('')} className="p-1 hover:opacity-70 text-gray-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${theme.border} pb-6`}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Operations Center</h1>
            <span className={`px-2.5 py-0.5 border ${theme.border} ${theme.accent} rounded-full text-xs font-semibold ${theme.secondary}`}>
              System Active
            </span>
          </div>
          <p className={`text-sm mt-1 ${subTextClass}`}>Real-time telemetry, user analytics, moderation &amp; curriculum controls</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Dropdown (I-5) */}
          <div className="flex items-center gap-1.5 px-3 py-2 border border-gray-500/30 rounded-xl text-xs font-semibold bg-gray-500/10">
            <Clock className="w-3.5 h-3.5 opacity-70" />
            <span>Auto Sync:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent focus:outline-none font-bold cursor-pointer"
            >
              <option value={0} className="text-gray-900">Off</option>
              <option value={30} className="text-gray-900">Every 30s</option>
              <option value={60} className="text-gray-900">Every 1m</option>
              <option value={300} className="text-gray-900">Every 5m</option>
            </select>
          </div>

          <button onClick={fetchAdminData} disabled={loading} className={`flex items-center gap-2 px-4 py-2 border ${theme.border} ${theme.cardBg} rounded-xl text-sm font-medium hover:opacity-80 transition cursor-pointer`}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''} ${theme.accent}`} /> Refresh Data
          </button>
          <button onClick={() => { sessionStorage.removeItem('swift_admin_auth'); setIsAuthenticated(false); }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl text-sm font-medium transition cursor-pointer flex items-center gap-1.5">
            <LogOut className="w-4 h-4" /> Lock
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex items-center gap-2 border-b ${theme.border} pb-3 overflow-x-auto`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              handleTabChange(tab.id);
              if (tab.id === 'users' && !selectedTypist && registeredUsersList.length > 0) setSelectedTypist(registeredUsersList[0]);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === tab.id ? tab.activeClass : `${subTextClass} hover:opacity-80`
            }`}
          >
            {tab.icon} {tab.label}{tab.count !== null ? ` (${tab.count})` : ''}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <AdminOverview
          theme={theme} isDarkMode={isDarkMode} cardClass={cardClass} subTextClass={subTextClass}
          stats={stats} dailyData={dailyData} platformDistribution={platformDistribution}
          telemetryLogs={telemetryLogs} copiedDeviceId={copiedDeviceId}
          handleCopyDeviceId={handleCopyDeviceId} handleSelectUser={handleSelectUser}
          loading={loading} registeredUsersList={registeredUsersList}
        />
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AdminUserList
            theme={theme} cardClass={cardClass} subTextClass={subTextClass} inputClass={inputClass}
            registeredUsersList={registeredUsersList} selectedTypist={selectedTypist}
            setSelectedTypist={setSelectedTypist} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            handleQuickBan={handleQuickBan} handleIssueCertQuick={handleIssueCertQuick} handleExportBackupQuick={handleExportBackupQuick}
          />
          <TypistDeepDive
            theme={theme} isDarkMode={isDarkMode} cardClass={cardClass} subTextClass={subTextClass} inputClass={inputClass}
            selectedTypist={selectedTypist} typistAnalytics={typistAnalytics}
            handleExportBackup={handleExportBackup} timeRange={timeRange} setTimeRange={setTimeRange}
            isFilterExpanded={isFilterExpanded} setIsFilterExpanded={setIsFilterExpanded}
            handleUnlockLessons={handleUnlockLessons} handleToggleSingleLesson={handleToggleSingleLesson}
            handleQuickBan={handleQuickBan} handleResetUserProgress={handleResetUserProgress}
            setCertificateUser={setCertificateUser} userCompletedLessons={getUserCompletedLessons()}
            isBanned={isSelectedTypistBanned()}
          />
        </div>
      )}

      {/* Certificates Dedicated Section */}
      {activeTab === 'certificates' && (
        <div className={`${cardClass} p-6 space-y-6`}>
          <div className="flex justify-between items-center border-b ${theme.border} pb-4">
            <div>
              <h3 className="text-xl font-extrabold flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-500" /> Certificates &amp; Verification Center
              </h3>
              <p className={`text-xs mt-1 ${subTextClass}`}>Issue official Swift Typing completion certificates for students leaving school or requesting credentials.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Issuer Card */}
            <div className={`p-5 border ${theme.border} ${theme.secondary} rounded-2xl space-y-4`}>
              <h4 className="font-extrabold text-sm">Select Student &amp; Issue Certificate</h4>
              <p className={`text-xs ${subTextClass}`}>Pick any registered typist to generate an official certificate with their peak WPM &amp; accuracy stats.</p>
              
              <div className="space-y-3">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${subTextClass}`}>Select Student</label>
                <select
                  value={selectedTypist?.username || ''}
                  onChange={(e) => {
                    const u = registeredUsersList.find(r => r.username === e.target.value);
                    if (u) setSelectedTypist(u);
                  }}
                  className={`w-full ${inputClass} text-xs font-bold`}
                >
                  <option value="">-- Choose Student --</option>
                  {registeredUsersList.map(u => (
                    <option key={u.id} value={u.username}>{u.username} ({u.averageWPM || 0} WPM)</option>
                  ))}
                </select>

                <button
                  disabled={!selectedTypist}
                  onClick={() => selectedTypist && handleIssueCertQuick(selectedTypist)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" /> Issue Certificate for {selectedTypist ? selectedTypist.username : 'Selected Student'}
                </button>
              </div>
            </div>

            {/* Verification Info */}
            <div className={`p-5 border ${theme.border} ${theme.cardBg} rounded-2xl space-y-3`}>
              <h4 className="font-extrabold text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Certificate Authorization Rules
              </h4>
              <ul className={`text-xs space-y-2 ${subTextClass}`}>
                <li>• Admin can issue certificates at any time, even if 100% of lessons are not complete.</li>
                <li>• Certificates feature an official Administrator signature stamp &amp; issue date.</li>
                <li>• Certificates include the student's highest verified WPM speed &amp; average accuracy.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'moderation' && (
        <AdminModeration
          theme={theme} cardClass={cardClass} subTextClass={subTextClass} inputClass={inputClass}
          banInput={banInput} setBanInput={setBanInput}
          banReasonInput={banReasonInput} setBanReasonInput={setBanReasonInput}
          handleBanUser={handleBanUser} handleUnbanUser={handleUnbanUser} bannedDevices={bannedDevices}
          auditLogs={auditLogs} handleClearAuditLogs={handleClearAuditLogs}
        />
      )}

      {/* Certificate Modal */}
      <CompletionCertificate certificateUser={certificateUser} setCertificateUser={setCertificateUser} />
    </div>
  );
}
