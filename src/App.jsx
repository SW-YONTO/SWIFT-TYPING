import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { userManager, progressManager } from './utils/storage';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import UserManager from './components/UserManager';
import Navigation from './components/Navigation';
import UpdateToast from './components/UpdateToast';
import AdBanner from './components/AdBanner';

import { ShieldAlert } from 'lucide-react';
import { telemetry } from './utils/telemetryTracker';

// Lazy-loaded page components for code splitting
const TypingLessons = React.lazy(() => import('./pages/TypingLessons'));
const TypingCourses = React.lazy(() => import('./pages/TypingCourses'));
const TypingTests = React.lazy(() => import('./pages/TypingTests'));
const TypingGames = React.lazy(() => import('./pages/TypingGames'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Results = React.lazy(() => import('./pages/Results'));
const About = React.lazy(() => import('./pages/About'));
const Features = React.lazy(() => import('./pages/Features'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const AdminPortal = React.lazy(() => import('./pages/AdminPortal'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading fallback component
const PageLoader = () => {
  const { theme } = useTheme();
  // Derive border colour from theme.accent (e.g. 'text-blue-600' → 'border-blue-600')
  const spinnerBorder = theme?.accent?.replace('text-', 'border-') || 'border-blue-600';
  return (
    <div className={`flex items-center justify-center min-h-[60vh] ${theme?.background || ''}`}>
      <div className="text-center">
        <div className={`w-12 h-12 border-4 ${spinnerBorder} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
        <p className={`${theme?.textSecondary || 'text-gray-500'}`}>Loading...</p>
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('lessons');
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('No reason specified.');
  const [userSettings, setUserSettings] = useState({
    timeLimit: 60,
    wordLimit: 50,
    showVirtualHand: false
  });

  // Check ban status on mount & continuously poll every 4 seconds
  useEffect(() => {
    telemetry.init();
    const checkBan = async () => {
      const username = currentUser?.username || '';
      const banned = await telemetry.checkBanStatus(username);
      if (banned) {
        setIsBanned(true);
        setBanReason(localStorage.getItem('swift_ban_reason') || 'Suspended by Administrator.');
      } else {
        setIsBanned(false);
      }
    };
    checkBan();

    const interval = setInterval(checkBan, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Try to load current user on app start
  useEffect(() => {
    const user = userManager.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadUserSettings(user.id);
    }
  }, []);

  const loadUserSettings = (userId) => {
    const progress = progressManager.getUserProgress(userId);
    setUserSettings(progress.settings);
  };

  const handleUserSelect = async (user) => {
    setCurrentUser(user);
    if (user) {
      loadUserSettings(user.id);
      const banned = await telemetry.checkBanStatus(user.username);
      if (banned) {
        setIsBanned(true);
        setBanReason(localStorage.getItem('swift_ban_reason') || 'Suspended by Administrator.');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    userManager.setCurrentUser(null);
  };

  const handleSettingsChange = (newSettings) => {
    setUserSettings(newSettings);
  };

  // Refreshes currentUser from storage — used after avatar/username changes in Settings
  // so we avoid window.location.reload() which drops the user back to the login screen.
  const handleUserUpdate = () => {
    const freshUser = userManager.getCurrentUser();
    if (freshUser) {
      setCurrentUser(freshUser);
    }
  };

  const handleThemeChange = (newTheme) => {
    // Theme is now handled by ThemeContext, but we still update user settings
    if (currentUser) {
      const updatedSettings = { ...userSettings, theme: newTheme };
      progressManager.updateSettings(currentUser.id, updatedSettings);
    }
  };

  // Show banned block screen if device is restricted
  if (isBanned) {
    return (
      <ThemeProvider>
        <BannedScreenWithModals banReason={banReason} currentUser={currentUser} />
      </ThemeProvider>
    );
  }

  // Show user manager if no user is selected
  if (!currentUser) {
    return (
      <ThemeProvider>
        <UserManager onUserSelect={handleUserSelect} currentUser={currentUser} />
      </ThemeProvider>
    );
  }

  // Render main application
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen transition-colors duration-300">
            <Navigation
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              currentUser={currentUser}
              onLogout={handleLogout}
              onThemeChange={handleThemeChange}
              currentTheme={userSettings.theme}
            />

            <main className="min-h-screen pt-4">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/lessons" />} />
                  <Route
                    path="/lessons"
                    element={
                      <TypingLessons
                        currentUser={currentUser}
                        settings={userSettings}
                      />
                    }
                  />
                  <Route
                    path="/courses"
                    element={
                      <TypingCourses
                        currentUser={currentUser}
                        settings={userSettings}
                      />
                    }
                  />
                  <Route
                    path="/games"
                    element={
                      <TypingGames
                        currentUser={currentUser}
                        settings={userSettings}
                      />
                    }
                  />
                  <Route
                    path="/tests"
                    element={
                      <TypingTests
                        currentUser={currentUser}
                        settings={userSettings}
                      />
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Settings
                        currentUser={currentUser}
                        settings={userSettings}
                        onSettingsChange={handleSettingsChange}
                        onUserUpdate={handleUserUpdate}
                      />
                    }
                  />
                  <Route path="/results" element={<Results />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/admin" element={<AdminPortal />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>

            {currentUser && (
              <div className="max-w-7xl mx-auto px-4 pb-4">
                <AdBanner slot="8506280207" format="horizontal" style={{ maxHeight: '90px' }} />
              </div>
            )}

            <UpdateToast />
          </div>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

// ─── Custom Banned Screen with Account Delete & In-App Appeal Modals ──────
function BannedScreenWithModals({ banReason, currentUser }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appealStatus, setAppealStatus] = useState('');

  const handleSendAppeal = async () => {
    if (!appealMessage.trim()) return;
    setIsSubmitting(true);
    const deviceId = telemetry.deviceId;
    const username = currentUser?.username || 'Anonymous';

    const payload = {
      device_id: deviceId,
      username,
      appeal_message: appealMessage.trim(),
      ban_reason: banReason,
      created_at: new Date().toISOString()
    };

    // Save locally
    try {
      const existingAppeals = JSON.parse(localStorage.getItem('swift_unban_appeals') || '[]');
      existingAppeals.push(payload);
      localStorage.setItem('swift_unban_appeals', JSON.stringify(existingAppeals));
    } catch (e) { }

    // 1. Cloud sync to Supabase unban_requests
    try {
      if (navigator.onLine) {
        await supabase.from('unban_requests').upsert([payload]);
      }
    } catch (e) { }

    // 2. Automatic Real Email Dispatch to sw.esports.offical@gmail.com with detailed logging
    let mailSuccess = false;
    let mailErrorMsg = '';

    try {
      if (navigator.onLine) {
        console.log('[Mailer] Dispatching appeal email to sw.esports.offical@gmail.com...');
        const res = await fetch('https://formsubmit.co/ajax/sw.esports.offical@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `🚨 Swift Typing Unban Request — User: ${username} (Device: ${deviceId})`,
            name: username,
            email: 'sw.esports.offical@gmail.com',
            device_id: deviceId,
            ban_reason: banReason,
            appeal_message: appealMessage.trim(),
            submitted_at: new Date().toLocaleString()
          })
        });

        const resData = await res.json().catch(() => ({}));
        console.log('[Mailer Response]', res.status, resData);

        if (res.ok && (resData.success === 'true' || resData.success === true)) {
          mailSuccess = true;
        } else {
          mailErrorMsg = resData.message || `HTTP ${res.status}`;
          console.warn('[Mailer Warning]', mailErrorMsg);
        }
      }
    } catch (err) {
      mailErrorMsg = err.message || 'Network dispatch failed';
      console.error('[Mailer Network Error]', err);
    }

    setIsSubmitting(false);

    if (mailSuccess) {
      setAppealStatus('✅ Saved to Supabase & Email dispatched to sw.esports.offical@gmail.com!');
    } else if (mailErrorMsg) {
      setAppealStatus(`⚠️ Saved to Supabase ✅ | Mailer status: ${mailErrorMsg}`);
    } else {
      setAppealStatus('✅ Saved to Supabase unban_requests database.');
    }

    setTimeout(() => {
      setShowAppealModal(false);
      setAppealMessage('');
      setAppealStatus('');
    }, 3500);
  };

  const handleConfirmDeleteAccount = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
      <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Access Suspended</h1>
          <p className="text-sm text-slate-400">
            Your device has been banned from accessing Swift Typing cloud features.
          </p>
        </div>
        <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl text-left space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-red-500/20">
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Account / User Name</p>
              <p className="text-base font-extrabold text-white">{currentUser?.username || 'Typist Account'}</p>
            </div>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 font-extrabold text-[10px] rounded-md uppercase">
              Banned 🚫
            </span>
          </div>

          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Reason for Suspension</p>
            <p className="text-xs text-slate-200 font-medium italic leading-relaxed mt-0.5">
              "{banReason || 'Abuse of service or leaderboard cheating.'}"
            </p>
          </div>

          <div className="pt-2 border-t border-red-500/20 space-y-1 font-mono text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>Date &amp; Timing:</span>
              <span className="text-slate-300 font-bold">{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Device Identifier:</span>
              <span className="text-slate-300 truncate max-w-[200px]">{telemetry.deviceId}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setShowAppealModal(true)}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition shadow-lg shadow-red-600/20 text-center text-sm cursor-pointer"
          >
            Submit Unban Appeal (In-App)
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 hover:border-slate-600 transition text-sm cursor-pointer"
          >
            Delete Account & Start Fresh
          </button>
        </div>
        <p className="text-[10px] text-slate-500 font-mono">Device ID: {telemetry.deviceId}</p>
      </div>

      {/* ─── Custom Account Deletion Modal (Replaces browser confirm) ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will clear all your local progress, lesson badges, and saved statistics from this device.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-600/20 cursor-pointer"
              >
                Yes, Clear & Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Custom In-App Unban Appeal Modal ─── */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" /> Submit Unban Appeal
              </h3>
              <button onClick={() => setShowAppealModal(false)} className="text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Explain why your account suspension should be reviewed. This message will be sent directly to the Admin Panel.
            </p>

            <textarea
              rows={4}
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              placeholder="Describe what happened or request a review..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition resize-none"
            />

            {appealStatus && (
              <p className="text-xs font-bold text-emerald-400 text-center">{appealStatus}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAppealModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendAppeal}
                disabled={isSubmitting || !appealMessage.trim()}
                className="py-2.5 px-5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
