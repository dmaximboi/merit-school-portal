import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { Briefcase, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const StaffLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // FIXED: Now points to the correct backend route
      const data = await api.post('/staff/login', formData);
      login(data.user, data.token, 'staff');
      navigate('/staff/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-soft border-t-4 border-slate-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
            <Briefcase size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Portal</h1>
          <p className="text-slate-500">Authorized Personnel Only</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 flex items-center gap-2 text-sm">
                <AlertCircle size={16}/> {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label-text">Staff Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="staff@meritcollege.edu.ng"
              required 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="label-text">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              required 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button disabled={loading} className="w-full btn-primary bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : <>Login <ArrowRight size={18}/></>}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center border-t border-slate-100 pt-4">
            <button onClick={() => navigate('/register/staff')} className="text-sm font-semibold text-slate-700 hover:underline">
                New Staff? Register Here
            </button>
            <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:underline">
                Back Home
            </button>
        </div>
      </div>
    </div>
  );
};
export default StaffLogin;