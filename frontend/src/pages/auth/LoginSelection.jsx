import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Lock, Users } from 'lucide-react';

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">Select Your Portal</h1>
          <p className="text-slate-600 text-lg">Choose your role to sign in to the Merit College System</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoginCard 
            title="Student Portal" 
            desc="Access dashboard, check results, and print admission letters."
            icon={<GraduationCap className="w-10 h-10" />}
            onClick={() => navigate('/auth/student')}
            color="primary"
          />
          <LoginCard 
            title="Staff Portal" 
            desc="Manage classes, upload results, and staff resources."
            icon={<Briefcase className="w-10 h-10" />}
            onClick={() => navigate('/auth/staff')}
            color="slate"
          />
           <LoginCard 
            title="Parent Portal" 
            desc="Monitor ward's performance and fee payments."
            icon={<Users className="w-10 h-10" />}
            onClick={() => navigate('/auth/parent')}
            color="teal"
          />
          <LoginCard 
            title="Admin Access" 
            desc="System management and administrative controls."
            icon={<Lock className="w-10 h-10" />}
            onClick={() => navigate('/auth/admin')}
            color="red"
            className="lg:col-span-3 lg:w-1/3 lg:mx-auto"
          />
        </div>
        
        <div className="mt-12 text-center">
            <button onClick={() => navigate('/')} className="text-primary-600 font-semibold hover:underline">
                &larr; Back to Homepage
            </button>
        </div>
      </div>
    </div>
  );
};

const LoginCard = ({ title, desc, icon, onClick, color, className = "" }) => {
    // Simple mapping for border colors
    const colors = {
        primary: "border-primary-500 hover:bg-primary-50",
        slate: "border-slate-500 hover:bg-slate-50",
        red: "border-red-500 hover:bg-red-50",
        teal: "border-teal-500 hover:bg-teal-50"
    };

    return (
        <button 
            onClick={onClick}
            className={`bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 text-left group ${colors[color]} ${className}`}
        >
            <div className="mb-4 text-slate-700 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600">{desc}</p>
        </button>
    );
};

export default LoginSelection;