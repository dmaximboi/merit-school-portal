import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Clock, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import SubscriptionModal from './SubscriptionModal';

const QuizLimitBanner = ({ onUpdate }) => {
    const { token } = useAuthStore();
    const [limits, setLimits] = useState(null);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLimits();
    }, []);

    const fetchLimits = async () => {
        try {
            const res = await api.get('/subscriptions/quiz/limits', token);
            setLimits(res);
        } catch (err) {
            console.error('Failed to fetch quiz limits:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !limits) return null;

    const dailyPercent = (limits.questionsToday / limits.dailyLimit) * 100;
    const weeklyPercent = (limits.questionsThisWeek / limits.weeklyLimit) * 100;
    const limitReached = !limits.canTakeQuiz;

    return (
        <>
            <div className={`p-4 rounded-xl border-2 mb-6 ${limitReached
                ? 'bg-red-50 border-red-200'
                : dailyPercent > 80 || weeklyPercent > 80
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {limitReached ? (
                            <AlertTriangle className="text-red-600" size={24} />
                        ) : (
                            <Zap className="text-blue-600" size={24} />
                        )}
                        <div>
                            <h4 className="font-bold text-slate-800">
                                {limitReached ? 'Quiz Limit Reached!' : 'Quiz Usage'}
                            </h4>
                            <p className="text-sm text-slate-600">
                                {limitReached
                                    ? 'Unlock for ₦500 to continue'
                                    : `Daily: ${limits.questionsToday}/${limits.dailyLimit} | Weekly: ${limits.questionsThisWeek}/${limits.weeklyLimit}`
                                }
                            </p>
                        </div>
                    </div>

                    {limitReached && (
                        <button
                            onClick={() => setShowUnlockModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Zap size={16} />
                            Unlock Now
                        </button>
                    )}
                </div>

                {/* Progress Bars */}
                {!limitReached && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>Daily ({limits.questionsToday}/{limits.dailyLimit})</span>
                                <span>{Math.round(dailyPercent)}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${dailyPercent > 80 ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${Math.min(100, dailyPercent)}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>Weekly ({limits.questionsThisWeek}/{limits.weeklyLimit})</span>
                                <span>{Math.round(weeklyPercent)}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${weeklyPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.min(100, weeklyPercent)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showUnlockModal && (
                <SubscriptionModal
                    type="quiz"
                    onClose={() => setShowUnlockModal(false)}
                    onSuccess={() => {
                        fetchLimits();
                        onUpdate && onUpdate();
                    }}
                />
            )}
        </>
    );
};

export default QuizLimitBanner;
