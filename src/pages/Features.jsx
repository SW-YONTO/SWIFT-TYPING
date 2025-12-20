import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Target, 
  Zap, 
  BarChart3, 
  Shield, 
  Users, 
  Award,
  Clock,
  Palette,
  Download,
  Settings,
  BookOpen,
  TrendingUp,
  Eye,
  Keyboard,
  Globe,
  Smartphone,
  Monitor,
  Play,
  ChevronRight,
  Check,
  Star,
  ArrowRight
} from 'lucide-react';

const Features = () => {
  const { theme } = useTheme();
  const [activeFeature, setActiveFeature] = useState(0);

  const mainFeatures = [
    {
      icon: Target,
      title: "Smart Learning System",
      description: "AI-powered adaptive learning that adjusts to your skill level and learning pace",
      details: [
        "Personalized lesson recommendations",
        "Difficulty adjustment based on performance",
        "Smart error detection and correction",
        "Progress-based curriculum advancement"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive performance tracking with detailed insights and progress visualization",
      details: [
        "Real-time WPM and accuracy tracking",
        "Historical performance charts",
        "Error pattern analysis",
        "Improvement trend visualization"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Keyboard,
      title: "Interactive Lessons",
      description: "Engaging typing lessons with visual keyboard guidance and instant feedback",
      details: [
        "Step-by-step finger placement guides",
        "Visual keyboard highlighting",
        "Interactive typing exercises",
        "Instant error correction"
      ],
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Offline Ready",
      description: "Complete desktop application that works without internet connection",
      details: [
        "No internet required",
        "Local data storage",
        "Fast performance",
        "Privacy focused"
      ],
      color: "from-orange-500 to-red-500"
    }
  ];

  const allFeatures = [
    {
      category: "Learning & Practice",
      icon: BookOpen,
      features: [
        { name: "50+ Structured Lessons", desc: "Progressive lessons from beginner to advanced" },
        { name: "Custom Text Import", desc: "Practice with your own content" },
        { name: "Multiple Difficulty Levels", desc: "Beginner, intermediate, and advanced modes" },
        { name: "Timed Practice Sessions", desc: "Customizable time limits for focused practice" },
        { name: "Word Count Challenges", desc: "Practice with specific word targets" },
        { name: "Real-time Feedback", desc: "Instant corrections and suggestions" }
      ]
    },
    {
      category: "Performance Tracking",
      icon: TrendingUp,
      features: [
        { name: "WPM Tracking", desc: "Monitor your words-per-minute improvement" },
        { name: "Accuracy Analysis", desc: "Detailed accuracy statistics and trends" },
        { name: "Progress Charts", desc: "Visual progress tracking over time" },
        { name: "Error Pattern Detection", desc: "Identify and fix common mistakes" },
        { name: "Performance History", desc: "Complete history of all your sessions" },
        { name: "Goal Setting", desc: "Set and track personal typing goals" }
      ]
    },
    {
      category: "Customization",
      icon: Palette,
      features: [
        { name: "Multiple Themes", desc: "Light and dark themes for comfortable practice" },
        { name: "Font Customization", desc: "Choose from multiple font families and sizes" },
        { name: "Layout Options", desc: "Customize interface layout to your preference" },
        { name: "Sound Effects", desc: "Optional audio feedback for keystrokes" },
        { name: "Keyboard Layouts", desc: "Support for different keyboard layouts" },
        { name: "Practice Modes", desc: "Various practice modes for different needs" }
      ]
    },
    {
      category: "User Management",
      icon: Users,
      features: [
        { name: "Multiple Profiles", desc: "Create separate profiles for different users" },
        { name: "Progress Synchronization", desc: "Keep progress synced across profiles" },
        { name: "User Statistics", desc: "Individual statistics for each user" },
        { name: "Achievement System", desc: "Unlock badges and achievements" },
        { name: "Leaderboards", desc: "Compare progress with family members" },
        { name: "Data Export", desc: "Export your progress data anytime" }
      ]
    }
  ];

  const screenshots = [
    { title: "Main Dashboard", desc: "Clean and intuitive interface" },
    { title: "Typing Practice", desc: "Real-time feedback and guidance" },
    { title: "Progress Analytics", desc: "Detailed performance insights" },
    { title: "Lesson Browser", desc: "Structured learning curriculum" }
  ];

  return (
    <div className={`min-h-screen ${theme.background}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`p-4 ${theme.primary} rounded-2xl shadow-lg`}>
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h1 className={`text-5xl font-bold ${theme.text}`}>Powerful Features</h1>
            </div>
            <p className={`text-xl ${theme.textSecondary} max-w-3xl mx-auto mb-8`}>
              Discover all the tools and features that make Swift Typing the most comprehensive 
              typing tutor available. Built for learners of all skill levels.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <button className={`flex items-center gap-2 px-6 py-3 ${theme.primary} text-white rounded-xl hover:${theme.primaryHover} transition-all transform hover:scale-105 shadow-lg`}>
                <Download className="w-5 h-5" />
                Try It Free
              </button>
              <button className={`flex items-center gap-2 px-6 py-3 ${theme.secondary} ${theme.accent} rounded-xl hover:${theme.secondaryHover} transition-all`}>
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Features Showcase */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>Core Features</h2>
            <p className={`text-lg ${theme.textSecondary} max-w-2xl mx-auto`}>
              The essential features that make Swift Typing stand out from other typing tutors.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {mainFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    activeFeature === index 
                      ? `bg-linear-to-r ${feature.color} text-white border-transparent shadow-xl` 
                      : `${theme.cardBg} ${theme.border} hover:shadow-lg`
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${activeFeature === index ? 'bg-white/20' : theme.secondary}`}>
                      {React.createElement(feature.icon, { className: `w-6 h-6 ${activeFeature === index ? 'text-white' : theme.accent}` })}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-semibold mb-2 ${activeFeature === index ? 'text-white' : theme.text}`}>
                        {feature.title}
                      </h3>
                      <p className={`mb-4 ${activeFeature === index ? 'text-white/90' : theme.textSecondary}`}>
                        {feature.description}
                      </p>
                      
                      {activeFeature === index && (
                        <div className="space-y-2">
                          {feature.details.map((detail, detailIndex) => (
                            <div key={detailIndex} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-white" />
                              <span className="text-sm text-white/90">{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${activeFeature === index ? 'rotate-90 text-white' : theme.textSecondary}`} />
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`${theme.cardBg} rounded-2xl p-8 border ${theme.border} shadow-lg`}>
              <div className={`w-full h-64 bg-linear-to-r ${mainFeatures[activeFeature].color} rounded-xl mb-6 flex items-center justify-center`}>
                {React.createElement(mainFeatures[activeFeature].icon, { className: "w-24 h-24 text-white" })}
              </div>
              <h3 className={`text-2xl font-bold ${theme.text} mb-4`}>
                {mainFeatures[activeFeature].title}
              </h3>
              <p className={`${theme.textSecondary} mb-6`}>
                {mainFeatures[activeFeature].description}
              </p>
              <button className={`flex items-center gap-2 px-4 py-2 ${theme.primary} text-white rounded-lg hover:${theme.primaryHover} transition-all`}>
                Learn More
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Features List */}
      <div className={`py-20 ${theme.cardBg} border-y ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>Complete Feature Set</h2>
            <p className={`text-lg ${theme.textSecondary} max-w-2xl mx-auto`}>
              Every feature you need for a comprehensive typing education experience.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {allFeatures.map((category, categoryIndex) => (
              <div key={categoryIndex} className={`${theme.cardBg} rounded-2xl p-8 border ${theme.border} shadow-lg`}>
                <div className="flex items-center gap-3 mb-8">
                  <div className={`p-3 ${theme.primary} rounded-xl`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-2xl font-bold ${theme.text}`}>{category.category}</h3>
                </div>
                
                <div className="space-y-6">
                  {category.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-4">
                      <div className={`p-1 ${theme.secondary} rounded-lg shrink-0 mt-1`}>
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${theme.text} mb-1`}>{feature.name}</h4>
                        <p className={`text-sm ${theme.textSecondary}`}>{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Support */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>Cross-Platform Support</h2>
            <p className={`text-lg ${theme.textSecondary} max-w-2xl mx-auto`}>
              Swift Typing works seamlessly across all major desktop platforms.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Monitor, name: "Windows", desc: "Windows 10/11 compatible", color: "from-blue-500 to-blue-600" },
              { icon: Monitor, name: "macOS", desc: "Intel & Apple Silicon", color: "from-gray-500 to-gray-600" },
              { icon: Monitor, name: "Linux", desc: "Ubuntu, Fedora & more", color: "from-orange-500 to-red-500" }
            ].map((platform, index) => (
              <div key={index} className={`${theme.cardBg} rounded-2xl p-8 border ${theme.border} text-center hover:shadow-lg transition-all`}>
                <div className={`w-20 h-20 bg-linear-to-r ${platform.color} rounded-2xl mx-auto mb-6 flex items-center justify-center`}>
                  <platform.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className={`text-xl font-bold ${theme.text} mb-2`}>{platform.name}</h3>
                <p className={`${theme.textSecondary}`}>{platform.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screenshots Gallery */}
      <div className={`py-20 ${theme.cardBg} border-y ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>See It In Action</h2>
            <p className={`text-lg ${theme.textSecondary} max-w-2xl mx-auto`}>
              Take a look at Swift Typing's beautiful and intuitive interface.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {screenshots.map((screenshot, index) => (
              <div key={index} className={`${theme.cardBg} rounded-2xl p-6 border ${theme.border} hover:shadow-lg transition-all`}>
                <div className={`w-full h-48 bg-linear-to-br from-blue-500/20 to-purple-600/20 rounded-xl mb-4 flex items-center justify-center`}>
                  <Eye className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>{screenshot.title}</h3>
                <p className={`text-sm ${theme.textSecondary}`}>{screenshot.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={`py-20 ${theme.primary} text-white`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience All Features?</h2>
          <p className="text-xl mb-8 opacity-90">
            Try Swift Typing today and discover why it's the most comprehensive typing tutor available. 
            Start with our free plan or unlock all features with Pro.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="flex items-center gap-2 px-8 py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg font-semibold">
              <Download className="w-5 h-5" />
              Download Free
            </button>
            <button className="flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-gray-800 transition-all font-semibold">
              <Star className="w-5 h-5" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
