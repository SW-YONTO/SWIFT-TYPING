import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const NotFound = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`min-h-[80vh] flex items-center justify-center p-6 ${theme.background}`}>
      <div className={`max-w-md w-full text-center ${theme.cardBg} border ${theme.border} rounded-2xl p-8 shadow-2xl animate-fade-in`}>
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-bounce-subtle">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className={`text-6xl font-black ${theme.text} mb-2`}>404</h1>
        <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>Page Not Found</h2>
        
        <p className={`${theme.textSecondary} mb-8`}>
          Oops! The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link 
            to="/lessons"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all active:scale-95"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
          <button 
            onClick={() => navigate(-1)}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg ${theme.secondary} ${theme.text} font-semibold hover:opacity-80 transition-all active:scale-95`}
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
