import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const AdminPriceControls = () => {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const [prices, setPrices] = useState({
        cbt_subscription: 2000,
        quiz_unlock: 500
    });

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        try {
            const res = await api.get('/subscriptions/settings', token);
            if (res) {
                setPrices(res);
            }
        } catch (err) {
            console.error('Failed to fetch prices:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await api.post('/subscriptions/settings', prices, token);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError('Failed to save prices');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
                <p className="text-center text-slate-500">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3">
                    <DollarSign size={32} />
                    <div>
                        <h3 className="text-2xl font-black">Subscription Pricing</h3>
                        <p className="text-green-200 text-sm">Manage CBT and Quiz fees</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* CBT Subscription */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                        CBT Subscription Fee (₦)
                    </label>
                    <p className="text-xs text-slate-500">Amount charged for 3 months CBT access</p>
                    <input
                        type="number"
                        value={prices.cbt_subscription}
                        onChange={(e) => setPrices({ ...prices, cbt_subscription: parseInt(e.target.value) || 0 })}
                        className="w-full p-4 border-2 border-slate-200 rounded-xl text-2xl font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                </div>

                {/* Quiz Unlock */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                        Quiz Unlock Fee (₦)
                    </label>
                    <p className="text-xs text-slate-500">Amount charged to reset weekly quiz limit</p>
                    <input
                        type="number"
                        value={prices.quiz_unlock}
                        onChange={(e) => setPrices({ ...prices, quiz_unlock: parseInt(e.target.value) || 0 })}
                        className="w-full p-4 border-2 border-slate-200 rounded-xl text-2xl font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                </div>

                {/* Status Messages */}
                {saved && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
                        <CheckCircle size={20} />
                        Prices saved successfully!
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-70"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Prices
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AdminPriceControls;
