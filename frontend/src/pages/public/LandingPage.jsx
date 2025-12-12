import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Award, Users, ArrowRight, ShieldCheck, 
  Library, Monitor, Trees, GraduationCap, Phone, MapPin 
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* --- NAVIGATION --- */}
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img 
                src="/meritlogo.jpg" 
                alt="Merit Logo" 
                className="w-12 h-12 object-contain"
              />
              <div className="hidden md:block">
                <h1 className="text-xl font-black text-blue-900 tracking-tight leading-none">MERIT COLLEGE</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Of Advanced Studies</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/auth')} className="text-slate-600 hover:text-blue-900 font-semibold transition-colors">
                Portal Login
              </button>
              <button 
                onClick={() => navigate('/register/student')} 
                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                Apply for Admission <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative bg-blue-900 text-white overflow-hidden min-h-[600px] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="University Campus" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/90 to-blue-900/40"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-block bg-accent-500/20 text-accent-400 border border-accent-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              2025/2026 Admissions Open
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Building Leaders <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-amber-200">
                Through Excellence
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl font-light">
              We bridge the gap between secondary school and university success. 
              Join a community dedicated to academic rigor, moral integrity, and advanced learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/register/student')}
                className="bg-accent-600 hover:bg-accent-700 text-white text-lg px-8 py-4 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Start Application <ShieldCheck size={20}/>
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 border-2 border-white/30 hover:border-white hover:bg-white/10 text-white rounded-lg font-bold transition-all backdrop-blur-sm"
              >
                Access Student Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS BANNER --- */}
      <div className="bg-blue-950 py-10 border-b border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-blue-800/50">
            <StatItem number="98%" label="Exam Success Rate" />
            <StatItem number="15+" label="Years of Excellence" />
            <StatItem number="50+" label="Expert Staff" />
            <StatItem number="1000+" label="Alumni Network" />
          </div>
        </div>
      </div>

      {/* --- CORE PILLARS SECTION --- */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-blue-900 font-black text-3xl md:text-4xl uppercase tracking-tight">Why Choose Merit College?</h2>
            <div className="w-24 h-1.5 bg-accent-500 mx-auto mt-4 rounded-full"></div>
            <p className="text-slate-600 mt-4 max-w-2xl mx-auto text-lg">
              We provide a holistic educational experience that combines traditional academic values with modern technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<GraduationCap className="w-8 h-8" />}
              title="Expert Tutors"
              desc="Learn from seasoned educators and examiners who understand the nuances of WAEC, NECO, JAMB, and A-Level curriculums."
              color="bg-blue-50 text-blue-700"
            />
            <FeatureCard 
              icon={<Library className="w-8 h-8" />}
              title="Modern Library"
              desc="Access a vast collection of physical and digital resources. Our e-library is accessible 24/7 via the student portal."
              color="bg-purple-50 text-purple-700"
            />
            <FeatureCard 
              icon={<Monitor className="w-8 h-8" />}
              title="Parental Access"
              desc="Real-time monitoring for guardians. Check attendance, academic performance, and payment status from anywhere in the world."
              color="bg-teal-50 text-teal-700"
            />
            <FeatureCard 
              icon={<Trees className="w-8 h-8" />}
              title="Conducive Environment"
              desc="Located in a serene, secure, and noise-free environment perfect for focused learning and mental growth."
              color="bg-green-50 text-green-700"
            />
            <FeatureCard 
              icon={<Award className="w-8 h-8" />}
              title="Proven Track Record"
              desc="Consistently producing top scorers in national examinations with a high university admission rate."
              color="bg-orange-50 text-orange-700"
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title="Mentorship Program"
              desc="Every student is assigned an academic mentor to guide their career path and university choices."
              color="bg-rose-50 text-rose-700"
            />
          </div>
        </div>
      </div>

      {/* --- ABOUT / IMAGE SECTION --- */}
      <div className="py-20 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Students Studying" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-white font-bold text-lg">"Knowledge for Advancement"</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 space-y-6">
              <h2 className="text-3xl font-bold text-blue-900">A Tradition of Academic Excellence</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                At Merit College of Advanced Studies, we believe that education is not just about passing exams, but about shaping character. 
                Our tailored programs for JAMB, A-Level, and O-Level students are designed to unlock potential and pave the way for university success.
              </p>
              <ul className="space-y-4">
                <ListItem text="State-of-the-art Computer Based Test (CBT) Center" />
                <ListItem text="Dedicated Science Laboratories" />
                <ListItem text="Interactive & Digital Learning Tools" />
              </ul>
              <button onClick={() => navigate('/register/student')} className="mt-4 text-blue-700 font-bold hover:text-blue-900 flex items-center gap-2 group">
                Begin Admission Process <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <img src="/meritlogo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-white tracking-widest">MERIT COLLEGE</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              The premier institution for advanced studies, committed to breeding intellectuals with integrity and excellence.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest mb-6 text-sm">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-accent-500 shrink-0" size={18} />
                <span>32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin, Kwara State.</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-accent-500 shrink-0" size={18} />
                <span>+234 816 698 5866</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest mb-6 text-sm">Portals</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/auth/student')} className="hover:text-white transition">Student Portal</button></li>
              <li><button onClick={() => navigate('/auth/parent')} className="hover:text-white transition">Parent Portal</button></li>
              <li><button onClick={() => navigate('/auth/staff')} className="hover:text-white transition">Staff Portal</button></li>
              <li><button onClick={() => navigate('/auth/admin')} className="hover:text-white transition">Administration</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} Merit College of Advanced Studies. All Rights Reserved.
          </p>
          <div className="mt-2 text-[10px] text-slate-600 flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
            <span>Powered by</span>
            <span className="font-bold text-slate-400">LearnovaTech</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Sub Components ---

const StatItem = ({ number, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl md:text-4xl font-black text-white mb-1">{number}</span>
    <span className="text-xs md:text-sm text-blue-200 uppercase tracking-widest font-medium">{label}</span>
  </div>
);

const FeatureCard = ({ icon, title, desc, color }) => (
  <div className="group p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${color} group-hover:bg-blue-900 group-hover:text-white`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
  </div>
);

const ListItem = ({ text }) => (
  <li className="flex items-center gap-3 text-slate-700">
    <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
    {text}
  </li>
);

export default LandingPage;
