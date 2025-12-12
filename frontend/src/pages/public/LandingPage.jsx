import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Award, Users, ArrowRight, ShieldCheck, 
  Library, Monitor, Trees, GraduationCap, MapPin, Phone
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  // Auto-changing background logic
  const [currentBg, setCurrentBg] = useState(0);
  const backgrounds = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop", // College Building
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop", // Classroom
    "https://images.unsplash.com/photo-1577896334614-501d41da71d0?q=80&w=2070&auto=format&fit=crop"  // Library
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/meritlogo.jpg" alt="Merit Logo" className="w-12 h-12 object-contain rounded-full shadow-sm" />
              <div className="hidden md:block">
                <h1 className="text-2xl font-black text-blue-900 tracking-tighter leading-none">MERIT COLLEGE</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Of Advanced Studies</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-5">
              <button onClick={() => navigate('/auth')} className="text-slate-600 hover:text-blue-900 font-semibold text-sm uppercase tracking-wide transition-colors">
                Portal Login
              </button>
              <button 
                onClick={() => navigate('/register/student')} 
                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5 text-sm"
              >
                Apply Admission <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Auto-Slider */}
      <div className="relative bg-blue-900 text-white overflow-hidden min-h-[650px] flex items-center transition-all duration-1000">
        {backgrounds.map((bg, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBg ? 'opacity-30' : 'opacity-0'}`}
          >
            <img src={bg} alt="Background" className="w-full h-full object-cover" />
          </div>
        ))}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/80 to-transparent z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-accent-500/10 border border-accent-500/20 text-accent-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
              2025/2026 Academic Session
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
              Knowledge For <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-amber-200">
                Advancement
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl font-light opacity-90">
              A citadel of learning committed to academic excellence and moral uprightness. We prepare students for global success through rigorous O-Level, A-Level, and JAMB programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/register/student')}
                className="bg-accent-600 hover:bg-accent-700 text-white text-lg px-8 py-4 rounded-lg font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                Start Application <ShieldCheck size={20}/>
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold transition-all backdrop-blur-sm flex items-center justify-center gap-2"
              >
                Access Portal <ArrowRight size={18}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-blue-950 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-blue-800/30 text-center">
            <StatItem number="98%" label="Success Rate" />
            <StatItem number="Standard" label="& Expert Staff" />
            <StatItem number="Top" label="Facilities" />
            <StatItem number="Excellence" label="Guaranteed" />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">Core Values & Facilities</h2>
            <div className="w-20 h-1.5 bg-accent-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<GraduationCap className="w-7 h-7" />} 
              title="Expert Faculty" 
              desc="Our tutors are seasoned professionals dedicated to student success."
              color="bg-blue-50 text-blue-700"
            />
            <FeatureCard 
              icon={<Library className="w-7 h-7" />} 
              title="Digital Library" 
              desc="Comprehensive collection of e-books and past questions for all exams."
              color="bg-purple-50 text-purple-700"
            />
            <FeatureCard 
              icon={<Monitor className="w-7 h-7" />} 
              title="Parent Portal" 
              desc="Real-time access for parents to monitor attendance and results."
              color="bg-teal-50 text-teal-700"
            />
            <FeatureCard 
              icon={<Trees className="w-7 h-7" />} 
              title="Serene Environment" 
              desc="A quiet, secure, and conducive atmosphere for focused learning."
              color="bg-green-50 text-green-700"
            />
            <FeatureCard 
              icon={<Award className="w-7 h-7" />} 
              title="Proven Excellence" 
              desc="A track record of producing top scorers in national examinations."
              color="bg-orange-50 text-orange-700"
            />
            <FeatureCard 
              icon={<Users className="w-7 h-7" />} 
              title="Mentorship" 
              desc="Guidance counseling and career mentorship for every student."
              color="bg-rose-50 text-rose-700"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-12 text-sm">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/meritlogo.jpg" className="w-10 h-10 rounded-full bg-white p-0.5" alt="Logo" />
              <span className="text-lg font-bold text-white tracking-widest">MERIT COLLEGE</span>
            </div>
            <p>Empowering minds, building character, and shaping the future of education in Nigeria.</p>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3"><MapPin size={18} className="text-accent-500 shrink-0"/> 32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</li>
              <li className="flex items-center gap-3"><Phone size={18} className="text-accent-500 shrink-0"/> +234 816 698 5866</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-2">
              <li><button onClick={()=>navigate('/auth/student')} className="hover:text-white transition">Student Portal</button></li>
              <li><button onClick={()=>navigate('/auth/staff')} className="hover:text-white transition">Staff Portal</button></li>
              <li><button onClick={()=>navigate('/auth/admin')} className="hover:text-white transition">Administration</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-900 text-center flex flex-col items-center gap-2">
          <p>&copy; {currentYear} Merit College of Advanced Studies. All Rights Reserved.</p>
          <div className="text-[10px] uppercase tracking-widest opacity-60">
            Powered by <span className="font-bold text-white">LearnovaTech</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const StatItem = ({ number, label }) => (
  <div className="flex flex-col items-center justify-center p-4">
    <div className="text-3xl md:text-4xl font-black text-white mb-2">{number}</div>
    <div className="text-xs font-bold text-accent-400 uppercase tracking-widest">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc, color }) => (
  <div className="group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${color} bg-white shadow-sm group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default LandingPage;
