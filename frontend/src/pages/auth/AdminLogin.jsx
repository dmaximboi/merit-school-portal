import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert } from 'lucide-react';

// Setup Supabase Client locally for this file if env vars aren't ready yet to prevent crash
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''; 
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!supabase) return alert("Supabase keys missing in .env");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/schmngt/dashboard' }
      });
      if (error) throw error;
    } catch (err) { alert('Auth failed: ' + err.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-soft border-t-4 border-red-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><ShieldAlert size={32} /></div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-xs text-red-500 mt-2">Restricted, Sorry</p>
        </div>
        <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-3 border flex items-center justify-center gap-3 rounded-lg hover:bg-slate-50 transition font-medium text-slate-700">
          {loading ? "Redirecting..." : "Sign in with Google"}
        </button>
        <button onClick={() => navigate('/')} className="w-full mt-6 text-sm text-slate-500 hover:underline">Back Home</button>
      </div>
    </div>
  );
};
export default AdminLogin;