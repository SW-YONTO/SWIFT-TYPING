import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Sliders, Save, X, Hand, Settings2, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const HandPositionControls = ({ settings, onSettingChange, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const { theme } = useTheme();

  // Toggle panel visibility only when virtual hands are enabled
  const togglePanel = () => {
    if (settings.showVirtualHand) {
      setIsOpen(!isOpen);
    }
  };

  // Toggle virtual hands visibility
  const toggleVirtualHands = () => {
    const newValue = !settings.showVirtualHand;
    onSettingChange('showVirtualHand', newValue);
    if (!newValue) {
      setIsOpen(false); // Close panel if hands are disabled
    }
  };

  // Handle manual input changes
  const handleManualInput = (key, value) => {
    // Validate and format the input
    let numValue = parseInt(value.replace(/[^0-9]/g, ''));
    if (isNaN(numValue)) return;
    
    // Apply constraints based on the setting type
    if (key === 'handPositionHeight') {
      numValue = Math.max(70, Math.min(130, numValue));
    } else if (key === 'handPositionBottom') {
      numValue = Math.max(5, Math.min(50, numValue));
    } else if (key === 'handPositionLeft') {
      numValue = Math.max(45, Math.min(65, numValue));
    }
    
    onSettingChange(key, `${numValue}%`);
  };

  return (
    <>
      {/* Toggle Buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {/* Virtual Hands Toggle */}
        <button
          onClick={toggleVirtualHands}
          className={`p-3 rounded-full shadow-lg border transition-all duration-200 ${
            settings.showVirtualHand
              ? `${theme.primary} text-white border-transparent`
              : `${theme.border} ${theme.cardBg} ${theme.text} hover:${theme.inputBg}`
          }`}
          title={settings.showVirtualHand ? "Hide Virtual Hands" : "Show Virtual Hands"}
        >
          {settings.showVirtualHand ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

        {/* Position Controls Toggle */}
        {settings.showVirtualHand && (
          <button
            onClick={togglePanel}
            className={`p-3 rounded-full shadow-lg border transition-all duration-200 ${
              isOpen
                ? `${theme.primary} text-white border-transparent`
                : `${theme.border} ${theme.cardBg} ${theme.text} hover:${theme.inputBg}`
            }`}
            title="Hand Position Controls"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Controls Panel */}
      {isOpen && settings.showVirtualHand && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Control Panel */}
          <div className={`fixed bottom-24 right-4 z-50 w-80 ${theme.cardBg} rounded-xl shadow-xl border ${theme.border} overflow-hidden hand-position-panel`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${theme.border} ${theme.inputBg}`}>
              <div className="flex items-center gap-2">
                <Hand className="w-4 h-4" />
                <span className={`text-sm font-medium ${theme.text}`}>Hand Position Controls</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-md ${theme.text} hover:${theme.inputBg} transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-6">
              {/* Height Control */}
              <div>
                <div className={`flex items-center justify-between mb-3`}>
                  <span className={`text-sm font-medium ${theme.text}`}>Height</span>
                  <input
                    type="text"
                    value={settings.handPositionHeight || '100%'}
                    onChange={(e) => handleManualInput('handPositionHeight', e.target.value)}
                    className={`w-16 text-sm font-mono px-2 py-1 rounded border ${theme.border} ${theme.inputBg} ${theme.text} text-center`}
                    placeholder="100%"
                    autoComplete="off"
                    spellCheck="false"
                    autoCorrect="off"
                    data-allow-suggestions="false"
                  />
                </div>
                <input
                  type="range"
                  min="70"
                  max="130"
                  step="5"
                  value={parseInt(settings.handPositionHeight?.replace('%', '')) || 100}
                  onChange={(e) => onSettingChange('handPositionHeight', `${e.target.value}%`)}
                  className={`w-full hand-slider ${theme.mode === 'dark' ? 'hand-slider-dark' : 'hand-slider-light'}`}
                  style={{ pointerEvents: 'auto' }}
                />
                <div className={`flex justify-between text-xs ${theme.textSecondary} mt-1`}>
                  <span>70%</span>
                  <span>100%</span>
                  <span>130%</span>
                </div>
              </div>

              {/* Bottom Position Control */}
              <div>
                <div className={`flex items-center justify-between mb-3`}>
                  <span className={`text-sm font-medium ${theme.text}`}>Bottom Position</span>
                  <input
                    type="text"
                    value={settings.handPositionBottom || '35%'}
                    onChange={(e) => handleManualInput('handPositionBottom', e.target.value)}
                    className={`w-16 text-sm font-mono px-2 py-1 rounded border ${theme.border} ${theme.inputBg} ${theme.text} text-center`}
                    placeholder="35%"
                    autoComplete="off"
                    spellCheck="false"
                    autoCorrect="off"
                    data-allow-suggestions="false"
                  />
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={parseInt(settings.handPositionBottom?.replace('%', '')) || 35}
                  onChange={(e) => onSettingChange('handPositionBottom', `${e.target.value}%`)}
                  className={`w-full hand-slider ${theme.mode === 'dark' ? 'hand-slider-dark' : 'hand-slider-light'}`}
                  style={{ pointerEvents: 'auto' }}
                />
                <div className={`flex justify-between text-xs ${theme.textSecondary} mt-1`}>
                  <span>5%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Left Position Control */}
              <div>
                <div className={`flex items-center justify-between mb-3`}>
                  <span className={`text-sm font-medium ${theme.text}`}>Left Position</span>
                  <input
                    type="text"
                    value={settings.handPositionLeft || '56%'}
                    onChange={(e) => handleManualInput('handPositionLeft', e.target.value)}
                    className={`w-16 text-sm font-mono px-2 py-1 rounded border ${theme.border} ${theme.inputBg} ${theme.text} text-center`}
                    placeholder="56%"
                    autoComplete="off"
                    spellCheck="false"
                    autoCorrect="off"
                    data-allow-suggestions="false"
                  />
                </div>
                <input
                  type="range"
                  min="45"
                  max="65"
                  step="2"
                  value={parseInt(settings.handPositionLeft?.replace('%', '')) || 56}
                  onChange={(e) => onSettingChange('handPositionLeft', `${e.target.value}%`)}
                  className={`w-full hand-slider ${theme.mode === 'dark' ? 'hand-slider-dark' : 'hand-slider-light'}`}
                  style={{ pointerEvents: 'auto' }}
                />
                <div className={`flex justify-between text-xs ${theme.textSecondary} mt-1`}>
                  <span>45%</span>
                  <span>56%</span>
                  <span>65%</span>
                </div>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onSettingChange('handPositionHeight', '85%');
                    onSettingChange('handPositionBottom', '40%');
                    onSettingChange('handPositionLeft', '58%');
                  }}
                  className={`px-2 py-1 rounded text-xs border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors`}
                >
                  720p
                </button>
                <button
                  onClick={() => {
                    onSettingChange('handPositionHeight', '100%');
                    onSettingChange('handPositionBottom', '35%');
                    onSettingChange('handPositionLeft', '56%');
                  }}
                  className={`px-2 py-1 rounded text-xs border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors`}
                >
                  Default
                </button>
                <button
                  onClick={() => {
                    onSettingChange('handPositionHeight', '115%');
                    onSettingChange('handPositionBottom', '35%');
                    onSettingChange('handPositionLeft', '56%');
                  }}
                  className={`px-2 py-1 rounded text-xs border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors`}
                >
                  1080p
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onSettingChange('handPositionHeight', '100%');
                    onSettingChange('handPositionBottom', '35%');
                    onSettingChange('handPositionLeft', '56%');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border ${theme.border} ${theme.text} ${theme.inputBg} hover:${theme.secondary} transition-colors text-sm`}
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    onSave();
                    setIsOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg ${theme.primary} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

HandPositionControls.propTypes = {
  settings: PropTypes.object.isRequired,
  onSettingChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default HandPositionControls;
