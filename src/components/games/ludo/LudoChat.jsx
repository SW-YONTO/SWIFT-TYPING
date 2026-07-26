import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Send, Smile } from 'lucide-react';

const EMOJI_LIST = ['👍', '🔥', '😂', '🎉', '😡', '👏', '👑', '😎'];

const LudoChat = ({ onSendChat, onSendEmoji }) => {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (onSendChat) onSendChat(input.trim());
    setInput('');
  };

  return (
    <div className={`${theme.cardBg} rounded-2xl border ${theme.border} p-3 shadow-xl flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400">Quick Chat</span>
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="text-gray-400 hover:text-amber-500 transition-colors p-1 cursor-pointer"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showEmoji && (
            <div className="absolute right-0 bottom-8 z-50 bg-slate-900 border border-slate-700 rounded-xl p-2 grid grid-cols-4 gap-1 shadow-2xl">
              {EMOJI_LIST.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    if (onSendEmoji) onSendEmoji(emoji);
                    setShowEmoji(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default LudoChat;
