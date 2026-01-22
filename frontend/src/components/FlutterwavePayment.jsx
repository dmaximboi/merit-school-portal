/**
 * Flutterwave Payment Component
 * Handles payment initialization and verification for CBT/Quiz subscriptions
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, CheckCircle, XCircle, Zap, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const FlutterwavePayment = ({ type = 'cbt', onSuccess, onClose }) => {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [prices, setPrices] = useState({ cbt: 2000, quiz: 500 });
    const [status, setStatus] = useState('idle'); // idle, processing, success, failed

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        try {
            const res = await api.get('/payments/prices');
            if (res) setPrices(res);
        } catch (err) {
            console.error('Failed to fetch prices:', err);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        setStatus('processing');

        try {
            // Initialize payment
            const res = await api.post('/payments/initialize', {
                type,
                amount: type === 'cbt' ? prices.cbt : prices.quiz
            }, token);

            if (res.success && res.paymentData) {
                // Open Flutterwave checkout
                openFlutterwaveCheckout(res.paymentData, res.txRef);
            } else {
                throw new Error('Failed to initialize payment');
            }
        } catch (err) {
            console.error('Payment error:', err);
            setStatus('failed');
            setLoading(false);
        }
    };

    const openFlutterwaveCheckout = (paymentData, txRef) => {
        // Load Flutterwave inline script if not loaded
        if (typeof FlutterwaveCheckout === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://checkout.flutterwave.com/v3.js';
            script.async = true;
            script.onload = () => initiateCheckout(paymentData, txRef);
            document.body.appendChild(script);
        } else {
            initiateCheckout(paymentData, txRef);
        }
    };

    const initiateCheckout = (paymentData, txRef) => {
        window.FlutterwaveCheckout({
            ...paymentData,
            callback: async (response) => {
                // Payment completed, verify on backend
                try {
                    const verification = await api.post('/payments/verify', {
                        transaction_id: response.transaction_id,
                        tx_ref: txRef
                    }, token);

                    if (verification.success) {
                        setStatus('success');
                        onSuccess && onSuccess();
                    } else {
                        setStatus('failed');
                    }
                } catch (err) {
                    console.error('Verification error:', err);
                    setStatus('failed');
                }
                setLoading(false);
            },
            onclose: () => {
                if (status !== 'success') {
                    setStatus('idle');
                    setLoading(false);
                }
            }
        });
    };

    const amount = type === 'cbt' ? prices.cbt : prices.quiz;
    const description = type === 'cbt'
        ? 'CBT Subscription (3 months - Unlimited Access)'
        : 'Quiz Limit Unlock (Reset Weekly Limit)';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-blue-200 mb-1">
                                {type === 'cbt' ? 'CBT Subscription' : 'Quiz Unlock'}
                            </p>
                            <h2 className="text-3xl font-black">₦{amount.toLocaleString()}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-1"
                            disabled={loading}
                        >
                            <XCircle size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {status === 'success' ? (
                        <div className="text-center py-8">
                            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-xl font-bold text-green-700">Payment Successful!</h3>
                            <p className="text-slate-600 mt-2">
                                Your {type === 'cbt' ? 'CBT subscription' : 'quiz limit'} has been activated.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                            >
                                Continue
                            </button>
                        </div>
                    ) : status === 'failed' ? (
                        <div className="text-center py-8">
                            <XCircle size={64} className="mx-auto text-red-500 mb-4" />
                            <h3 className="text-xl font-bold text-red-700">Payment Failed</h3>
                            <p className="text-slate-600 mt-2">
                                Something went wrong. Please try again.
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
                                <h3 className="font-bold text-blue-900 mb-2">What you get:</h3>
                                <ul className="space-y-2 text-sm text-blue-800">
                                    {type === 'cbt' ? (
                                        <>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-green-600" />
                                                Unlimited CBT Practice for 3 months
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-green-600" />
                                                Access to all subjects & topics
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-green-600" />
                                                Calculator & Whiteboard tools
                                            </li>
                                        </>
                                    ) : (
                                        <>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-green-600" />
                                                Reset your weekly quiz limit
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-green-600" />
                                                30 additional questions for the week
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>

                            {/* Security Badge */}
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                                <Shield size={16} />
                                <span>Secured by Flutterwave</span>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={20} />
                                        Pay ₦{amount.toLocaleString()}
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-slate-500 mt-4">
                                You'll be redirected to complete payment securely.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlutterwavePayment;
