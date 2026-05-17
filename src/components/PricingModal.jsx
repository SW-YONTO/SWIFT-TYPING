import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X, Download, Check, Star, Gift, Crown, Sparkles } from 'lucide-react';

// Obfuscated coupon
const _ck = [70,82,69,69,66,65,78,75,65,73];
const _gc = () => _ck.map(c => String.fromCharCode(c)).join('');

const PricingModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // 'success' | 'error' | null
  const [couponMessage, setCouponMessage] = useState('');
  const [showDownload, setShowDownload] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(window.location.protocol === 'file:');
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === _gc()) {
      setCouponStatus('success');
      setCouponMessage('✅ Coupon applied! You can now download Swift Typing for free.');
      setShowDownload(true);
    } else {
      setCouponStatus('error');
      setCouponMessage('❌ Invalid coupon code. Please try again.');
      setShowDownload(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') applyCoupon();
  };

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Gift,
      features: ['Basic typing lessons', '5 speed tests / day', '3 themes', 'Offline usage', 'Basic progress tracking'],
      popular: false,
      gradient: 'from-gray-500 to-gray-600'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: 'per month',
      icon: Crown,
      features: ['All lessons & courses', 'Unlimited speed tests', 'All premium themes', 'Advanced analytics', 'Export progress data', 'Priority support'],
      popular: true,
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '$29.99',
      period: 'one-time',
      icon: Sparkles,
      features: ['Everything in Pro', 'Lifetime access', 'Future updates free', 'Beta features access', 'Commercial usage', 'Premium support'],
      popular: false,
      gradient: 'from-green-500 to-emerald-600'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`${theme.cardBg} border ${theme.border} rounded-2xl max-w-[900px] w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl`}>
        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-9 h-9 rounded-lg border ${theme.border} ${theme.secondary} ${theme.text} flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all`}
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>Choose Your Plan</h2>
        <p className={`${theme.textSecondary} mb-8`}>Start free, upgrade when you're ready.</p>

        {/* Electron notice */}
        {isElectron && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-600 text-sm">
            ⚠️ Please connect to the internet to purchase premium plans.
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative ${theme.cardBg} border-2 rounded-2xl p-6 text-center cursor-pointer transition-all hover:shadow-xl ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : theme.border
                } ${plan.popular ? 'md:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> POPULAR
                  </div>
                )}
                <div className={`w-12 h-12 bg-gradient-to-r ${plan.gradient} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-lg font-bold ${theme.text} mb-2`}>{plan.name}</h3>
                <div className={`text-3xl font-black ${theme.text} mb-1`}>{plan.price}</div>
                <div className={`text-xs ${theme.textSecondary} mb-4`}>{plan.period}</div>
                <ul className="text-left space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${theme.textSecondary}`}>
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Coupon */}
        <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-5`}>
          <h4 className={`text-sm font-semibold ${theme.text} mb-3`}>🎟️ Have a coupon code?</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter coupon code..."
              autoComplete="off"
              className={`flex-1 px-4 py-2.5 ${theme.background} border ${theme.border} rounded-lg ${theme.text} text-sm outline-none focus:border-blue-500 transition-colors`}
            />
            <button
              onClick={applyCoupon}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
            >
              Apply
            </button>
          </div>

          {couponStatus && (
            <div className={`mt-3 text-sm p-3 rounded-lg ${
              couponStatus === 'success'
                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {couponMessage}
            </div>
          )}

          {showDownload && (
            <a
              href="/downloads/SwiftTyping-Setup.zip"
              download
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Download Swift Typing (.zip)
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
