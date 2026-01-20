import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Trophy, Zap, Settings, User, LogOut, ChevronDown, Palette, Gamepad2 } from 'lucide-react';
import { themes } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';

const Navigation = ({ currentUser, onLogout, onThemeChange, currentTheme }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [themeFocusIndex, setThemeFocusIndex] = useState(-1);
  const { theme, themeKey, changeTheme } = useTheme();
  const location = useLocation();
  
  // Refs for dropdown elements
  const themeDropdownRef = useRef(null);
  const themeButtonRef = useRef(null);
  const userDropdownRef = useRef(null);
  const userButtonRef = useRef(null);

  // Get theme items for keyboard navigation
  const lightThemes = Object.entries(themes).filter(([_, t]) => t.mode === 'light');
  const darkThemes = Object.entries(themes).filter(([_, t]) => t.mode === 'dark');
  const allThemes = [...lightThemes, ...darkThemes];

  // Handle keyboard navigation for theme dropdown
  const handleThemeKeyDown = useCallback((e) => {
    if (!showThemeDropdown) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setThemeFocusIndex(prev => Math.min(prev + 1, allThemes.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setThemeFocusIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (themeFocusIndex >= 0 && themeFocusIndex < allThemes.length) {
          const [key] = allThemes[themeFocusIndex];
          changeTheme(key);
          onThemeChange && onThemeChange(key);
          setShowThemeDropdown(false);
          setThemeFocusIndex(-1);
          themeButtonRef.current?.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowThemeDropdown(false);
        setThemeFocusIndex(-1);
        themeButtonRef.current?.focus();
        break;
      case 'Tab':
        setShowThemeDropdown(false);
        setThemeFocusIndex(-1);
        break;
    }
  }, [showThemeDropdown, themeFocusIndex, allThemes, changeTheme, onThemeChange]);

  // Handle keyboard navigation for user dropdown
  const handleUserKeyDown = useCallback((e) => {
    if (!showUserDropdown) return;
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        setShowUserDropdown(false);
        onLogout();
        break;
      case 'Escape':
        e.preventDefault();
        setShowUserDropdown(false);
        userButtonRef.current?.focus();
        break;
      case 'Tab':
        setShowUserDropdown(false);
        break;
    }
  }, [showUserDropdown, onLogout]);

  // Reset focus index when dropdown opens/closes
  useEffect(() => {
    if (showThemeDropdown) {
      setThemeFocusIndex(0);
    } else {
      setThemeFocusIndex(-1);
    }
  }, [showThemeDropdown]);

  // Add keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      handleThemeKeyDown(e);
      handleUserKeyDown(e);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleThemeKeyDown, handleUserKeyDown]);

  const navItems = [
    { id: 'lessons', label: 'Typing Lessons', icon: Book, path: '/lessons' },
    { id: 'courses', label: 'Typing Courses', icon: Trophy, path: '/courses' },
    { id: 'games', label: 'Typing Games', icon: Gamepad2, path: '/games' },
    { id: 'tests', label: 'Typing Tests', icon: Zap, path: '/tests' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];


  return (
    <nav className={`${theme.navbar} shadow-lg ${theme.navBorder} border-b sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Zap className={`w-6 h-6 ${theme.accent} drop-shadow-sm`} />
            <span className={`text-lg font-bold ${theme.navText}`}>Swift Typing</span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? `${theme.primary} text-white`
                      : `${theme.navText} hover:${theme.secondary}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Theme and User */}
          <div className="flex items-center space-x-3">
            {/* Theme Selector */}
            <div className="relative">
              <button
                ref={themeButtonRef}
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className={`flex items-center space-x-1 ${theme.navText} hover:${theme.accent} transition-colors text-sm px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-label="Select theme"
                aria-expanded={showThemeDropdown}
                aria-haspopup="listbox"
              >
                <Palette className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showThemeDropdown && (
                <div 
                  ref={themeDropdownRef}
                  className={`absolute right-0 mt-2 w-48 ${theme.surface} rounded-lg shadow-lg ${theme.border} border z-50`}
                  role="listbox"
                  aria-label="Theme selection"
                >
                  <div className="py-2">
                    <div className={`px-3 py-2 text-xs font-semibold ${theme.textSecondary} uppercase tracking-wide`}>
                      Light Themes
                    </div>
                    {lightThemes.map(([key, themeData], index) => (
                      <button
                        key={key}
                        onClick={() => {
                          changeTheme(key);
                          onThemeChange && onThemeChange(key);
                          setShowThemeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${theme.text} hover:${theme.secondary} transition-colors flex items-center justify-between ${
                          themeFocusIndex === index ? 'ring-2 ring-blue-500 ring-inset bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        role="option"
                        aria-selected={themeKey === key}
                      >
                        <span>{themeData.name}</span>
                        {themeKey === key && <div className={`w-3 h-3 rounded-full ${themeData.primary}`}></div>}
                      </button>
                    ))}
                    
                    <div className={`px-3 py-2 text-xs font-semibold ${theme.textSecondary} uppercase tracking-wide mt-2 border-t ${theme.border}`}>
                      Dark Themes
                    </div>
                    {darkThemes.map(([key, themeData], index) => (
                      <button
                        key={key}
                        onClick={() => {
                          changeTheme(key);
                          onThemeChange && onThemeChange(key);
                          setShowThemeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${theme.text} hover:${theme.secondary} transition-colors flex items-center justify-between ${
                          themeFocusIndex === (lightThemes.length + index) ? 'ring-2 ring-blue-500 ring-inset bg-blue-900/20' : ''
                        }`}
                        role="option"
                        aria-selected={themeKey === key}
                      >
                        <span>{themeData.name}</span>
                        {themeKey === key && <div className={`w-3 h-3 rounded-full ${themeData.primary}`}></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                ref={userButtonRef}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center space-x-2 ${theme.navText} text-sm px-2 py-1 rounded hover:${theme.secondary} transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-label={`User menu for ${currentUser?.username || 'user'}`}
                aria-expanded={showUserDropdown}
                aria-haspopup="menu"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">{currentUser?.username}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showUserDropdown && (
                <div className={`absolute right-0 mt-2 w-48 ${theme.surface} rounded-lg shadow-lg ${theme.border} border z-50`}>
                  <div className="py-2">
                    <div className={`px-3 py-2 ${theme.text} border-b ${theme.border}`}>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{currentUser?.username}</span>
                      </div>
                      <div className={`text-xs ${theme.textSecondary} mt-1`}>
                        Best WPM: {currentUser?.averageWPM || 0} • Tests: {currentUser?.totalTests || 0}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className={`w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2`}
                      aria-label="Logout and switch user"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Switch User / Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
                    isActive
                      ? `${theme.primary} text-white`
                      : `${theme.navText} hover:${theme.secondary}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label.replace('Typing ', '')}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Click outside to close dropdowns */}
      {(showUserDropdown || showThemeDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserDropdown(false);
            setShowThemeDropdown(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navigation;
