import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFlutterwave } from 'flutterwave-react-v3';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { Loader2, ShieldCheck, Lock, CreditCard, ChevronLeft } from 'lucide-react';

const StudentPayment = () => {
    const { user, token, refreshProfile } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);

    // Get payment details from navigation state or fallback
    const amount = location.state?.amount || 1500; // Default CBT Price
    const purpose = location.state?.purpose || 'CBT Subscription';

    // Generate a unique transaction reference
    const [txRef, setTxRef] = useState(`MCAS-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

    // Configuration for Flutterwave
    const config = {
        public_key: import.meta.env.VITE_FLW_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOX-DEMO-KEY', // Fallback for safety, USER SHOULD SET THIS
        tx_ref: txRef,
        amount: amount,
        currency: 'NGN',
        payment_options: 'card,ussd,banktransfer',
        customer: {
            email: user?.email,
            phonenumber: user?.phone_number,
            name: `${user?.surname} ${user?.first_name}`,
        },
        customizations: {
            title: 'Merit College Payments',
            description: `Payment for ${purpose}`,
            logo: 'https://meritschooling.com/meritlogo.jpg', // Ensure this URL is valid or use relative if supported
        },
    };

    const handleFlutterwavePayment = useFlutterwave(config);

    const verifyPayment = async (response) => {
        setVerifying(true);
        try {
            // Call Backend to Verify
            const res = await api.post('/students/verify-payment', {
                transaction_id: response.transaction_id,
                tx_ref: response.tx_ref,
                status: response.status
            });

            if (res.success) {
                alert("Payment Successful! Access Granted.");
                // Refresh user profile to update subscription status
                if (refreshProfile) await refreshProfile();

                // Navigate back to origin or dashboard
                navigate('/student/dashboard');
            } else {
                setError("Payment Verification Failed. Please contact support.");
            }
        } catch (err) {
            console.error("Verification Error:", err);
            setError(err.message || "An error occurred during verification.");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-blue-900 p-6 text-white text-center">
                    <ShieldCheck className="mx-auto mb-3 text-green-400" size={40} />
                    <h1 className="text-2xl font-black tracking-tight">Secure Payment</h1>
                    <p className="text-blue-200 text-sm mt-1">Merit College of Advanced Studies</p>
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Payment For</span>
                        <span className="font-bold text-slate-900">{purpose}</span>
                    </div>

                    <div className="flex justify-between items-center mb-8">
                        <span className="text-slate-500 font-medium">Amount Due</span>
                        <span className="text-3xl font-black text-slate-900">₦{amount.toLocaleString()}</span>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 text-xs font-bold p-4 rounded-xl border border-red-100 text-center flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2">
                                <AlertTriangle size={16} />
                                <span>Payment Error</span>
                            </div>
                            <p>{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-blue-600 hover:underline mt-1"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {verifying ? (
                        <div className="text-center py-8 bg-blue-50 rounded-2xl border border-blue-100 animate-pulse">
                            <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={32} />
                            <p className="text-blue-900 font-bold uppercase tracking-wider text-xs">Verifying Transaction...</p>
                            <p className="text-[10px] text-blue-500 mt-1">Please do not refresh or close this page.</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setError(null);
                                if (!config.public_key || config.public_key.includes('DEMO-KEY')) {
                                    return setError("Merchant Payment Key is missing or invalid. Please contact administrator.");
                                }

                                try {
                                    handleFlutterwavePayment({
                                        callback: (response) => {
                                            if (response.status === "successful" || response.status === "completed") {
                                                verifyPayment(response);
                                            } else {
                                                setError("Payment was not successful. Please try again.");
                                            }
                                        },
                                        onClose: () => {
                                            setLoading(false);
                                        },
                                    });
                                } catch (err) {
                                    setError("Failed to initialize payment gateway: " + err.message);
                                }
                            }}
                            disabled={loading}
                            className="w-full bg-blue-900 hover:bg-blue-800 text-white py-5 rounded-xl font-bold shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
                            {loading ? 'Processing...' : 'Pay Securely Now'}
                        </button>
                    )}

                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                        <Lock size={12} />
                        Secured by Flutterwave
                    </div>
                </div>
            </div>

            <button
                onClick={() => navigate(-1)}
                className="mt-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition"
            >
                <ChevronLeft size={18} /> Cancel & Go Back
            </button>
        </div>
    );
};

export default StudentPayment;
