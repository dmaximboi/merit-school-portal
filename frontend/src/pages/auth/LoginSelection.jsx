import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, UserCog, Lock, Users, ArrowLeft, School } from 'lucide-react';

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform -rotate-6 overflow-hidden border-2 border-blue-900">
            <img src="/meritlogo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Portal Access</h1>
          <p className="text-slate-500 text-sm">Select your account type to proceed</p>
        </div>

        {/* Keypad Grid Layout */}
        <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-3xl shadow-xl border border-slate-200">
          <LoginCard
            title="Student"
            icon={<GraduationCap size={28} />}
            onClick={() => navigate('/auth/student')}
            color="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
          />
          <LoginCard
            title="Staff"
            icon={<UserCog size={28} />} // Changed Icon as requested
            onClick={() => navigate('/auth/staff')}
            color="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white"
          />
          <LoginCard
            title="Parent"
            icon={<Users size={28} />}
            onClick={() => navigate('/auth/parent')}
            color="bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white"
          />
          <LoginCard
            title="Admin"
            icon={<Lock size={28} />}
            onClick={() => navigate('/auth/admin')}
            color="bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white"
          />
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginCard = ({ title, icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center 
      aspect-square rounded-2xl transition-all duration-300
      ${color} group
    `}
  >
    <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <span className="font-bold text-sm uppercase tracking-wider">{title}</span>
  </button>
);

export default LoginSelection;
