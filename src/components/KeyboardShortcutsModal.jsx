import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { SHORTCUTS } from '../hooks/useKeyboardShortcuts';

/**
 * KeyboardShortcutsModal - Modal showing all keyboard shortcuts
 */
const KeyboardShortcutsModal = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = Object.entries(SHORTCUTS).reduce((acc, [key, value]) => {
    if (!acc[value.category]) {
      acc[value.category] = [];
    }
    acc[value.category].push({ id: key, ...value });
    return acc;
  }, {});

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        className={`${theme.cardBg} rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${theme.mode === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100'} rounded-lg`}>
              <Keyboard className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
            </div>
            <h2 id="shortcuts-title" className={`text-xl font-bold ${theme.text}`}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            aria-label="Close shortcuts modal"
          >
            <X className={`w-5 h-5 ${theme.textSecondary}`} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className={`text-sm font-semibold ${theme.textSecondary} uppercase tracking-wider mb-3`}>
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map(shortcut => (
                  <div 
                    key={shortcut.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${theme.mode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                  >
                    <span className={theme.text}>{shortcut.description}</span>
                    <kbd className={`px-3 py-1.5 rounded-lg font-mono text-sm ${
                      theme.mode === 'dark' 
                        ? 'bg-gray-700 text-gray-200 border border-gray-600' 
                        : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                    }`}>
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme.border} text-center`}>
          <p className={`text-sm ${theme.textSecondary}`}>
            Press <kbd className={`px-2 py-0.5 rounded ${theme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} font-mono text-xs`}>Shift + ?</kbd> anytime to show this menu
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
