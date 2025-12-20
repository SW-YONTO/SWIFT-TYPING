import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { userManager, progressManager } from './utils/storage';
import { ThemeProvider } from './contexts/ThemeContext';
import UserManager from './components/UserManager';
import Navigation from './components/Navigation';
import TypingLessons from './pages/TypingLessons';
import TypingCourses from './pages/TypingCourses';
import TypingTests from './pages/TypingTests';
import TypingGames from './pages/TypingGames';
import Settings from './pages/Settings';
import Results from './pages/Results';
import About from './pages/About';
import Features from './pages/Features';
import Pricing from './pages/Pricing';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('lessons');
  const [userSettings, setUserSettings] = useState({
    timeLimit: 60,
    wordLimit: 50,
    showVirtualHand: false
  });

  useEffect(() => {
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

  const handleThemeChange = (newTheme) => {
    // Theme is now handled by ThemeContext, but we still update user settings
    if (currentUser) {
      const updatedSettings = { ...userSettings, theme: newTheme };
      progressManager.updateSettings(currentUser.id, updatedSettings);
    }
  };

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
                  />
                } 
              />
              <Route path="/results" element={<Results />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
