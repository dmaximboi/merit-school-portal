import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Lock, Users, ArrowLeft } from 'lucide-react';

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-900 rounded-b-[50px] -z-10" />
      
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Select Your Portal</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Welcome to the Merit College System. Please choose your role below to securely access your dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          <LoginCard 
            title="Student Portal" 
            desc="Access your dashboard, check academic results, and print admission letters."
            icon={<GraduationCap size={32} />}
            onClick={() => navigate('/auth/student')}
            color="blue"
          />
          
          <LoginCard 
            title="Staff Portal" 
            desc="Manage classes, input grades, and access staff resources."
            icon={<Briefcase size={32} />}
            onClick={() => navigate('/auth/staff')}
            color="purple"
          />
          
           <LoginCard 
            title="Parent Portal" 
            desc="Monitor your ward's academic performance and verify fee payments."
            icon={<Users size={32} />}
            onClick={() => navigate('/auth/parent')}
            color="teal"
          />
          
          <LoginCard 
            title="Admin Access" 
            desc="System configuration, user management, and administrative controls."
            icon={<Lock size={32} />}
            onClick={() => navigate('/auth/admin')}
            color="red"
          />
        </div>
        
        <div className="mt-12 text-center">
            <button 
                onClick={() => navigate('/')} 
                className="inline-flex items-center gap-2 text-slate-500 font-semibold hover:text-blue-900 transition-colors py-2 px-4 rounded-lg hover:bg-slate-200"
            >
                <ArrowLeft size={18} /> Back to Homepage
            </button>
        </div>
      </div>
    </div>
  );
};

const LoginCard = ({ title, desc, icon, onClick, color }) => {
    // Color configurations for dynamic styling
    const themes = {
        blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   hover: "group-hover:bg-blue-600 group-hover:text-white" },
        purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", hover: "group-hover:bg-purple-600 group-hover:text-white" },
        teal:   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   hover: "group-hover:bg-teal-600 group-hover:text-white" },
        red:    { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    hover: "group-hover:bg-red-600 group-hover:text-white" },
    };

    const theme = themes[color] || themes.blue;

    return (
        <button 
            onClick={onClick}
            className={`
                relative bg-white p-8 rounded-2xl shadow-sm border ${theme.border}
                hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                text-left group w-full flex flex-col items-start h-full
            `}
        >
            <div className={`
                mb-6 p-4 rounded-xl ${theme.bg} ${theme.text} 
                ${theme.hover} transition-colors duration-300 shadow-sm
            `}>
                {icon}
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-900 transition-colors">
                {title}
            </h3>
            
            <p className="text-slate-500 leading-relaxed text-sm">
                {desc}
            </p>
        </button>
    );
};

export default LoginSelection;
