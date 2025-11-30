import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { Users, Key, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

const ParentLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ studentId: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Robust Parent Authentication Call
      const data = await api.post('/parents/login', formData);
      
      // Store parent session securely
      login(data.student, 'parent-session-token', 'parent');
      navigate('/parent/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid Student ID or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-soft border-t-4 border-teal-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
            <Users size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Parent Portal</h1>
          <p className="text-slate-500">Secure Access for Guardians</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <ShieldCheck size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="label-text">Student ID</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. MCAS/SCI/25/001"
              required 
              value={formData.studentId}
              onChange={e => setFormData({...formData, studentId: e.target.value})}
            />
          </div>
          <div>
            <label className="label-text">Password</label>
            <div className="relative">
                <input 
                type="password" 
                className="input-field pl-10" 
                placeholder="Default: Student Surname"
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <Key className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
            <p className="text-xs text-slate-400 mt-1 italic">
              Note: Default password is the Student's Surname (Case Sensitive)
            </p>
          </div>

          <button 
            disabled={loading} 
            className="w-full btn-primary bg-teal-700 hover:bg-teal-800 justify-center py-3 text-lg"
          >
            {loading ? <Loader2 className="animate-spin"/> : <>Access Portal <ArrowRight size={18}/></>}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-teal-700 transition">
            &larr; Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentLogin;