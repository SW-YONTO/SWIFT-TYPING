import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { userManager, progressManager, adminAuditManager, banManager } from '../utils/storage';
import { typingLessons } from '../data/lessons';
import { Users, Ban, RefreshCw, LogOut, LayoutDashboard, CheckCircle, Clock, Award, X, Eye, ChevronDown, Trash2, AlertTriangle, Lock, Unlock, ShieldAlert, Info } from 'lucide-react';

import AdminLockScreen from '../components/admin/AdminLockScreen';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUserList from '../components/admin/AdminUserList';
import AdminModeration from '../components/admin/AdminModeration';
import TypistDeepDive from '../components/admin/TypistDeepDive';
import CompletionCertificate from '../components/admin/CompletionCertificate';
import CustomDropdown from '../components/common/CustomDropdown';

const DEFAULT_ADMIN_PASS = 'swiftadmin123';

export default function AdminPortal() {
  const { theme, isDarkMode } = useTheme();

  // ─── Auth ───────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // ─── Toast Notification (Floating) ──────────────────────────
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsgState] = useState(null);
  
  const [autoRefreshInterval, setAutoRefreshIntervalState] = useState(() => {
    const saved = localStorage.getItem('swift_admin_auto_refresh');
    return saved !== null ? Number(saved) : 30;
  });

  const setAutoRefreshInterval = (val) => {
    setAutoRefreshIntervalState(val);
    localStorage.setItem('swift_admin_auto_refresh', String(val));
  };
  
  const setStatusMsg = (msg) => {
    if (!msg) {
      setStatusMsgState(null);
      return;
    }
    const cleanMsg = msg.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    
    let type = 'info';
    if (msg.includes('Alert') || msg.includes('Failed') || msg.includes('banned') || msg.includes('suspended') || msg.includes('❌') || msg.includes('🚫') || msg.includes('⚠️')) type = 'error';
    else if (msg.includes('Unbanned') || msg.includes('Successfully') || msg.includes('exported') || msg.includes('✅') || msg.includes('💾')) type = 'success';
    else if (msg.includes('Deleted') || msg.includes('cleared') || msg.includes('🗑️') || msg.includes('🧹')) type = 'delete';
    else if (msg.includes('Unlocked') || msg.includes('🔓')) type = 'unlock';
    else if (msg.includes('Locked') || msg.includes('🔒')) type = 'lock';
    else if (msg.includes('Certificate') || msg.includes('🎓')) type = 'certificate';

    const toastObj = { text: cleanMsg, type };
    setStatusMsgState(toastObj);
    setTimeout(() => {
      setStatusMsgState(prev => prev?.text === cleanMsg ? null : prev);
    }, 3500);
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'delete': return <Trash2 className="w-5 h-5 text-red-400" />;
      case 'unlock': return <Unlock className="w-5 h-5 text-emerald-400" />;
      case 'lock': return <Lock className="w-5 h-5 text-amber-400" />;
      case 'certificate': return <Award className="w-5 h-5 text-purple-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  // ─── Overview data ───────────────────────────────────────────
  const [stats, setStats] = useState({
    registeredUsersCount: 0, uniqueUsers: 0,
    electronRatio: '0%', electronCount: 0, webCount: 0,
    avgWpm: 0, maxWpm: 0, totalTestsCompleted: 0, totalTimeSpentMinutes: 0
  });
  const [dailyData, setDailyData] = useState([]);
  const [platformDistribution, setPlatformDistribution] = useState([]);
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // ─── Users / Moderation / Audit Logs / Appeals / Modal ────────
  const [registeredUsersList, setRegisteredUsersList] = useState([]);
  const [bannedDevices, setBannedDevices] = useState([]);
  const [whitelistedAnomalies, setWhitelistedAnomalies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('swift_whitelisted_anomalies') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [unbanAppeals, setUnbanAppeals] = useState([]);
  const [banInput, setBanInput] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('Abuse of service or leaderboard cheating.');
  const [pendingBanUser, setPendingBanUser] = useState(null);
  const [pendingDeleteTargets, setPendingDeleteTargets] = useState(null);
  const [customBanReason, setCustomBanReason] = useState('Abuse of service or leaderboard cheating.');
  const [copiedDeviceId, setCopiedDeviceId] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // ─── Navigation / UI ─────────────────────────────────────────
  const getInitialTab = () => {
    const h = window.location.hash;
    if (h.includes('#users') || h.includes('/users')) return 'users';
    if (h.includes('#moderation') || h.includes('/moderation')) return 'moderation';
    if (h.includes('#certificates') || h.includes('/certificates')) return 'certificates';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [selectedTypist, setSelectedTypist] = useState(null);
  const [timeRange, setTimeRange] = useState('1D');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [certificateUser, setCertificateUser] = useState(null);
  const [showCertDropdown, setShowCertDropdown] = useState(false);

  // ─── Theme styling helpers ───────────────────────────
  const cardClass = `${theme.cardBg} ${theme.border} border shadow-xl rounded-3xl transition-all duration-300`;
  const subTextClass = theme.textSecondary || 'text-gray-400';
  const inputClass = `${theme.inputBg} ${theme.border} border ${theme.text} rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`;

  // ─── Routing helpers ─────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = `#/admin#${tab}`;
  };

  const handleSelectUser = (userOrName) => {
    if (!userOrName) return;
    const targetObj = typeof userOrName === 'string'
      ? registeredUsersList.find(u => u.username?.toLowerCase() === userOrName.toLowerCase()) || { username: userOrName, id: userOrName }
      : userOrName;

    setActiveTab('users');
    setSelectedTypist(targetObj);
    const uParam = encodeURIComponent(targetObj.username || targetObj.id || '');
    window.history.replaceState(null, '', `#/admin#users?user=${uParam}`);
  };

  useEffect(() => {
    const handleUrlStateChange = () => {
      const href = window.location.href;
      let targetName = null;

      const paramMatch = href.match(/[?&]user=([^&]+)/) || href.match(/#users\?([^&]+)/) || href.match(/#users\/([^&?]+)/);
      if (paramMatch && paramMatch[1]) {
        targetName = decodeURIComponent(paramMatch[1]).toLowerCase().trim();
      }

      if (targetName && registeredUsersList.length > 0) {
        const found = registeredUsersList.find(u =>
          u.username?.toLowerCase().trim() === targetName ||
          u.id?.toLowerCase().trim() === targetName
        );
        if (found) {
          setSelectedTypist(found);
          setActiveTab('users');
        }
      }
    };
    window.addEventListener('hashchange', handleUrlStateChange);
    window.addEventListener('popstate', handleUrlStateChange);
    if (registeredUsersList.length > 0) handleUrlStateChange();
    return () => {
      window.removeEventListener('hashchange', handleUrlStateChange);
      window.removeEventListener('popstate', handleUrlStateChange);
    };
  }, [registeredUsersList]);

  // Load audit logs & local ban list on mount
  useEffect(() => {
    setAuditLogs(adminAuditManager.getLogs());
    setBannedDevices(banManager.getBanned());
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

    const isElectron = !!(window.electron || window.electronAPI || window.process?.type === 'renderer' || navigator.userAgent.includes('Electron'));
    let supabaseLogs = [], remoteError = null;

    try {
      if (navigator.onLine) {
        let { data: masterTelemetry } = await supabase
          .from('user_telemetry').select('*').order('updated_at', { ascending: false }).limit(500);

        if (!masterTelemetry || masterTelemetry.length === 0) {
          const res1 = await supabase.from('user_progress_summary').select('*').order('updated_at', { ascending: false }).limit(500);
          const res2 = await supabase.from('user_daily_telemetry').select('*').order('updated_at', { ascending: false }).limit(500);
          masterTelemetry = res1.data || res2.data || [];
        }

        const logsMap = new Map();

        if (masterTelemetry) {
          masterTelemetry.forEach(d => {
            const key = d.id || `${d.device_id}_${d.username}`;
            logsMap.set(key, {
              id: key,
              device_id: d.device_id,
              username: d.username,
              client_type: d.client_type,
              os_platform: d.os_platform,
              app_version: d.app_version,
              event_type: 'User Progress Sync',
              created_at: d.updated_at || d.last_seen,
              tests_completed: d.total_tests || d.tests_completed || 0,
              max_wpm: d.best_wpm || d.max_wpm || 0,
              avg_wpm: d.average_wpm || d.avg_wpm || 0,
              avg_accuracy: d.average_accuracy || d.avg_accuracy || 90,
              total_time_seconds: d.total_time_seconds || 0,
              completed_lessons: d.completed_lessons || [],
              test_results: d.test_results || [],
              event_data: {
                username: d.username,
                tests_completed: d.total_tests || d.tests_completed || 0,
                max_wpm: d.best_wpm || d.max_wpm || 0,
                avg_wpm: d.average_wpm || d.avg_wpm || 0,
                avg_accuracy: d.average_accuracy || d.avg_accuracy || 90,
                total_time_seconds: d.total_time_seconds || 0
              }
            });
          });
        }

        supabaseLogs = Array.from(logsMap.values()).sort((a, b) => new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime());
      }
    } catch (err) { remoteError = err.message; }

    if (remoteError) setStatusMsg(`⚠️ Database Sync Alert: Cannot connect to Supabase (${remoteError}).`);
    setTelemetryLogs(supabaseLogs);

    const electronCount = supabaseLogs.filter(l => l.client_type === 'electron').length + (isElectron ? 1 : 0);
    const webCount = supabaseLogs.filter(l => l.client_type === 'web').length + (!isElectron ? 1 : 0);
    const totalClients = electronCount + webCount;
    const electronRatioStr = totalClients ? Math.round((electronCount / totalClients) * 100) + '%' : (isElectron ? '100%' : '0%');

    let remoteWpms = [], remoteMaxWpm = 0, remoteTests = 0;
    supabaseLogs.forEach(e => {
      if (e.tests_completed) remoteTests += Number(e.tests_completed) || 0;
      if (e.avg_wpm) remoteWpms.push(Number(e.avg_wpm));
      if (e.max_wpm) remoteMaxWpm = Math.max(remoteMaxWpm, Number(e.max_wpm));
    });

    setStats({
      uniqueUsers: new Set(supabaseLogs.map(l => l.device_id)).size || 0,
      registeredUsersCount: supabaseLogs.length,
      electronRatio: electronRatioStr, electronCount, webCount,
      avgWpm: remoteWpms.length ? Math.round(remoteWpms.reduce((a, b) => a + b, 0) / remoteWpms.length) : 0,
      maxWpm: remoteMaxWpm,
      totalTestsCompleted: remoteTests,
      totalTimeSpentMinutes: Math.round(supabaseLogs.reduce((acc, l) => acc + (l.total_time_seconds || 0), 0) / 60)
    });

    // Daily Activity chart
    const dailyMap = {};
    if (supabaseLogs.length) {
      supabaseLogs.forEach(l => { const d = l.created_at?.split('T')[0] || 'Today'; dailyMap[d] = (dailyMap[d] || 0) + 1; });
    } else {
      dailyMap[new Date().toISOString().split('T')[0]] = 0;
    }
    setDailyData(Object.keys(dailyMap).sort().slice(-7).map(day => ({ date: day.substring(5), activity: dailyMap[day] })));
    setPlatformDistribution([
      { name: 'Web Version', value: webCount || 1, color: '#3b82f6' },
      { name: 'Desktop', value: electronCount || (isElectron ? 1 : 0), color: '#a855f7' }
    ]);

    // Merged typist list (populated exclusively from Supabase user_telemetry)
    const typistMap = {};

    supabaseLogs.forEach(log => {
      const uname = (log.username || '').trim();
      const devId = (log.device_id || '').trim();
      const logTime = log.created_at || log.last_seen;

      const normName = uname && uname !== 'Anonymous Typist' ? uname.toLowerCase() : null;

      let existingKey = null;
      if (normName && typistMap[normName]) {
        existingKey = normName;
      } else if (devId) {
        existingKey = Object.keys(typistMap).find(k => typistMap[k].id?.toLowerCase() === devId.toLowerCase()) || null;
      }

      const wpm = Number(log.avg_wpm || log.max_wpm) || 0;
      const bestWpm = Number(log.max_wpm) || wpm;
      const acc = Number(log.avg_accuracy) || 90;
      const tests = Number(log.tests_completed) || 1;
      const timeSec = Number(log.total_time_seconds) || 0;

      if (existingKey) {
        if (!typistMap[existingKey].averageWPM) typistMap[existingKey].averageWPM = wpm;
        typistMap[existingKey].averageAccuracy = typistMap[existingKey].averageAccuracy || acc;
        typistMap[existingKey].bestWPM = Math.max(typistMap[existingKey].bestWPM || 0, bestWpm);
        typistMap[existingKey].totalTimeSeconds = Math.max(typistMap[existingKey].totalTimeSeconds || 0, timeSec);
        typistMap[existingKey].completedLessons = log.completed_lessons || typistMap[existingKey].completedLessons || [];
        typistMap[existingKey].testResults = log.test_results || typistMap[existingKey].testResults || [];
        typistMap[existingKey].totalTests = Math.max(typistMap[existingKey].totalTests || 0, tests);
        if (logTime && (!typistMap[existingKey].lastSeenTime || new Date(logTime).getTime() > new Date(typistMap[existingKey].lastSeenTime).getTime())) {
          typistMap[existingKey].lastSeenTime = logTime;
        }
      } else {
        const key = normName || (devId ? devId.toLowerCase() : `anon_${Math.random()}`);
        const displayName = (uname && uname !== 'Anonymous Typist') ? uname : (devId ? `Device (${devId.substring(0, 10)})` : 'Typist');
        typistMap[key] = {
          id: log.id || devId || key,
          username: displayName,
          averageWPM: wpm,
          averageAccuracy: acc,
          bestWPM: bestWpm,
          totalTimeSeconds: timeSec,
          completedLessons: log.completed_lessons || [],
          testResults: log.test_results || [],
          totalTests: tests,
          clientType: log.client_type === 'electron' ? 'Desktop' : 'Web',
          lastSeenTime: logTime || new Date().toISOString()
        };
      }
    });
    setRegisteredUsersList(Object.values(typistMap));
    setRegisteredUsersList(Object.values(typistMap));

    // Merge Supabase bans with local banManager bans
    const localBans = banManager.getBanned() || [];
    let mergedBans = [...localBans];

    try {
      if (navigator.onLine) {
        const { data: banData } = await supabase.from('user_moderation').select('*').eq('is_banned', true);
        if (banData && banData.length > 0) {
          banData.forEach(remoteItem => {
            if (!mergedBans.some(b => b.device_id?.toLowerCase() === remoteItem.device_id?.toLowerCase())) {
              mergedBans.push(remoteItem);
              banManager.ban(remoteItem.device_id, remoteItem.ban_reason || 'Supabase ban');
            }
          });
        }
      }
    } catch (e) { }

    // Fetch unban appeals from Supabase & localStorage with 30-day auto cleanup
    let appealsMap = {};
    const nowMs = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    try {
      const localAppeals = JSON.parse(localStorage.getItem('swift_unban_appeals') || '[]');
      localAppeals.forEach(a => {
        const key = a.id || `${a.device_id}_${a.username}_${a.created_at || ''}`;
        const createdAtMs = a.created_at ? new Date(a.created_at).getTime() : nowMs;
        if (nowMs - createdAtMs < thirtyDaysMs) {
          appealsMap[key] = { ...a, id: key, is_read: a.is_read || false };
        }
      });
    } catch (e) { }

    try {
      if (navigator.onLine) {
        const { data: remoteAppeals } = await supabase
          .from('unban_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (remoteAppeals && remoteAppeals.length > 0) {
          const expiredIds = [];
          remoteAppeals.forEach(ra => {
            const key = ra.id || `${ra.device_id}_${ra.username}_${ra.created_at || ''}`;
            const createdAtMs = ra.created_at ? new Date(ra.created_at).getTime() : nowMs;

            if (nowMs - createdAtMs > thirtyDaysMs) {
              if (ra.id) expiredIds.push(ra.id);
            } else {
              appealsMap[key] = { ...ra, id: key, is_read: ra.is_read || false };
            }
          });

          if (expiredIds.length > 0) {
            supabase.from('unban_requests').delete().in('id', expiredIds).then(() => { });
          }
        }
      }
    } catch (e) { }

    const mergedAppeals = Object.values(appealsMap);
    localStorage.setItem('swift_unban_appeals', JSON.stringify(mergedAppeals));
    setUnbanAppeals(mergedAppeals);
    setBannedDevices(mergedBans);
    setAuditLogs(adminAuditManager.getLogs());
    setLoading(false);
  }

  // ─── Moderation (100% Reliable Local + Synced Ban & Unban) ──────
  const handleBanUser = async () => {
    const target = banInput.trim();
    if (!target) return;
    const reason = banReasonInput.trim() || 'Abuse of service or leaderboard cheating.';

    // 1. Update local storage instantly
    const updatedLocal = banManager.ban(target, reason);
    setBannedDevices(updatedLocal);
    adminAuditManager.logAction('USER_BAN', target, `Reason: ${reason}`);
    setBanInput('');
    setStatusMsg(`🚫 Account/Device '${target}' banned successfully!`);

    // 2. Sync to Supabase background
    try {
      if (navigator.onLine) {
        await supabase.from('user_moderation').upsert({
          device_id: target,
          is_banned: true,
          ban_reason: reason
        });
      }
    } catch (e) { }
  };

  const handleQuickBan = async (user) => {
    const username = user.username || '';
    const deviceId = user.deviceId || user.device_id || username || user.id;
    if (!username && !deviceId) return;

    const alreadyBanned = banManager.isBanned(username) || banManager.isBanned(deviceId) || bannedDevices.some(b => b.device_id?.toLowerCase() === username.toLowerCase() || b.device_id?.toLowerCase() === deviceId.toLowerCase());

    if (alreadyBanned) {
      handleUnbanUser(username || deviceId);
    } else {
      setCustomBanReason('Abuse of service or leaderboard cheating.');
      setPendingBanUser(user);
    }
  };

  const confirmCustomBan = async () => {
    if (!pendingBanUser) return;
    const user = pendingBanUser;
    const username = user.username || '';
    const deviceId = user.deviceId || user.device_id || username || user.id;
    const reason = customBanReason.trim() || 'Abuse of service or leaderboard cheating.';

    // Local updates
    if (username) banManager.ban(username, reason);
    if (deviceId) banManager.ban(deviceId, reason);

    const updated = banManager.getBanned();
    setBannedDevices(updated);
    adminAuditManager.logAction('USER_BAN', username || deviceId, `Reason: ${reason}`);
    setStatusMsg(`🚫 Account '${username || deviceId}' suspended! Reason: ${reason}`);

    // Supabase cloud sync
    try {
      if (navigator.onLine) {
        const records = [];
        if (username) records.push({ device_id: username, is_banned: true, ban_reason: reason });
        if (deviceId && deviceId !== username) records.push({ device_id: deviceId, is_banned: true, ban_reason: reason });
        await supabase.from('user_moderation').upsert(records);
      }
    } catch (e) { }

    setPendingBanUser(null);
  };

  const handleUnbanUser = async (identifier) => {
    if (!identifier) return;

    // Local updates
    const updatedLocal = banManager.unban(identifier);
    setBannedDevices(updatedLocal);
    adminAuditManager.logAction('USER_UNBAN', identifier, 'Admin unbanned account');
    setStatusMsg(`✅ Unbanned '${identifier}'.`);

    // Supabase cloud sync — delete by exact match AND case-insensitive match
    try {
      if (navigator.onLine) {
        // Delete where device_id matches the identifier (could be username or device id)
        await supabase.from('user_moderation').delete().eq('device_id', identifier);
        // Also try lowercase match in case ban was stored with different casing
        await supabase.from('user_moderation').delete().eq('device_id', identifier.toLowerCase());
      }
    } catch (e) { }
  };

  const handleDeleteAppeal = async (appealItem) => {
    if (!appealItem) return;
    const targetId = appealItem.id || appealItem.device_id;
    const devId = appealItem.device_id;

    try {
      const local = JSON.parse(localStorage.getItem('swift_unban_appeals') || '[]');
      const filtered = local.filter(a => a.id !== targetId && a.device_id !== devId);
      localStorage.setItem('swift_unban_appeals', JSON.stringify(filtered));
      setUnbanAppeals(prev => prev.filter(a => a.id !== targetId && a.device_id !== devId));

      if (navigator.onLine) {
        if (appealItem.id) await supabase.from('unban_requests').delete().eq('id', appealItem.id);
        if (devId) await supabase.from('unban_requests').delete().eq('device_id', devId);
      }
      setStatusMsg(`🗑️ Deleted appeal record for '${appealItem.username || devId}'.`);
    } catch (e) { }
  };

  const handleToggleReadAppeal = async (appealItem) => {
    if (!appealItem) return;
    try {
      const newReadState = !appealItem.is_read;
      const updatedList = unbanAppeals.map(a =>
        (a.id === appealItem.id || a.device_id === appealItem.device_id) ? { ...a, is_read: newReadState } : a
      );
      setUnbanAppeals(updatedList);
      localStorage.setItem('swift_unban_appeals', JSON.stringify(updatedList));

      if (navigator.onLine && appealItem.id) {
        await supabase.from('unban_requests').update({ is_read: newReadState }).eq('id', appealItem.id);
      }
    } catch (e) { }
  };

  const handleClearAuditLogs = () => {
    adminAuditManager.clearLogs();
    setAuditLogs([]);
    setStatusMsg('🧹 Admin audit log cleared.');
  };

  const handleDeleteUser = (userOrUsers) => {
    const targets = Array.isArray(userOrUsers) ? userOrUsers : [userOrUsers];
    if (targets.length === 0) return;
    setPendingDeleteTargets(targets);
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteTargets || pendingDeleteTargets.length === 0) return;
    const targets = pendingDeleteTargets;
    setPendingDeleteTargets(null);

    try {
      setLoading(true);

      // 1. Remove from Local Storage (typing_app_users & user progress)
      let localUsers = JSON.parse(localStorage.getItem('typing_app_users') || '[]');
      targets.forEach(t => {
        const username = typeof t === 'string' ? t : t.username;
        const id = typeof t === 'object' ? t.id : null;

        localUsers = localUsers.filter(u =>
          (username ? u.username?.toLowerCase() !== username.toLowerCase() : true) &&
          (id ? u.id !== id : true)
        );

        if (id) localStorage.removeItem(`typing_app_user_progress_${id}`);
        const found = (JSON.parse(localStorage.getItem('typing_app_users') || '[]')).find(u => u.username?.toLowerCase() === username?.toLowerCase());
        if (found?.id) localStorage.removeItem(`typing_app_user_progress_${found.id}`);
      });
      localStorage.setItem('typing_app_users', JSON.stringify(localUsers));

      const currentUserId = localStorage.getItem('typing_app_current_user');
      if (currentUserId && !localUsers.some(u => u.id === currentUserId)) {
        if (localUsers.length > 0) {
          localStorage.setItem('typing_app_current_user', localUsers[0].id);
        } else {
          localStorage.removeItem('typing_app_current_user');
        }
      }

      // 2. Remove from Supabase Cloud Database tables
      for (const t of targets) {
        const username = typeof t === 'string' ? t : t.username;
        const deviceId = typeof t === 'object' ? (t.deviceId || t.device_id || t.id) : t;

        adminAuditManager.logAction('USER_DELETE', username || deviceId || 'unknown', 'Deleted user profile from local & cloud');

        if (navigator.onLine) {
          if (username) {
            await supabase.from('user_telemetry').delete().ilike('username', username);
            await supabase.from('user_telemetry').delete().ilike('id', `%${username}%`);
            await supabase.from('user_moderation').delete().ilike('device_id', username);
            await supabase.from('issued_certificates').delete().ilike('username', username);
            await supabase.from('unban_requests').delete().ilike('username', username);
          }
          if (deviceId && deviceId.toLowerCase() !== username?.toLowerCase()) {
            await supabase.from('user_telemetry').delete().ilike('device_id', deviceId);
            await supabase.from('user_telemetry').delete().ilike('id', `%${deviceId}%`);
            await supabase.from('user_moderation').delete().ilike('device_id', deviceId);
            await supabase.from('unban_requests').delete().ilike('device_id', deviceId);
          }
        }
      }

      setStatusMsg(`🗑️ Successfully deleted ${targets.length} typist(s) from local & cloud database!`);
      if (selectedTypist && targets.some(t => (t.username || t)?.toLowerCase() === selectedTypist.username?.toLowerCase())) {
        setSelectedTypist(null);
      }
      await fetchAdminData();
    } catch (e) {
      console.error('Failed to delete user records:', e);
      setStatusMsg(`❌ Failed to delete user records: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDeviceId = (deviceId) => {
    if (!deviceId) return;
    try { navigator.clipboard.writeText(deviceId); } catch { }
    setBanInput(deviceId);
    setCopiedDeviceId(deviceId);
    setStatusMsg(`Copied device ID & pre-filled ban field.`);
    setTimeout(() => setCopiedDeviceId(null), 2500);
  };

  // ─── Quick Cert & Export ─────────────────────────────────────
  const handlePreviewCert = (user) => {
    const certWpm = user.averageWPM || 60;
    const certDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    let totalTime = 14400; // default 4 hours
    try {
      const localUser = (userManager.getUsers() || []).find(u => u.username?.toLowerCase() === user.username?.toLowerCase());
      if (localUser) {
        const prog = progressManager.getUserProgress(localUser.id);
        if (prog?.stats?.totalTime) {
          totalTime = prog.stats.totalTime;
        }
      }
    } catch (e) { }

    setSelectedTypist(user);
    setCertificateUser({
      username: user.username,
      wpm: certWpm,
      totalTime: totalTime,
      date: certDate,
      isPreview: true
    });
    setStatusMsg(`👁️ Previewing certificate for "${user.username}" (${certWpm} WPM).`);
  };

  const handleIssueCertQuick = async (user) => {
    const certWpm = user.averageWPM || 60;
    const certDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    let totalTime = 14400; // default 4 hours
    try {
      const localUser = (userManager.getUsers() || []).find(u => u.username?.toLowerCase() === user.username?.toLowerCase());
      if (localUser) {
        const prog = progressManager.getUserProgress(localUser.id);
        if (prog?.stats?.totalTime) {
          totalTime = prog.stats.totalTime;
        }
      }
    } catch (e) { }

    setSelectedTypist(user);
    adminAuditManager.logAction('CERTIFICATE_ISSUED', user.username, `WPM: ${certWpm}`);

    // Sync to Supabase so client gets toast notification
    try {
      if (navigator.onLine) {
        await supabase.from('issued_certificates').insert({
          username: user.username,
          device_id: user.deviceId || user.device_id || '',
          wpm: certWpm,
          total_time: totalTime,
          issued_by: 'Administrator'
        });
      }
    } catch (e) { }
    setStatusMsg(`🎓 Certificate issued to "${user.username}" (${certWpm} WPM).`);
  };

  const handleExportBackupQuick = (user) => {
    setSelectedTypist(user);
    handleExportBackup();
  };

  const handleToggleAnomalyWhitelist = (username) => {
    if (!username) return;
    const name = username.toLowerCase();
    setWhitelistedAnomalies(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      localStorage.setItem('swift_whitelisted_anomalies', JSON.stringify(next));
      return next;
    });
    setStatusMsg(`Updated anomaly flag for "${username}".`);
  };

  // Helper to ensure a local profile & progress record exists for any typist (local or remote)
  const getOrCreateLocalUser = (username) => {
    if (!username) return null;
    let users = userManager.getUsers() || [];
    let found = users.find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (!found) {
      found = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        username: username,
        createdAt: new Date().toISOString(),
        averageWPM: selectedTypist?.averageWPM || 0,
        totalTests: selectedTypist?.totalTests || 0
      };
      users.push(found);
      localStorage.setItem('typing_app_users', JSON.stringify(users));
    }
    return found;
  };

  // ─── Reset Typist Progress ──────────────────────────────────
  const handleResetUserProgress = (username) => {
    if (!username) return;
    if (!window.confirm(`Are you sure you want to reset ALL lesson & test progress for '${username}'? This cannot be undone.`)) return;

    const localUser = getOrCreateLocalUser(username);
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
    if (!username) return;
    const localUser = getOrCreateLocalUser(username);
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
  const handleUnlockLessons = async (percentage) => {
    if (!selectedTypist || !selectedTypist.username) return;
    const localUser = getOrCreateLocalUser(selectedTypist.username);

    const flatLessons = [];
    Object.values(typingLessons).forEach(unit => unit.lessons.forEach(l => {
      flatLessons.push(l.id);
    }));

    const unlockCount = Math.ceil(flatLessons.length * (percentage / 100));
    const progress = progressManager.getUserProgress(localUser.id);

    // Preserve existing real stats (do NOT overwrite WPM, accuracy, or practice time with random numbers)
    const existingWpm = progress.stats?.bestWPM || selectedTypist.averageWPM || 60;
    const existingAcc = selectedTypist.avgAcc || 95;

    const newCompletedLessons = flatLessons.slice(0, unlockCount).map(lessonId => {
      const found = (progress.completedLessons || []).find(c => c.lessonId === lessonId);
      if (found) {
        return found; // KEEP ORIGINAL UNTOUCHED (genuine WPM, accuracy, completedAt)!
      }
      return {
        lessonId,
        wpm: 0,
        accuracy: 0,
        unlockedByAdmin: true,
        completedAt: new Date().toISOString()
      };
    });

    progress.completedLessons = newCompletedLessons;
    progressManager.saveUserProgress(localUser.id, progress);

    // Sync to master Supabase table user_telemetry so client receives realtime push
    try {
      if (navigator.onLine) {
        const cleanUser = selectedTypist.username.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const rowId = `${selectedTypist.deviceId || 'dev_' + selectedTypist.id}_${cleanUser}`;
        const payload = {
          id: rowId,
          device_id: selectedTypist.deviceId || selectedTypist.id || 'admin_pushed',
          user_id: localUser.id,
          username: selectedTypist.username,
          client_type: selectedTypist.clientType?.toLowerCase() || 'web',
          os_platform: 'web',
          app_version: '3.26.9',
          average_wpm: existingWpm,
          best_wpm: existingWpm,
          average_accuracy: existingAcc,
          lessons_completed_count: newCompletedLessons.length,
          total_time_seconds: progress.stats?.totalTime || (unlockCount * 90),
          total_tests: Math.max(progress.stats?.totalTests || 0, unlockCount),
          completed_lessons: newCompletedLessons,
          test_results: progress.testResults || [],
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('⚡ [ADMIN PUSH PROGRESS]: Upserting master user_telemetry payload for', selectedTypist.username, payload);

        await supabase.from('user_telemetry').upsert([payload], { onConflict: 'id' });
      }
    } catch (e) {
      console.error('Failed to push admin progress update to Supabase user_telemetry:', e);
    }

    adminAuditManager.logAction('PROGRESS_UPDATE', selectedTypist.username, `Bulk progress set to ${percentage}% (${unlockCount} lessons)`);
    setStatusMsg(`🔓 Unlocked ${percentage}% (${unlockCount}/${flatLessons.length}) lessons for ${selectedTypist.username}!`);
    await fetchAdminData();
  };

  // Helper to reliably find typist progress profile from local storage or user manager
  const getTypistProgress = () => {
    if (!selectedTypist || !selectedTypist.username) return null;
    const targetName = selectedTypist.username.trim().toLowerCase();
    const targetId = (selectedTypist.id || '').trim().toLowerCase();

    // 1. Check current logged-in user
    try {
      const curUser = userManager.getCurrentUser();
      if (curUser && (curUser.username?.trim().toLowerCase() === targetName || curUser.id?.trim().toLowerCase() === targetId)) {
        const prog = progressManager.getUserProgress(curUser.id);
        if (prog && (prog.completedLessons?.length > 0 || prog.testResults?.length > 0 || prog.stats?.totalTime > 0)) {
          console.log('💾 [ADMIN PROGRESS MATCH]: Found via currentUser', curUser.id, prog);
          return prog;
        }
      }
    } catch { }

    // 2. Check userManager registered users
    try {
      const users = userManager.getUsers() || [];
      const matchedUser = users.find(u => u.username?.trim().toLowerCase() === targetName || u.id?.trim().toLowerCase() === targetId);
      if (matchedUser) {
        const prog = progressManager.getUserProgress(matchedUser.id);
        if (prog && (prog.completedLessons?.length > 0 || prog.testResults?.length > 0 || prog.stats?.totalTime > 0)) {
          console.log('💾 [ADMIN PROGRESS MATCH]: Found via userManager matchedUser', matchedUser.id, prog);
          return prog;
        }
      }
    } catch { }

    // 3. Search all localStorage progress keys ONLY for keys specifically matching target user ID or username
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('typing_app_user_progress_')) {
          try {
            const keyUserId = k.replace('typing_app_user_progress_', '').trim().toLowerCase();
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (keyUserId === targetId || keyUserId === targetName || parsed.username?.trim().toLowerCase() === targetName) {
                console.log('💾 [ADMIN PROGRESS MATCH]: Found via localStorage key scan', k, parsed);
                return parsed;
              }
            }
          } catch { }
        }
      }
    } catch { }

    // 4. Return selectedTypist remote user_telemetry progress if available
    if (selectedTypist && (selectedTypist.completedLessons || selectedTypist.testResults)) {
      return {
        completedLessons: selectedTypist.completedLessons || [],
        testResults: selectedTypist.testResults || [],
        stats: {
          bestWPM: selectedTypist.bestWPM || selectedTypist.averageWPM || 0,
          bestAccuracy: selectedTypist.averageAccuracy || 90,
          totalTime: selectedTypist.totalTimeSeconds || 0,
          totalTests: selectedTypist.totalTests || 0
        }
      };
    }

    console.warn('⚠️ [ADMIN PROGRESS]: No matching progress object found for target typist:', targetName);
    return null;
  };

  // ─── Deep Analytics for selected typist ──────────────────────
  const getTypistAnalytics = () => {
    if (!selectedTypist || !selectedTypist.username) return null;
    const username = selectedTypist.username.trim().toLowerCase();
    const typistLogs = telemetryLogs.filter(l => (l.username || l.event_data?.username || l.device_id || '').trim().toLowerCase() === username);

    const localProg = getTypistProgress();

    const rawMap = {};
    const processItem = (t, wpm, acc) => {
      if (!t || isNaN(t)) return;
      if (wpm <= 0) return; // Skip 0 WPM unlocked placeholders so graph line stays accurate!

      const dateObj = new Date(t);
      const dateKey = timeRange === '1D' 
        ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : dateObj.toISOString().split('T')[0];
      const dateStr = timeRange === '1D'
        ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!rawMap[dateKey]) {
        rawMap[dateKey] = {
          timestamp: t,
          dateStr: dateStr,
          wpmSum: 0,
          accSum: 0,
          count: 0
        };
      }
      rawMap[dateKey].wpmSum += wpm;
      rawMap[dateKey].accSum += (acc > 0 ? acc : 90);
      rawMap[dateKey].count += 1;
    };

    // Load from telemetry logs
    typistLogs.forEach(l => {
      const t = new Date(l.created_at || l.last_seen || Date.now()).getTime();
      const wpm = Number(l.avg_wpm || l.wpm || l.max_wpm || l.event_data?.wpm || l.event_data?.avg_wpm) || 0;
      const acc = Number(l.avg_accuracy || l.event_data?.accuracy || l.event_data?.avg_accuracy) || 0;
      processItem(t, wpm, acc);
    });

    // Load from cloud test_results
    const cloudTests = selectedTypist?.test_results || selectedTypist?.testResults || [];
    if (Array.isArray(cloudTests)) {
      cloudTests.forEach(r => {
        const t = new Date(r.completedAt || r.date || Date.now()).getTime();
        const wpm = Number(r.wpm) || 0;
        const acc = Number(r.accuracy) || 0;
        processItem(t, wpm, acc);
      });
    }

    // Load from localProg testResults
    if (localProg?.testResults && Array.isArray(localProg.testResults)) {
      localProg.testResults.forEach(r => {
        const t = new Date(r.completedAt || r.date || Date.now()).getTime();
        const wpm = Number(r.wpm) || 0;
        const acc = Number(r.accuracy) || 0;
        processItem(t, wpm, acc);
      });
    }

    // Load from completed lessons (cloud + local) - Filter out 0 WPM unlocked placeholders
    const allCompleted = [
      ...(selectedTypist?.completed_lessons || []),
      ...(selectedTypist?.completedLessons || []),
      ...(localProg?.completedLessons || [])
    ];

    allCompleted.forEach((l, idx) => {
      if (typeof l === 'object' && l !== null) {
        const wpm = Number(l.wpm) || Number(l.grossWPM) || 0;
        const acc = Number(l.accuracy) || 0;
        if (wpm > 0) {
          const t = new Date(l.completedAt || (Date.now() - (allCompleted.length - idx) * 3600000)).getTime();
          processItem(t, wpm, acc);
        }
      }
    });

    let dataPoints = Object.values(rawMap).map(item => ({
      date: item.dateStr,
      timestamp: item.timestamp,
      wpm: Math.round(item.wpmSum / item.count),
      accuracy: Math.round(item.accSum / item.count)
    })).sort((a, b) => a.timestamp - b.timestamp);

    // Apply cutoff filter based on timeRange
    const daysCutoff = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180 }[timeRange] || 30;
    const cutoff = Date.now() - daysCutoff * 86_400_000;
    let filteredPoints = dataPoints.filter(p => p.timestamp >= cutoff);
    let finalDataPoints = filteredPoints.length > 0 ? filteredPoints : dataPoints;

    // Ensure Recharts receives at least 2 data points so AreaChart connects a line
    if (finalDataPoints.length === 1) {
      const p1 = finalDataPoints[0];
      const startWpm = Math.max(5, Math.round(p1.wpm * 0.75));
      const startAcc = Math.max(70, p1.accuracy - 3);
      const prevDateObj = new Date(p1.timestamp - 86400000);
      const prevDateStr = prevDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      finalDataPoints = [
        { date: prevDateStr, timestamp: p1.timestamp - 86400000, wpm: startWpm, accuracy: startAcc },
        p1
      ];
    } else if (finalDataPoints.length === 0) {
      const currentWpm = selectedTypist.averageWPM || 20;
      const currentAcc = selectedTypist.averageAccuracy || 90;
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const yesterdayObj = new Date(Date.now() - 86400000);
      const yesterdayStr = yesterdayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      finalDataPoints = [
        { date: yesterdayStr, timestamp: Date.now() - 86400000, wpm: Math.max(5, Math.round(currentWpm * 0.75)), accuracy: Math.max(70, currentAcc - 5) },
        { date: todayStr, timestamp: Date.now(), wpm: currentWpm, accuracy: currentAcc }
      ];
    }

    const validWpms = finalDataPoints.map(d => d.wpm).filter(w => w > 0);
    const avgWpmVal = selectedTypist.averageWPM || (validWpms.length
      ? Math.round(validWpms.reduce((a, b) => a + b, 0) / validWpms.length)
      : 0);

    // Extract peak WPM across local stats, telemetry logs, and graph data points
    let logMaxWpm = 0;
    let logAvgAcc = 0;
    typistLogs.forEach(l => {
      const m = Number(l.max_wpm || l.event_data?.max_wpm || l.event_data?.best_wpm || l.event_data?.wpm || l.wpm) || 0;
      if (m > logMaxWpm) logMaxWpm = m;
      const acc = Number(l.avg_accuracy || l.event_data?.avg_accuracy || l.event_data?.accuracy) || 0;
      if (acc > logAvgAcc) logAvgAcc = acc;
    });

    const peakWpmVal = Math.max(
      selectedTypist.averageWPM || 0,
      localProg?.stats?.bestWPM || 0,
      logMaxWpm,
      ...finalDataPoints.map(d => d.wpm)
    );

    const validAccs = finalDataPoints.map(d => d.accuracy).filter(a => a > 0);
    const avgAccVal = selectedTypist.averageAccuracy || logAvgAcc || (validAccs.length
      ? Math.round(validAccs.reduce((a, b) => a + b, 0) / validAccs.length)
      : (localProg?.stats?.bestAccuracy || 90));

    const userLessons = getUserCompletedLessons();
    const completedLessonsCount = userLessons.length;

    // Time spent calculation (from localProg stats, test results, or telemetry logs)
    let totalTimeSec = localProg?.stats?.totalTime || 0;
    if (!totalTimeSec && localProg?.testResults) {
      totalTimeSec = localProg.testResults.reduce((s, r) => s + (r.timeSpent || 0), 0);
    }
    let logMaxTime = 0;
    typistLogs.forEach(l => {
      const sec = Number(l.total_time_seconds || l.event_data?.total_time_seconds || l.event_data?.time_spent) || 0;
      if (sec > logMaxTime) logMaxTime = sec;
    });
    totalTimeSec = Math.max(totalTimeSec, logMaxTime);

    const timeSpentMins = Math.round(totalTimeSec / 60) || (localProg?.stats?.totalTime ? Math.round(localProg.stats.totalTime / 60) : 0);

    console.log('📊 [ADMIN DEEP DIVE ANALYTICS]: Calculated Stats', {
      selectedTypist: selectedTypist.username,
      completedLessonsCount,
      timeSpentMins,
      peakWpmVal,
      avgWpmVal,
      avgAccVal,
      dataPointsCount: finalDataPoints.length
    });

    return {
      dataPoints: finalDataPoints.length > 0 ? finalDataPoints : [{ date: 'Initial', wpm: selectedTypist.averageWPM || 0, accuracy: 95 }],
      avgWpm: avgWpmVal,
      peakWpm: peakWpmVal,
      avgAcc: avgAccVal,
      completedLessonsCount,
      totalTests: Math.max(selectedTypist.totalTests || 0, localProg?.testResults?.length || 0, finalDataPoints.length),
      timeSpentMins
    };
  };

  // Get completed lessons list for selected user
  const getUserCompletedLessons = () => {
    if (!selectedTypist || !selectedTypist.username) return [];
    const localProg = getTypistProgress();
    if (localProg?.completedLessons && localProg.completedLessons.length > 0) {
      return localProg.completedLessons;
    }
    if (selectedTypist.completedLessons && Array.isArray(selectedTypist.completedLessons) && selectedTypist.completedLessons.length > 0) {
      return selectedTypist.completedLessons;
    }
    const username = selectedTypist.username.trim().toLowerCase();
    const typistLogs = telemetryLogs.filter(l => (l.username || l.event_data?.username || '').trim().toLowerCase() === username);
    for (const log of typistLogs) {
      if (log.completed_lessons && Array.isArray(log.completed_lessons) && log.completed_lessons.length > 0) {
        return log.completed_lessons.map(item => typeof item === 'string' ? { lessonId: item, wpm: log.max_wpm || 60, accuracy: 95 } : item);
      }
    }
    return [];
  };

  // Check if selected typist is banned
  const isSelectedTypistBanned = () => {
    if (!selectedTypist) return false;
    const name = selectedTypist.username?.toLowerCase();
    return banManager.isBanned(name) || bannedDevices.some(b => b.device_id?.toLowerCase() === name || b.device_id?.toLowerCase() === selectedTypist.id?.toLowerCase());
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
      const wpm = Number(d.avg_wpm || d.wpm) || 0;
      const acc = Number(d.avg_accuracy || d.accuracy) || 95;
      const time = Number(d.total_time_seconds) || tests * 60;
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
    { id: 'overview', label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, count: null, activeClass: `${theme.accent} ${theme.secondary} border ${theme.border}`, },
    { id: 'users', label: 'Typist Profiles & Progression', icon: <Users className="w-4 h-4" />, count: registeredUsersList.length, activeClass: `${theme.accent} ${theme.secondary} border ${theme.border}`, },
    { id: 'certificates', label: 'Certificates & Verification', icon: <Award className="w-4 h-4 text-purple-500" />, count: null, activeClass: 'text-purple-600 bg-purple-500/10 border border-purple-500/30', },
    { id: 'moderation', label: 'Moderation & Audit', icon: <Ban className="w-4 h-4 text-red-500" />, count: bannedDevices.length, activeClass: 'text-red-500 bg-red-500/10 border border-red-500/30', },
  ];

  // ─── Main Render ──────────────────────────────────────────────
  return (
    <div className={`min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 ${theme.background} ${theme.text} relative pb-20`}>

      {/* Floating Toast Notification (Theme-Matched, Icon-based) */}
      {statusMsg && (
        <div className="fixed bottom-6 right-6 z-[99999] max-w-sm w-full animate-bounce-short pointer-events-auto">
          <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-2xl flex items-start gap-3.5 transition-all duration-300 ${theme?.cardBg || 'bg-slate-900'} ${theme?.border || 'border-slate-800'} ${theme?.text || 'text-white'}`}>
            <div className={`p-2.5 rounded-xl ${theme?.secondary || 'bg-slate-800'} shrink-0 mt-0.5 flex items-center justify-center`}>
              {getToastIcon(statusMsg.type)}
            </div>
            <div className="flex-1 pr-1 space-y-0.5 mt-1">
              <h4 className={`text-xs font-black uppercase tracking-wider ${theme?.accent || 'text-emerald-400'}`}>
                {statusMsg.type === 'error' ? 'System Alert' : 
                 statusMsg.type === 'success' ? 'Success' : 
                 statusMsg.type === 'delete' ? 'Deleted' : 
                 statusMsg.type === 'unlock' ? 'Unlocked' : 
                 statusMsg.type === 'lock' ? 'Locked' : 
                 statusMsg.type === 'certificate' ? 'Certificate' : 'Notification'}
              </h4>
              <p className={`text-xs font-medium leading-relaxed ${theme?.textSecondary || 'text-slate-300'}`}>
                {statusMsg.text}
              </p>
            </div>
            <button 
              onClick={() => setStatusMsgState(null)} 
              className={`p-1 rounded-lg ${theme?.textSecondary || 'text-slate-400'} hover:${theme?.text || 'text-white'} hover:${theme?.secondary || 'bg-slate-800'} transition cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
          <CustomDropdown
            icon={Clock}
            value={autoRefreshInterval}
            onChange={(val) => setAutoRefreshInterval(Number(val))}
            theme={theme}
            options={[
              { value: 0, label: 'Auto Sync: Off' },
              { value: 30, label: 'Auto Sync: Every 30s' },
              { value: 60, label: 'Auto Sync: Every 1m' },
              { value: 300, label: 'Auto Sync: Every 5m' },
            ]}
          />

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
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === tab.id ? tab.activeClass : `${subTextClass} hover:opacity-80`
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
          whitelistedAnomalies={whitelistedAnomalies}
        />
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AdminUserList
            theme={theme} cardClass={cardClass} subTextClass={subTextClass} inputClass={inputClass}
            registeredUsersList={registeredUsersList} selectedTypist={selectedTypist}
            setSelectedTypist={handleSelectUser} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            handleQuickBan={handleQuickBan} handleIssueCertQuick={handleIssueCertQuick} handleExportBackupQuick={handleExportBackupQuick}
            handleDeleteUser={handleDeleteUser}
            bannedDevices={bannedDevices}
            whitelistedAnomalies={whitelistedAnomalies}
          />
          <TypistDeepDive
            theme={theme} isDarkMode={isDarkMode} cardClass={cardClass} subTextClass={subTextClass} inputClass={inputClass}
            selectedTypist={selectedTypist} typistAnalytics={typistAnalytics}
            handleExportBackup={handleExportBackup} timeRange={timeRange} setTimeRange={setTimeRange}
            isFilterExpanded={isFilterExpanded} setIsFilterExpanded={setIsFilterExpanded}
            handleUnlockLessons={handleUnlockLessons} handleToggleSingleLesson={handleToggleSingleLesson}
            handleQuickBan={handleQuickBan} handleResetUserProgress={handleResetUserProgress}
            setCertificateUser={setCertificateUser} userCompletedLessons={getUserCompletedLessons()}
            isBanned={isSelectedTypistBanned()} handleIssueCertQuick={handleIssueCertQuick}
            whitelistedAnomalies={whitelistedAnomalies}
            handleToggleAnomalyWhitelist={handleToggleAnomalyWhitelist}
          />
        </div>
      )}

      {/* Certificates Dedicated Section */}
      {activeTab === 'certificates' && (
        <div className={`${cardClass} p-6 space-y-6`}>
          <div className={`flex justify-between items-center border-b ${theme.border} pb-4`}>
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

                <div className="relative pt-1">
                  <button
                    disabled={!selectedTypist}
                    onClick={() => setShowCertDropdown(!showCertDropdown)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" /> Certificate Actions <ChevronDown className="w-4 h-4" />
                  </button>

                  {showCertDropdown && selectedTypist && (
                    <div className="absolute left-0 right-0 mt-2 z-20 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-1">
                      <button
                        onClick={() => {
                          handlePreviewCert(selectedTypist);
                          setShowCertDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-cyan-400" /> Preview Layout (View Only)
                      </button>
                      <button
                        onClick={() => {
                          handleIssueCertQuick(selectedTypist);
                          setShowCertDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-purple-400" /> Issue &amp; Send Notification
                      </button>
                    </div>
                  )}
                </div>
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
          unbanAppeals={unbanAppeals} handleDismissAppeal={handleDeleteAppeal}
          handleDeleteAppeal={handleDeleteAppeal} handleToggleReadAppeal={handleToggleReadAppeal}
        />
      )}

      {/* ─── Custom React Ban Reason Modal ─── */}
      {pendingBanUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className={`${cardClass} p-6 max-w-md w-full space-y-5 shadow-2xl relative border-red-500/40`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 font-extrabold text-[10px] rounded-md uppercase">
                  Account Suspension
                </span>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-500" /> Suspend Typist Account
                </h3>
                <p className={`text-xs ${subTextClass}`}>
                  Target: <strong className="text-white font-mono">{pendingBanUser.username || pendingBanUser.id}</strong>
                </p>
              </div>
              <button
                onClick={() => setPendingBanUser(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${subTextClass}`}>
                Reason for Suspension
              </label>
              <textarea
                value={customBanReason}
                onChange={(e) => setCustomBanReason(e.target.value)}
                rows={3}
                className={`w-full ${inputClass} text-xs leading-relaxed`}
                placeholder="Enter specific reason for banning this user..."
              />

              {/* Quick Reason Presets */}
              <div className="space-y-1.5 pt-1">
                <p className={`text-[9px] font-bold uppercase tracking-wider ${subTextClass}`}>Quick Reason Presets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Abuse of service or leaderboard cheating.',
                    'Bot automation or high-WPM script detected.',
                    'Inappropriate username or profanity.',
                    'Multiple account violation.'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomBanReason(preset)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition text-left cursor-pointer ${customBanReason === preset
                        ? 'bg-red-500/20 text-red-400 border-red-500/50 font-bold'
                        : `${theme.secondary} ${subTextClass} border-gray-500/20 hover:opacity-80`
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setPendingBanUser(null)}
                className={`py-2.5 px-4 ${theme.secondary} ${theme.text} font-bold rounded-xl text-xs transition cursor-pointer border ${theme.border}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmCustomBan}
                className="py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-red-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" /> Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Custom Delete Confirmation Modal ─── */}
      {pendingDeleteTargets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`${cardClass} p-6 max-w-md w-full space-y-5 shadow-2xl relative border-red-500/40 text-center`}>

            {/* Close Button */}
            <button
              onClick={() => setPendingDeleteTargets(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Trash Icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 animate-pulse">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 font-extrabold text-[10px] rounded-md uppercase tracking-wider">
                Permanent Data Deletion
              </span>
              <h3 className="text-xl font-extrabold text-white">Delete Typist Profile?</h3>
              <p className={`text-xs ${subTextClass} leading-relaxed`}>
                Are you sure you want to permanently delete:
              </p>
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 font-mono font-bold text-sm break-all">
                {pendingDeleteTargets.map(t => typeof t === 'string' ? t : (t.username || t.id)).join(', ')}
              </div>
              <p className={`text-[11px] ${subTextClass} italic pt-1`}>
                This will permanently remove all local browser progress and cloud database telemetry records. This action cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setPendingDeleteTargets(null)}
                className={`py-2.5 px-4 ${theme.secondary} ${theme.text} font-bold rounded-xl text-xs transition cursor-pointer border ${theme.border}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" /> Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <CompletionCertificate certificateUser={certificateUser} setCertificateUser={setCertificateUser} />
    </div>
  );
}
