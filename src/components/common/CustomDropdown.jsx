import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomDropdown({
  options = [],
  value,
  onChange,
  theme,
  icon: Icon,
  placeholder = 'Select option...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${theme.inputBg} border ${theme.border} ${theme.text} text-xs font-extrabold rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-sm hover:opacity-90 transition cursor-pointer focus:outline-none min-w-[140px]`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className={`w-3.5 h-3.5 ${theme.accent}`} />}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-1.5 w-48 rounded-2xl border ${theme.border} ${theme.cardBg} shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fadeIn`}>
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? `${theme.secondary} ${theme.accent} font-extrabold`
                      : `${theme.text} hover:${theme.secondary}`
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className={`w-3.5 h-3.5 ${theme.accent}`} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
