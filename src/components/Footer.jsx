import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Github, Mail, Instagram, Heart, Code, Gamepad2, Star, Award } from 'lucide-react';

const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer className={`${theme.cardBg} border-t ${theme.border} mt-12`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          
          {/* Developer Profile Section */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <div className="relative">
                <img 
                  src="./suraj.png" 
                  alt="Suraj Maurya" 
                  className="w-16 h-16 rounded-full border-4 border-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme.text}`}>Suraj Maurya</h3>
                <p className={`${theme.textSecondary} flex items-center gap-2 justify-center lg:justify-start`}>
                  <Code className="w-4 h-4" />
                  Full Stack Developer
                </p>
              </div>
            </div>
            
            <div className={`${theme.cardBg} rounded-xl p-4 border ${theme.border} mb-6`}>
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <Gamepad2 className="w-5 h-5 text-purple-600" />
                <span className={`font-semibold ${theme.text}`}>SW Esports</span>
              </div>
              <p className={`text-sm ${theme.textSecondary}`}>
                Passionate about creating amazing user experiences and competitive gaming
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`text-center p-3 rounded-lg ${theme.secondary}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className={`font-bold ${theme.text}`}>40+</span>
                </div>
                <span className={`text-xs ${theme.textSecondary}`}>Projects</span>
              </div>
              <div className={`text-center p-3 rounded-lg ${theme.secondary}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span className={`font-bold ${theme.text}`}>4+</span>
                </div>
                <span className={`text-xs ${theme.textSecondary}`}>Years Exp</span>
              </div>
              <div className={`text-center p-3 rounded-lg ${theme.secondary}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className={`font-bold ${theme.text}`}>300+</span>
                </div>
                <span className={`text-xs ${theme.textSecondary}`}>Commits</span>

              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center lg:text-left">
            <h3 className={`text-lg font-semibold ${theme.text} mb-6`}>Quick Links</h3>
            <div className="space-y-3">
              <Link to="/about" className={`block ${theme.textSecondary} hover:${theme.accent} transition-colors duration-200 hover:translate-x-1 transform`}>
                About Swift Typing
              </Link>
              <Link to="/features" className={`block ${theme.textSecondary} hover:${theme.accent} transition-colors duration-200 hover:translate-x-1 transform`}>
                Features
              </Link>
              <Link to="/pricing" className={`block ${theme.textSecondary} hover:${theme.accent} transition-colors duration-200 hover:translate-x-1 transform`}>
                Pricing
              </Link>
              <Link to="/lessons" className={`block ${theme.textSecondary} hover:${theme.accent} transition-colors duration-200 hover:translate-x-1 transform`}>
                Typing Lessons
              </Link>
              <Link to="/tests" className={`block ${theme.textSecondary} hover:${theme.accent} transition-colors duration-200 hover:translate-x-1 transform`}>
                Speed Tests
              </Link>
              <Link to="/settings" className={`block ${theme.textSecondary} hover:${theme.accent} transition-colors duration-200 hover:translate-x-1 transform`}>
                Settings
              </Link>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="text-center lg:text-left">
            <h3 className={`text-lg font-semibold ${theme.text} mb-6`}>Connect With Me</h3>
            
            <div className="space-y-4 mb-6">
              <a 
                href="mailto:surajmoriya200@gmail.com" 
                className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg ${theme.secondary} hover:${theme.primary} hover:text-white transition-all duration-200 transform hover:scale-105`}
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm">surajmoriya200@gmail.com</span>
              </a>
              
              <a 
                href="https://instagram.com/red_eye0.0" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg ${theme.secondary} hover:bg-pink-600 hover:text-white transition-all duration-200 transform hover:scale-105`}
              >
                <Instagram className="w-5 h-5" />
                <span className="text-sm">@red_eye0.0</span>
              </a>
              
              <a 
                href="https://github.com/sw-esports" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg ${theme.secondary} hover:bg-gray-800 hover:text-white transition-all duration-200 transform hover:scale-105`}
              >
                <Github className="w-5 h-5" />
                <span className="text-sm">sw-esports</span>
              </a>
            </div>

            {/* Tech Stack */}
            <div className={`p-4 rounded-lg ${theme.secondary} border ${theme.border}`}>
              <h4 className={`text-sm font-semibold ${theme.text} mb-3`}>Built with</h4>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">React</span>
                <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">Electron</span>
                <span className="px-2 py-1 bg-cyan-500 text-white text-xs rounded-full">Tailwind</span>
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Vite</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`border-t ${theme.border} pt-8`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className={`text-sm ${theme.textSecondary} text-center md:text-left`}>
              <p className="flex items-center gap-2 justify-center md:justify-start">
                Made with 
                <Heart className="w-4 h-4 text-red-500 animate-pulse" /> 
                by Suraj Maurya • Swift Typing © 2025
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`text-xs ${theme.textSecondary}`}>Version 1.0.0</span>
              <div className={`h-4 w-px ${theme.border}`}></div>
              <span className={`text-xs ${theme.textSecondary}`}>Offline Ready</span>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full blur-xl"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
