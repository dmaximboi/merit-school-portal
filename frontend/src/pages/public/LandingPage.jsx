import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Award, Users, ArrowRight, ShieldCheck,
  Library, Monitor, Trees, GraduationCap, MapPin, Phone,
  ChevronRight, Star
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // ROTATING BACKGROUNDS (9 Professional Images)
  const [currentBg, setCurrentBg] = useState(0);
  const backgrounds = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=2074&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592280771800-bcf9de2cb729?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100">

      {/* --- NAVIGATION (Glassmorphism) --- */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src="/meritlogo.jpg" alt="Merit Logo" className="relative w-12 h-12 object-contain rounded-full border-2 border-white shadow-md" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">MERIT COLLEGE</h1>
                <p className="text-[10px] text-blue-700 font-bold uppercase tracking-[0.25em] mt-0.5">Of Advanced Studies</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate('/auth')}
                className="text-slate-600 hover:text-blue-900 font-bold text-sm uppercase tracking-wide transition-colors"
              >
                Portal Login
              </button>
              <button
                onClick={() => navigate('/register/student')}
                className="bg-slate-900 hover:bg-blue-900 text-white px-7 py-3 rounded-full font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                Apply Now <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">

        {/* Background Slider */}
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${index === currentBg ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
            <img
              src={bg}
              alt="Background"
              className="w-full h-full object-cover transform scale-105 animate-slow-zoom"
            />
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left w-full mt-16">
          <div className="md:w-3/4 lg:w-2/3">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Admissions Open for 2025/2026
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tight drop-shadow-lg animate-fade-in-up delay-100">
              Knowledge For <br />
              <span className="text-amber-400">
                Advancement
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-100 mb-10 leading-relaxed font-light max-w-2xl drop-shadow-md animate-fade-in-up delay-200">
              Experience world-class education designed for the future. We bridge the gap between secondary school and university success with integrity and excellence.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
              <button
                onClick={() => navigate('/register/student')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-xl font-bold shadow-xl shadow-blue-900/30 transition-all flex items-center justify-center gap-3"
              >
                <ShieldCheck size={20} /> Start Application
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3"
              >
                Access Portal <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-20 opacity-70 animate-bounce">
          <span className="text-xs text-white uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </div>

      {/* --- STATS BANNER (Floating Glass) --- */}
      <div className="relative z-30 -mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>

          <StatItem number="98%" label="Success Rate" />
          <StatItem number="50+" label="Expert Staff" />
          <StatItem number="1st" label="Choice School" />
          <StatItem number="100%" label="Satisfaction" />
        </div>
      </div>

      {/* --- FEATURES SECTION (Canvas Grid) --- */}
      <div className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-20 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Why Choose Merit?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We provide a holistic environment where academic excellence meets moral discipline.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BentoCard
              icon={<GraduationCap className="text-blue-600" size={32} />}
              title="Expert Faculty"
              desc="Learn from industry veterans and top-tier educators dedicated to your success."
              className="md:col-span-2 bg-white"
            />
            <BentoCard
              icon={<Library className="text-purple-600" size={32} />}
              title="Modern Library"
              desc="24/7 access to physical and digital resources for limitless learning."
              className="bg-purple-50 border-purple-100"
            />
            <BentoCard
              icon={<Monitor className="text-teal-600" size={32} />}
              title="Parent Portal"
              desc="Real-time monitoring of wards' performance and attendance."
              className="bg-teal-50 border-teal-100"
            />
            <BentoCard
              icon={<Trees className="text-green-600" size={32} />}
              title="Serene Environment"
              desc="A peaceful, secure campus designed for focused academic pursuits."
              className="md:col-span-2 bg-white"
            />
            <BentoCard
              icon={<Award className="text-amber-600" size={32} />}
              title="Proven Excellence"
              desc="Consistent top-tier results in WAEC, NECO, and JAMB."
              className="bg-white"
            />
            <BentoCard
              icon={<Users className="text-rose-600" size={32} />}
              title="Mentorship"
              desc="Personalized career guidance for every student."
              className="bg-white"
            />
            <div className="md:col-span-1 bg-slate-900 rounded-3xl p-8 flex flex-col justify-center text-white shadow-xl">
              <Star className="text-amber-400 mb-4" size={40} fill="currentColor" />
              <h3 className="text-2xl font-bold mb-2">Join the Best</h3>
              <p className="text-slate-400 mb-6">Become part of our success story today.</p>
              <button onClick={() => navigate('/register/student')} className="text-white font-bold underline hover:text-amber-400 transition">Apply Now</button>
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER WITH MAP --- */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src="/meritlogo.jpg" className="w-10 h-10 object-contain" alt="Logo" />
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">MERIT COLLEGE</span>
              </div>
              <p className="text-slate-500 leading-relaxed max-w-sm">
                Empowering the next generation of leaders through academic rigor, character development, and advanced learning technologies.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-6">Contact</h4>
              <ul className="space-y-4 text-slate-600">
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-blue-600 shrink-0" />
                  <span className="text-sm">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={20} className="text-blue-600 shrink-0" />
                  <span className="text-sm">+234 816 698 5866</span>
                </li>
              </ul>

              {/* GOOGLE MAP EMBED - Below Address */}
              <div className="mt-4 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3946.5!2d4.55!3d8.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103741a8f7e32c85%3A0x4a9bf57eb6f3e0a1!2sIlorin%2C%20Kwara%20State%2C%20Nigeria!5e0!3m2!1sen!2sng!4v1705500000000!5m2!1sen!2sng"
                  width="100%"
                  height="150"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Merit College Location"
                ></iframe>
              </div>
              <a
                href="https://maps.app.goo.gl/7RVapbRn8KhCG8bk9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-blue-600 hover:underline font-medium"
              >
                Open in Google Maps →
              </a>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-6">Portals</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><button onClick={() => navigate('/auth/student')} className="hover:text-blue-600 transition">Student Login</button></li>
                <li><button onClick={() => navigate('/auth/staff')} className="hover:text-blue-600 transition">Staff Login</button></li>
                <li><button onClick={() => navigate('/auth/parent')} className="hover:text-blue-600 transition">Parent Login</button></li>
                <li><button onClick={() => navigate('/auth/admin')} className="hover:text-blue-600 transition">Administration</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">
              &copy; {currentYear} Merit College of Advanced Studies. All Rights Reserved.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Powered by <span className="text-slate-900 font-bold">LearnovaTech</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Components ---
const StatItem = ({ number, label }) => (
  <div className="text-center relative group">
    <div className="text-4xl md:text-5xl font-black text-slate-900 mb-2 group-hover:scale-110 transition-transform duration-300">
      {number}
    </div>
    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
  </div>
);

const BentoCard = ({ icon, title, desc, className }) => (
  <div className={`p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${className}`}>
    <div className="mb-6">{icon}</div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default LandingPage;
