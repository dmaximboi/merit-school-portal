import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, Users, ArrowRight, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-primary-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-primary-200">
                <img 
                  src="/meritlogo.jpg" 
                  alt="Merit Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Merit College</h1>
                <p className="text-xs text-primary-100 uppercase tracking-widest">Of Advanced Studies</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate('/auth')} className="text-primary-100 hover:text-white font-medium transition">
                Portal Login
              </button>
              <button 
                onClick={() => navigate('/register/student')} 
                className="bg-accent-600 hover:bg-accent-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
              >
                Apply Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pattern-grid-lg"></div> {/* Texture placeholder */}
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Excellence in <span className="text-accent-500">Education</span> & Character
            </h1>
            <p className="text-xl text-primary-100 mb-10 leading-relaxed">
              Empowering the next generation through world-class O-Level, A-Level, and JAMB preparatory programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/register/student')}
                className="btn-accent text-lg px-8 py-4"
              >
                Start Your Application
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold hover:bg-white hover:text-primary-900 transition-all"
              >
                Access Portal
              </button>
            </div>
          </div>
        </div>
        
        {/* Wave Separator at bottom */}
        <div className="absolute bottom-0 w-full overflow-hidden leading-[0]">
            <svg className="relative block w-full h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#f0f9ff"></path>
            </svg>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BookOpen className="w-8 h-8 text-primary-600" />}
              title="Academic Excellence"
              desc="Comprehensive curriculum designed for top performance in WAEC, NECO, and JAMB."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-primary-600" />}
              title="Expert Faculty"
              desc="Learn from experienced educators dedicated to student success and mentorship."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-primary-600" />}
              title="Secure Portal"
              desc="Robust digital platform for result checking, payments, and admission processing."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 Merit College of Advanced Studies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-xl shadow-soft hover:shadow-lg transition-all border-t-4 border-primary-500">
    <div className="mb-4 bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;