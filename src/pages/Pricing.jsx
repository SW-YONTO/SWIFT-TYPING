import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Star, 
  Check, 
  Zap, 
  Crown, 
  Gift, 
  Heart,
  Download,
  Users,
  Target,
  BarChart3,
  Shield,
  Clock,
  Infinity,
  Award,
  Sparkles
} from 'lucide-react';

const Pricing = () => {
  const { theme } = useTheme();

  const plans = [
    {
      name: "Free",
      price: "0",
      period: "Forever",
      description: "Perfect for getting started with typing practice",
      popular: false,
      features: [
        "Basic typing lessons",
        "Speed tests (up to 5 per day)",
        "Basic progress tracking",
        "3 themes available",
        "Offline usage",
        "Community support"
      ],
      limitations: [
        "Limited to 5 tests per day",
        "Basic themes only",
        "No advanced analytics"
      ],
      buttonText: "Get Started Free",
      icon: Gift,
      color: "from-gray-500 to-gray-600"
    },
    {
      name: "Pro",
      price: "9.99",
      period: "per month",
      description: "Ideal for serious learners and professionals",
      popular: true,
      features: [
        "All typing lessons & courses",
        "Unlimited speed tests",
        "Advanced progress analytics",
        "All premium themes",
        "Custom text import",
        "Advanced statistics",
        "Export progress data",
        "Priority support",
        "No advertisements"
      ],
      limitations: [],
      buttonText: "Start Pro Trial",
      icon: Crown,
      color: "from-blue-500 to-purple-600"
    },
    {
      name: "Lifetime",
      price: "29.99",
      period: "one-time",
      description: "Best value - pay once, use forever",
      popular: false,
      features: [
        "Everything in Pro",
        "Lifetime access",
        "Future updates included",
        "Advanced customization",
        "Personal training plans",
        "Premium support",
        "Beta features access",
        "Commercial usage rights"
      ],
      limitations: [],
      buttonText: "Buy Lifetime",
      icon: Infinity,
      color: "from-green-500 to-emerald-600"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Personalized Learning",
      description: "AI-powered lessons that adapt to your skill level and learning pace."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed insights into your typing performance with comprehensive charts."
    },
    {
      icon: Shield,
      title: "Offline Ready",
      description: "Complete desktop application that works without internet connection."
    },
    {
      icon: Users,
      title: "Multi-User Support",
      description: "Create multiple profiles for family members or different skill levels."
    },
    {
      icon: Award,
      title: "Achievements System",
      description: "Unlock badges and achievements as you progress through your typing journey."
    },
    {
      icon: Clock,
      title: "Flexible Practice",
      description: "Practice at your own pace with customizable time limits and difficulty levels."
    }
  ];

  const faqs = [
    {
      question: "Is Swift Typing really free?",
      answer: "Yes! Our free plan provides access to basic typing lessons, limited speed tests, and essential features. No credit card required to get started."
    },
    {
      question: "What's the difference between Pro and Lifetime?",
      answer: "Pro is a monthly subscription with all premium features. Lifetime is a one-time payment that gives you permanent access to all features and future updates."
    },
    {
      question: "Can I use Swift Typing offline?",
      answer: "Absolutely! Swift Typing is a desktop application that works completely offline. No internet connection required for practicing or tracking progress."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the next billing cycle."
    }
  ];

  return (
    <div className={`min-h-screen ${theme.background}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`p-4 ${theme.primary} rounded-2xl shadow-lg`}>
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h1 className={`text-5xl font-bold ${theme.text}`}>Simple, Transparent Pricing</h1>
            </div>
            <p className={`text-xl ${theme.textSecondary} max-w-3xl mx-auto mb-8`}>
              Choose the perfect plan for your typing journey. Start free and upgrade when you're ready for more advanced features.
            </p>
            
            {/* Free Trial Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${theme.secondary} rounded-full ${theme.border} border mb-8`}>
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className={`text-sm font-medium ${theme.text}`}>14-day free trial for Pro plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative ${theme.cardBg} rounded-2xl border-2 ${
                  plan.popular ? 'border-blue-500 shadow-xl shadow-blue-500/20' : theme.border
                } p-8 transition-all hover:shadow-xl ${plan.popular ? 'transform scale-105' : 'hover:scale-105'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 bg-linear-to-r ${plan.color} rounded-2xl mx-auto mb-4 flex items-center justify-center`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className={`text-2xl font-bold ${theme.text} mb-2`}>{plan.name}</h3>
                  <p className={`${theme.textSecondary} mb-4`}>{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${theme.text}`}>${plan.price}</span>
                    <span className={`text-lg ${theme.textSecondary} ml-2`}>/{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 shrink-0" />
                      <span className={`${theme.text} text-sm`}>{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.map((limitation, limitIndex) => (
                    <div key={limitIndex} className="flex items-center gap-3 opacity-60">
                      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                        <div className={`w-1 h-1 ${theme.textSecondary} rounded-full`}></div>
                      </div>
                      <span className={`${theme.textSecondary} text-sm`}>{limitation}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className={`w-full py-4 rounded-xl font-semibold transition-all ${
                    plan.popular 
                      ? `bg-linear-to-r ${plan.color} text-white hover:shadow-lg transform hover:scale-105` 
                      : `${theme.secondary} ${theme.accent} hover:${theme.secondaryHover}`
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className={`py-20 ${theme.cardBg} border-y ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>Everything You Need to Excel</h2>
            <p className={`text-lg ${theme.textSecondary} max-w-2xl mx-auto`}>
              Our comprehensive feature set is designed to take your typing skills to the next level.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`${theme.cardBg} rounded-xl p-6 border ${theme.border} hover:shadow-lg transition-all`}>
                <div className={`w-12 h-12 ${theme.primary} rounded-xl mb-4 flex items-center justify-center`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl font-semibold ${theme.text} mb-3`}>{feature.title}</h3>
                <p className={`${theme.textSecondary}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Money-back Guarantee */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className={`${theme.cardBg} rounded-2xl p-12 border ${theme.border} shadow-lg`}>
            <div className={`w-20 h-20 ${theme.primary} rounded-full mx-auto mb-6 flex items-center justify-center`}>
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className={`text-3xl font-bold ${theme.text} mb-4`}>30-Day Money-Back Guarantee</h2>
            <p className={`text-lg ${theme.textSecondary} mb-8 max-w-2xl mx-auto`}>
              We're confident you'll love Swift Typing. If you're not completely satisfied within 30 days, 
              we'll refund your purchase with no questions asked.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className={theme.textSecondary}>No questions asked</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className={theme.textSecondary}>Full refund</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className={theme.textSecondary}>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className={`py-20 ${theme.cardBg} border-y ${theme.border}`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>Frequently Asked Questions</h2>
            <p className={`text-lg ${theme.textSecondary}`}>
              Have questions? We have answers. Can't find what you're looking for? Contact our support team.
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className={`${theme.cardBg} rounded-xl p-6 border ${theme.border}`}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-3`}>{faq.question}</h3>
                <p className={`${theme.textSecondary}`}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={`py-20 ${theme.primary} text-white`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Typing Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have transformed their typing skills with Swift Typing. 
            Start with our free plan and upgrade when you're ready.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="flex items-center gap-2 px-8 py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg font-semibold">
              <Download className="w-5 h-5" />
              Start Free Trial
            </button>
            <button className="flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-gray-800 transition-all font-semibold">
              <Heart className="w-5 h-5" />
              Buy Lifetime
            </button>
          </div>
          
          <p className="text-sm opacity-75 mt-6">
            No credit card required for free plan • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
