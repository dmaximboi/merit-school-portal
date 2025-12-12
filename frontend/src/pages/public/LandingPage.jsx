import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Award, Users, ArrowRight, ShieldCheck, 
  Library, Monitor, Trees, GraduationCap, MapPin, Phone, Mail, ChevronRight
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  const [currentBg, setCurrentBg] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const backgrounds = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1577896334614-501d41da71d0?q=80&w=2070&auto=format&fit=crop"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Navigation */}
      <nav className={`bg-white backdrop-blur-md sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled ? 'shadow-lg border-slate-200' : 'border-transparent shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <img 
                  src="/meritlogo.jpg" 
                  alt="Merit Logo" 
                  className="w-14 h-14 object-contain rounded-full shadow-md ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl font-black text-blue-900 tracking-tight leading-none group-hover:text-blue-700 transition-colors">
                  MERIT COLLEGE
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Of Advanced Studies</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/auth')} 
                className="hidden md:block text-slate-600 hover:text-blue-900 font-semibold text-sm uppercase tracking-wide transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                Portal Login
              </button>
              <button 
                onClick={() => navigate('/register/student')} 
                className="bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5 text-sm"
              >
                <span className="hidden sm:inline">Apply Now</span>
                <span className="sm:hidden">Apply</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-blue-900 text-white overflow-hidden min-h-[85vh] flex items-center">
        {backgrounds.map((bg, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentBg ? 'opacity-40' : 'opacity-0'
            }`}
          >
            <img src={bg} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/90 to-transparent"></div>
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-16">
          <div className="max-w-3xl animate-fadeIn">
            <div className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-400/30 text-accent-200 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse"></span>
              2025/2026 Admission Open
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
              Knowledge For<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 via-amber-300 to-accent-500 animate-gradient">
                Advancement
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed max-w-2xl font-light">
              A citadel of learning committed to academic excellence and moral uprightness. 
              We prepare students for global success through rigorous <strong>O-Level, A-Level,</strong> and <strong>JAMB</strong> programs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/register/student')}
                className="group bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-white text-lg px-8 py-4 rounded-xl font-bold shadow-2xl hover:shadow-accent-500/50 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
              >
                Start Application 
                <ShieldCheck size={20} className="group-hover:scale-110 transition-transform"/>
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 border-2 border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all backdrop-blur-md flex items-center justify-center gap-2 group"
              >
                Access Portal 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight size={24} className="text-white/50 rotate-90" />
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-y border-blue-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem number="98%" label="Success Rate" color="from-green-400 to-emerald-500" />
            <StatItem number="15+" label="Expert Staff" color="from-blue-400 to-cyan-500" />
            <StatItem number="Modern" label="Facilities" color="from-purple-400 to-pink-500" />
            <StatItem number="Top" label="Performance" color="from-orange-400 to-amber-500" />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.03),transparent)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight mb-4">
              Why Choose Merit College
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-accent-500 to-blue-600 mx-auto rounded-full"></div>
            <p className="text-slate-600 mt-6 max-w-2xl mx-auto text-lg">
              Experience excellence in education with our world-class facilities and dedicated staff
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<GraduationCap className="w-8 h-8" />} 
              title="Expert Faculty" 
              desc="Seasoned professionals with proven track records in academic excellence."
              color="from-blue-500 to-blue-600"
            />
            <FeatureCard 
              icon={<Library className="w-8 h-8" />} 
              title="Digital Library" 
              desc="Access thousands of e-books, past questions, and learning resources."
              color="from-purple-500 to-purple-600"
            />
            <FeatureCard 
              icon={<Monitor className="w-8 h-8" />} 
              title="Parent Portal" 
              desc="Real-time monitoring of student attendance, performance, and results."
              color="from-teal-500 to-teal-600"
            />
            <FeatureCard 
              icon={<Trees className="w-8 h-8" />} 
              title="Serene Campus" 
              desc="Safe, quiet, and conducive learning environment for focused study."
              color="from-green-500 to-green-600"
            />
            <FeatureCard 
              icon={<Award className="w-8 h-8" />} 
              title="Proven Results" 
              desc="Consistent record of producing top performers in national exams."
              color="from-orange-500 to-orange-600"
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8" />} 
              title="Career Guidance" 
              desc="Professional mentorship and counseling for every student's success."
              color="from-rose-500 to-rose-600"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join hundreds of successful students who chose excellence. Start your application today.
          </p>
          <button 
            onClick={() => navigate('/register/student')}
            className="bg-white text-blue-900 px-10 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-white/20 transition-all transform hover:-translate-y-1 inline-flex items-center gap-3 group"
          >
            Apply for Admission
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/meritlogo.jpg" className="w-12 h-12 rounded-full ring-2 ring-slate-800" alt="Logo" />
                <span className="text-xl font-black text-white tracking-wider">MERIT COLLEGE</span>
              </div>
              <p className="text-sm leading-relaxed">
                Empowering minds, building character, and shaping the future of education in Nigeria since inception.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-sm">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-accent-500 shrink-0 mt-0.5"/> 
                  32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin, Kwara State
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-accent-500 shrink-0"/> 
                  +234 816 698 5866
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-accent-500 shrink-0"/> 
                  olayayemi@gmail.com
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-sm">Quick Access</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button 
                    onClick={()=>navigate('/auth/student')} 
                    className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2 group"
                  >
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    Student Portal
                  </button>
                </li>
                <li>
                  <button 
                    onClick={()=>navigate('/auth/staff')} 
                    className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2 group"
                  >
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    Staff Portal
                  </button>
                </li>
                <li>
                  <button 
                    onClick={()=>navigate('/auth/admin')} 
                    className="hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2 group"
                  >
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    Administration
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-900 text-center">
            <p className="text-sm">&copy; {currentYear} Merit College of Advanced Studies. All Rights Reserved.</p>
            <div className="text-[10px] uppercase tracking-widest opacity-50 mt-2">
              Powered by <span className="font-bold text-white">LearnovaTech</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const StatItem = ({ number, label, color }) => (
  <div className="group cursor-default">
    <div className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${color} mb-2 group-hover:scale-110 transition-transform`}>
      {number}
    </div>
    <div className="text-xs font-bold text-accent-400 uppercase tracking-widest">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc, color }) => (
  <div className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
    
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${color} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
      {icon}
    </div>
    
    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-900 transition-colors">
      {title}
    </h3>
    <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default LandingPage;
