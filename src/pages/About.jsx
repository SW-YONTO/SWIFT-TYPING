import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Target, 
  Users, 
  Award, 
  Clock, 
  BarChart3, 
  Zap, 
  Shield, 
  Heart,
  Code,
  Gamepad2,
  Star,
  CheckCircle,
  ArrowRight,
  Download
} from 'lucide-react';

const About = () => {
  const { theme } = useTheme();

  const stats = [
    { icon: Users, label: "Active Users", value: "10K+", color: "text-blue-500" },
    { icon: Award, label: "Lessons Available", value: "50+", color: "text-green-500" },
    { icon: Clock, label: "Hours Practiced", value: "100K+", color: "text-purple-500" },
    { icon: BarChart3, label: "Tests Completed", value: "500K+", color: "text-orange-500" }
  ];

  const features = [
    {
      icon: Target,
      title: "Accuracy Training",
      description: "Advanced algorithms to improve your typing accuracy with real-time feedback and corrections."
    },
    {
      icon: Zap,
      title: "Speed Building",
      description: "Progressive exercises designed to increase your typing speed while maintaining accuracy."
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "Detailed analytics and charts to monitor your improvement over time."
    },
    {
      icon: Shield,
      title: "Offline Ready",
      description: "Complete desktop application that works without internet connection."
    }
  ];

  const team = [
    {
      name: "Suraj Maurya",
      role: "Lead Developer & Founder",
      avatar: "./suraj.png",
      bio: "Full-stack developer passionate about creating educational tools and competitive gaming.",
      social: {
        github: "https://github.com/sw-esports/SWIFT-TYPING",
        instagram: "https://instagram.com/red_eye0.0",
        email: "surajmoriya200@gmail.com"
      }
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
                <Target className="w-10 h-10 text-white" />
              </div>
              <h1 className={`text-5xl font-bold ${theme.text}`}>About Swift Typing</h1>
            </div>
            <p className={`text-xl ${theme.textSecondary} max-w-3xl mx-auto leading-relaxed`}>
              Swift Typing is a comprehensive offline typing tutor designed to help you master the art of 
              touch typing. Built with modern technology and educational expertise, we provide a complete 
              learning experience that adapts to your skill level.
            </p>
            
            <div className="flex items-center justify-center gap-4 mt-8">
              <a 
                href="https://github.com/sw-esports/SWIFT-TYPING/releases/download/v2.9/SwiftTyping.zip" 
                download
                className={`flex items-center gap-2 px-6 py-3 ${theme.primary} text-white rounded-xl hover:${theme.primaryHover} transition-all transform hover:scale-105 shadow-lg text-decoration-none`}
              >
                <Download className="w-5 h-5" />
                Download SwiftTyping
              </a>
              <a 
                href="https://github.com/sw-esports/SWIFT-TYPING"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-6 py-3 ${theme.secondary} ${theme.accent} rounded-xl hover:${theme.secondaryHover} transition-all text-decoration-none`}
              >
                View on GitHub
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-linear-to-tl from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Stats Section */}
      <div className={`py-16 ${theme.cardBg} border-y ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-2xl ${theme.secondary}`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
                <div className={`text-3xl font-bold ${theme.text} mb-2`}>{stat.value}</div>
                <div className={`text-sm ${theme.textSecondary}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className={`text-4xl font-bold ${theme.text} mb-6`}>Our Mission</h2>
              <p className={`text-lg ${theme.textSecondary} mb-6 leading-relaxed`}>
                We believe that typing is a fundamental skill in the digital age. Our mission is to make 
                learning touch typing engaging, effective, and accessible to everyone. Swift Typing combines 
                proven teaching methods with modern technology to create the ultimate typing education experience.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className={`${theme.text}`}>Scientifically proven learning methods</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className={`${theme.text}`}>Personalized learning experience</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className={`${theme.text}`}>No internet required - work offline</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className={`${theme.text}`}>Completely free and open source</span>
                </div>
              </div>
            </div>
            
            <div className={`${theme.cardBg} rounded-2xl p-8 border ${theme.border} shadow-lg`}>
              <h3 className={`text-2xl font-semibold ${theme.text} mb-6`}>Why Choose Swift Typing?</h3>
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`p-2 ${theme.primary} rounded-lg shrink-0`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${theme.text} mb-2`}>{feature.title}</h4>
                      <p className={`text-sm ${theme.textSecondary}`}>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className={`py-20 ${theme.cardBg} border-y ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>Meet the Team</h2>
            <p className={`text-lg ${theme.textSecondary} max-w-2xl mx-auto`}>
              Passionate developers and educators working together to create the best typing education experience.
            </p>
          </div>
          
          <div className="flex justify-center">
            {team.map((member, index) => (
              <div key={index} className={`${theme.cardBg} rounded-2xl p-8 border ${theme.border} shadow-lg max-w-md`}>
                <div className="text-center">
                  <div className="relative mb-6">
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto border-4 border-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
                    />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <Gamepad2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-bold ${theme.text} mb-2`}>{member.name}</h3>
                  <p className={`${theme.textSecondary} mb-4`}>{member.role}</p>
                  <p className={`text-sm ${theme.textSecondary} mb-6`}>{member.bio}</p>
                  
                  <div className="flex items-center justify-center gap-4">
                    <a 
                      href={member.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 ${theme.secondary} rounded-lg hover:bg-gray-800 hover:text-white transition-all`}
                    >
                      <Code className="w-5 h-5" />
                    </a>
                    <a 
                      href={`mailto:${member.social.email}`}
                      className={`p-2 ${theme.secondary} rounded-lg hover:${theme.primary} hover:text-white transition-all`}
                    >
                      <Heart className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold ${theme.text} mb-4`}>Built with Modern Technology</h2>
            <p className={`text-lg ${theme.textSecondary} max-w-2xl mx-auto`}>
              Swift Typing is built using cutting-edge technologies to ensure the best performance and user experience.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "React", color: "bg-blue-500", desc: "Modern UI Framework" },
              { name: "Electron", color: "bg-purple-500", desc: "Cross-platform Desktop" },
              { name: "Tailwind CSS", color: "bg-cyan-500", desc: "Utility-first CSS" },
              { name: "Vite", color: "bg-green-500", desc: "Fast Build Tool" }
            ].map((tech, index) => (
              <div key={index} className={`${theme.cardBg} rounded-xl p-6 border ${theme.border} text-center hover:shadow-lg transition-all`}>
                <div className={`w-16 h-16 ${tech.color} rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg`}>
                  {tech.name.charAt(0)}
                </div>
                <h3 className={`font-semibold ${theme.text} mb-2`}>{tech.name}</h3>
                <p className={`text-sm ${theme.textSecondary}`}>{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={`py-20 ${theme.primary} text-white`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Master Touch Typing?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have improved their typing skills with Swift Typing. 
            Start your journey to faster, more accurate typing today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="https://github.com/sw-esports/SWIFT-TYPING/releases/download/v2.9/SwiftTyping.zip" 
              download
              className="flex items-center gap-2 px-8 py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg font-semibold text-decoration-none"
            >
              <Download className="w-5 h-5" />
              Download Now
            </a>
            <a 
              href="https://github.com/sw-esports/SWIFT-TYPING"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-gray-800 transition-all font-semibold text-decoration-none"
            >
              View on GitHub
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
