import React, { useState } from 'react';
import { Lock, CreditCard, CheckCircle, X, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const SubscriptionModal = ({ type, onClose, onSuccess }) => {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');

    const fees = {
        cbt: { amount: 2000, duration: '3 months', description: 'Unlimited CBT Practice' },
        quiz: { amount: 500, duration: '1 week', description: 'Reset Quiz Limit' }
    };

    const selectedFee = fees[type] || fees.cbt;

    const handlePayment = async () => {
        setLoading(true);
        try {
            // For now, direct activation (replace with Paystack/Flutterwave later)
            if (type === 'cbt') {
                await api.post('/subscriptions/cbt/activate', {
                    paymentRef: `MANUAL_${Date.now()}`
                }, token);
                alert('CBT Subscription activated for 3 months!');
            } else {
                await api.post('/subscriptions/quiz/unlock', {
                    paymentRef: `MANUAL_${Date.now()}`
                }, token);
                alert('Quiz limit reset successfully!');
            }
            onSuccess && onSuccess();
            onClose();
        } catch (err) {
            alert('Payment failed. Please contact admin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-blue-200 mb-1">
                                {type === 'cbt' ? 'CBT Subscription' : 'Quiz Limit Unlock'}
                            </p>
                            <h2 className="text-3xl font-black">₦{selectedFee.amount.toLocaleString()}</h2>
                            <p className="text-sm text-blue-200 mt-1">{selectedFee.duration}</p>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
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
                                        Access to all subjects
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        Calculator & Whiteboard tools
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        60% question bank + 40% AI-generated questions
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

                    {/* Payment Method */}
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Payment Method</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`p-3 rounded-lg border-2 text-center font-bold text-sm ${paymentMethod === 'card'
                                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                                    : 'border-slate-200 text-slate-600'
                                    }`}
                            >
                                <CreditCard size={20} className="mx-auto mb-1" />
                                Card/Transfer
                            </button>
                            <button
                                onClick={() => setPaymentMethod('ussd')}
                                className={`p-3 rounded-lg border-2 text-center font-bold text-sm ${paymentMethod === 'ussd'
                                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                                    : 'border-slate-200 text-slate-600'
                                    }`}
                            >
                                USSD
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Lock size={20} />
                                Pay ₦{selectedFee.amount.toLocaleString()}
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-500 mt-4">
                        Secure payment. Contact admin if you have issues.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal;
