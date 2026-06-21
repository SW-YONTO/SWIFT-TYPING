import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Download, 
  X, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw, 
  AlertCircle, 
  Info,
  Sparkles,
  WifiOff
} from 'lucide-react';

const UpdateToast = () => {
  const { theme, isDarkMode } = useTheme();
  const [show, setShow] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, checking, available, downloading, downloaded, error, not-available
  const [progress, setProgress] = useState(0);
  const [versionInfo, setVersionInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const isElectron = window.electronAPI !== undefined;

  useEffect(() => {
    // Handle network online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!isElectron) return;

    // Set up listeners for electron-updater events
    const unsubscribeChecking = window.electronAPI.onCheckingForUpdate(() => {
      setStatus('checking');
    });

    const unsubscribeAvailable = window.electronAPI.onUpdateAvailable((info) => {
      setVersionInfo(info);
      setStatus('available');
      setShow(true); // Open the toast when update is available
      setMinimized(false);
    });

    const unsubscribeNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      setStatus('not-available');
      // Hide after a brief moment if we just checked
      setTimeout(() => setShow(false), 3000);
    });

    const unsubscribeProgress = window.electronAPI.onDownloadProgress((progressObj) => {
      setStatus('downloading');
      setProgress(Math.round(progressObj.percent || 0));
    });

    const unsubscribeDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      setVersionInfo(info);
      setStatus('downloaded');
      setShow(true);
      setMinimized(false);
    });

    const unsubscribeError = window.electronAPI.onUpdateError((err) => {
      console.error('Update error:', err);
      // Only show error toast if we are online. If offline, it's expected to fail.
      if (navigator.onLine) {
        setStatus('error');
        setErrorMsg(typeof err === 'string' ? err : 'Error checking for updates');
        setShow(true);
      } else {
        setStatus('idle');
      }
    });

    // Auto-check for updates after a 5 seconds delay on startup
    const checkTimeout = setTimeout(() => {
      if (navigator.onLine) {
        window.electronAPI.checkForUpdates();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(checkTimeout);
      
      unsubscribeChecking();
      unsubscribeAvailable();
      unsubscribeNotAvailable();
      unsubscribeProgress();
      unsubscribeDownloaded();
      unsubscribeError();
    };
  }, [isElectron]);

  if (!isElectron || !show) return null;

  const handleDownload = () => {
    if (!isOnline) return;
    setStatus('downloading');
    setProgress(0);
    window.electronAPI.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI.quitAndInstall();
  };

  // Card themes depending on status
  let cardClass = `${theme.cardBg} border ${theme.border}`;
  let iconComponent = <Info className="w-5 h-5 text-blue-500 animate-pulse" />;
  let title = 'Software Update';
  let message = '';

  if (status === 'checking') {
    title = 'Checking for updates...';
    message = 'Verifying the latest Swift Typing version.';
    iconComponent = <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
  } else if (status === 'available') {
    title = 'New Update Available!';
    message = `Version v${versionInfo?.version || ''} is ready.`;
    iconComponent = <Sparkles className="w-5 h-5 text-amber-500" />;
  } else if (status === 'downloading') {
    title = 'Downloading Update...';
    message = `Progress: ${progress}%`;
    iconComponent = <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" />;
  } else if (status === 'downloaded') {
    title = 'Ready to Install!';
    message = `Version v${versionInfo?.version || ''} has been downloaded.`;
    iconComponent = <Sparkles className="w-5 h-5 text-green-500" />;
  } else if (status === 'error') {
    title = 'Update Verification Failed';
    message = errorMsg.includes('net::') || errorMsg.includes('fetch')
      ? 'Connection failed. Please check your internet.'
      : 'Could not fetch latest release updates.';
    iconComponent = <AlertCircle className="w-5 h-5 text-red-500" />;
  } else if (status === 'not-available') {
    title = 'App Up to Date';
    message = 'You are running the latest version.';
    iconComponent = <Sparkles className="w-5 h-5 text-green-500" />;
  }

  // Render minimized bubble
  if (minimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-[9999] cursor-pointer flex items-center gap-2.5 p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border bg-linear-to-r from-blue-600 to-indigo-600 border-blue-500 text-white"
        onClick={() => setMinimized(false)}
        title="View Software Update"
      >
        {status === 'downloading' ? (
          <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-bold">{progress}%</span>
          </div>
        ) : status === 'downloaded' ? (
          <Sparkles className="w-5 h-5 animate-bounce text-amber-300" />
        ) : (
          <Download className="w-5 h-5 animate-pulse" />
        )}
        <span className="text-xs font-bold pr-2">
          {status === 'downloading' ? 'Downloading Update...' : 'Update Available'}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShow(false);
          }}
          className="hover:bg-white/20 p-1 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-5 rounded-2xl shadow-2xl transition-all duration-300 transform translate-y-0 ${cardClass} flex flex-col gap-4 backdrop-blur-md`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {iconComponent}
          </div>
          <div>
            <h4 className={`font-bold ${theme.text} text-sm`}>{title}</h4>
            <p className={`text-xs ${theme.textSecondary} mt-0.5`}>{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMinimized(true)}
            className={`p-1.5 rounded-lg hover:${theme.secondary} transition-colors ${theme.textSecondary}`}
            title="Minimize"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShow(false)}
            className={`p-1.5 rounded-lg hover:${theme.secondary} transition-colors ${theme.textSecondary}`}
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar (Downloading State) */}
      {status === 'downloading' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className={theme.textSecondary}>Downloading...</span>
            <span className={theme.text}>{progress}%</span>
          </div>
          <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div 
              className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end pt-1 border-t border-dashed border-gray-200 dark:border-gray-800">
        {!isOnline && (
          <div className="flex items-center gap-1 text-xs text-red-500 mr-auto font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            <span>No connection</span>
          </div>
        )}
        
        {status === 'available' && (
          <button
            onClick={handleDownload}
            disabled={!isOnline}
            className={`px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20`}
          >
            <Download className="w-3.5 h-3.5" />
            Download Now
          </button>
        )}

        {status === 'downloaded' && (
          <button
            onClick={handleInstall}
            className={`px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-500 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-green-500/20`}
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            Restart & Install
          </button>
        )}

        {status === 'error' && (
          <button
            onClick={() => {
              if (isOnline) {
                setStatus('checking');
                window.electronAPI.checkForUpdates();
              }
            }}
            disabled={!isOnline}
            className={`px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all`}
          >
            Retry Check
          </button>
        )}
      </div>
    </div>
  );
};

export default UpdateToast;
