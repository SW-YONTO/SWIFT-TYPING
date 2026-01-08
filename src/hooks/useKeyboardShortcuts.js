import { useEffect, useCallback, useState } from 'react';

/**
 * Global keyboard shortcuts configuration
 */
export const SHORTCUTS = {
  SHOW_HELP: { key: '?', description: 'Show keyboard shortcuts', category: 'General' },
  RESTART: { key: 'Tab', description: 'Restart current test/lesson', category: 'Typing' },
  ESCAPE: { key: 'Escape', description: 'Exit current mode or close modal', category: 'General' },
  ZOOM_IN: { key: 'Ctrl++', description: 'Increase font size', category: 'View' },
  ZOOM_OUT: { key: 'Ctrl+-', description: 'Decrease font size', category: 'View' },
  ZOOM_RESET: { key: 'Ctrl+0', description: 'Reset font size', category: 'View' },
  FOCUS_MODE: { key: 'F', description: 'Toggle focus mode (when not typing)', category: 'Typing' },
  PAUSE: { key: 'Space', description: 'Pause/Resume (when not typing)', category: 'Typing' },
};

/**
 * useKeyboardShortcuts - Global keyboard shortcuts hook
 * @param {Object} handlers - Object mapping shortcut keys to handler functions
 * @param {boolean} enabled - Whether shortcuts are enabled
 */
export function useKeyboardShortcuts(handlers = {}, enabled = true) {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      // Exception: Escape to close modal
      if (e.key === 'Escape' && handlers.onEscape) {
        handlers.onEscape();
        return;
      }
      return;
    }

    // Show shortcuts modal with ?
    if (e.key === '?' && e.shiftKey) {
      e.preventDefault();
      setShowShortcutsModal(prev => !prev);
      return;
    }

    // Close modal with Escape
    if (e.key === 'Escape') {
      if (showShortcutsModal) {
        setShowShortcutsModal(false);
        return;
      }
      if (handlers.onEscape) {
        handlers.onEscape();
        return;
      }
    }

    // Tab to restart (prevent default tab behavior)
    if (e.key === 'Tab' && handlers.onRestart) {
      e.preventDefault();
      handlers.onRestart();
      return;
    }

    // F for focus mode (when not in input)
    if (e.key === 'f' || e.key === 'F') {
      if (!e.ctrlKey && !e.metaKey && handlers.onToggleFocus) {
        handlers.onToggleFocus();
        return;
      }
    }

    // Space for pause (when not in input and not default scroll)
    if (e.key === ' ' && handlers.onTogglePause) {
      // Only if there's a handler and we're in a typing context
      e.preventDefault();
      handlers.onTogglePause();
      return;
    }

    // Ctrl+K for command palette (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (handlers.onCommandPalette) {
        handlers.onCommandPalette();
      }
      return;
    }

  }, [enabled, handlers, showShortcutsModal]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showShortcutsModal,
    setShowShortcutsModal,
    shortcuts: SHORTCUTS
  };
}

export default useKeyboardShortcuts;
