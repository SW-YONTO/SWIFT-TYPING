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

  useEffect(() => {
    // Initialize anonymous telemetry tracking
    telemetry.init();

    // Check ban status
    const checkBan = async () => {
      const banned = await telemetry.checkBanStatus();
      if (banned) {
        setIsBanned(true);
        setBanReason(localStorage.getItem('swift_ban_reason') || 'No reason specified.');
      }
    };
    checkBan();

    // Try to load current user on app start
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

  const handleUserSelect = (user) => {
    setCurrentUser(user);
    if (user) {
      loadUserSettings(user.id);
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
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
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-left space-y-1">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Reason for Suspension:</p>
              <p className="text-sm text-slate-300 font-medium italic">"{banReason}"</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <a
                href={`mailto:support@swift-typing.com?subject=Unban%20Request%20-%20Device%20${telemetry.deviceId}&body=Dear%20Support,%0D%0A%0D%0AMy%20Device%20ID%20is:%20${telemetry.deviceId}%0D%0AMy%20Username%20is:%20${currentUser?.username || 'Unknown'}%0D%0A%0D%0APlease%20review%20my%20device%20ban.%20Reason:%20${banReason}`}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition shadow-lg shadow-red-600/20 text-center text-sm"
              >
                Request for Unban
              </a>
              <button
                onClick={() => {
                  if (confirm("WARNING: Deleting your account will clear all your lesson progress, stats, and achievements permanently from this device. Are you sure you want to proceed to create a new profile?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl border border-slate-700 hover:border-slate-600 transition text-sm cursor-pointer"
              >
                Delete Account & Start Fresh
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Device ID: {telemetry.deviceId}</p>
          </div>
        </div>
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
