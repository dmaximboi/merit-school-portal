import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Lock, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionInfo, setSessionInfo] = useState(null);

    useEffect(() => {
        // Supabase handles the session automatically from the URL hash usually,
        // but in some flows we might need to manually set it.
        // However, the standard redirect flow logs them in.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionInfo(session);
            } else {
                // If no session, wait a bit or redirect. 
                // On password reset redirect, the URL contains access_token.
                // Supabase JS client usually parses this.
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionInfo(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        if (password.length < 6) return alert("Password too short.");

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            alert("Password Updated Successfully! Redirecting to login...");
            navigate('/auth/student');
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!sessionInfo) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-900 mx-auto mb-4" />
                <h2 className="font-bold text-xl">Verifying Magic Link...</h2>
                <p className="text-slate-500 text-sm mt-2">If this takes too long, the link may have expired.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">Set New Password</h1>
                    <p className="text-slate-500 mt-2">Secure your account with a strong password.</p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">
                    <div>
                        <label className="label-text">New Password</label>
                        <input
                            type="password"
                            className="input-field w-full"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
