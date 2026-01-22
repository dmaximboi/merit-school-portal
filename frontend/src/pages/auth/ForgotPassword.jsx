import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.includes('@gmail.com')) return setError('Only Gmail addresses are supported.');

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            setError(err.message || "Failed to send reset link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <Link to="/" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold mb-6">
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">Forgot Password?</h1>
                    <p className="text-slate-500 mt-2">Enter your registered Gmail address to receive a secure reset link.</p>
                </div>

                {sent ? (
                    <div className="text-center bg-green-50 p-6 rounded-xl border border-green-100 animate-fadeIn">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="font-bold text-green-800 text-lg">Check your Inbox!</h3>
                        <p className="text-green-700 text-sm mt-1">We've sent a magic link to <strong>{email}</strong></p>
                        <div className="mt-6">
                            <button onClick={() => setSent(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 underline">Try another email</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="label-text">Email Address</label>
                            <input type="email" placeholder="student@gmail.com" className="input-field w-full" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required />
                            {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-3 rounded-xl font-bold hover:shadow-lg transition flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : 'Send Magic Link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
