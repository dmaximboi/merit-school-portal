import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { GraduationCap, Lock, ArrowRight, AlertTriangle } from 'lucide-react';

const StudentLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Robust Login Call
      const data = await api.post('/auth/student/login', formData);

      // Save to Store
      login(data.user, data.token, 'student');

      // Redirect
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-soft">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-primary-100">
            <img src="/meritlogo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-primary-900">Student Portal</h1>
          <p className="text-slate-500">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label-text">Student ID or Email</label>
            <input
              type="text"
              className="input-field"
              placeholder="MCAS/..."
              value={formData.identifier}
              onChange={e => setFormData({ ...formData, identifier: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label-text">Password</label>
            <div className="relative">
              <input
                type="password"
                className="input-field pl-10"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => navigate('/auth/forgot-password')} className="text-xs font-bold text-primary-600 hover:text-primary-800 hover:underline">
              Forgot Password?
            </button>
          </div>


          <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3 text-lg">
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Don't have an account? <button onClick={() => navigate('/register/student')} className="text-primary-600 font-bold hover:underline">Register Here</button></p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;