import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/api';
import { SUBJECTS_LIST, CBT_SUBSCRIPTION_PRICE } from '../../../lib/constants';
import {
    BookOpen, Clock, ChevronRight, Loader2, CheckCircle, AlertCircle, Zap, CreditCard
} from 'lucide-react';

const CbtSetup = () => {
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [checkingSubscription, setCheckingSubscription] = useState(true);

    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [totalTime, setTotalTime] = useState(60);
    const [questionCounts, setQuestionCounts] = useState({});
    const [difficulty, setDifficulty] = useState('Medium');

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        setCheckingSubscription(true);
        try {
            const res = await api.get(`/students/profile/${user.id}`, token);
            const isActive = res.student?.cbt_subscription_active;
            const expires = res.student?.cbt_subscription_expires;
            setSubscriptionStatus({
                active: isActive && (!expires || new Date(expires) > new Date()),
                expires
            });
        } catch (err) {
            console.error('Subscription check failed:', err);
            setSubscriptionStatus({ active: false });
        } finally {
            setCheckingSubscription(false);
        }
    };

    const toggleSubject = (subject) => {
        if (selectedSubjects.includes(subject)) {
            setSelectedSubjects(prev => prev.filter(s => s !== subject));
            const newCounts = { ...questionCounts };
            delete newCounts[subject];
            setQuestionCounts(newCounts);
        } else {
            setSelectedSubjects(prev => [...prev, subject]);
            setQuestionCounts(prev => ({ ...prev, [subject]: 10 }));
        }
    };

    const handleStartExam = async () => {
        if (selectedSubjects.length === 0) {
            return alert('Please select at least one subject');
        }
        if (!subscriptionStatus?.active) {
            return alert('CBT subscription required. Please subscribe to continue.');
        }

        setLoading(true);
        try {
            const subjects = selectedSubjects.map(name => ({
                name,
                count: questionCounts[name] || 10
            }));

            const res = await api.post('/students/cbt/generate', {
                subjects,
                totalTime,
                difficulty
            }, token);

            navigate('/student/cbt/exam', {
                state: {
                    questions: res.questions,
                    studentName: res.studentName,
                    totalTime: res.totalTime,
                    subjects: res.subjects
                }
            });
        } catch (err) {
            console.error('Exam generation failed:', err);
            alert(err.message || 'Failed to generate exam. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = () => {
        navigate('/student/payment', {
            state: {
                paymentType: 'cbt_subscription',
                amount: CBT_SUBSCRIPTION_PRICE,
                description: 'CBT Practice Subscription'
            }
        });
    };

    const totalQuestions = Object.values(questionCounts).reduce((sum, count) => sum + count, 0);

    if (checkingSubscription) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
                    <p className="text-gray-600">Checking subscription...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        CBT Practice Center
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Practice for JAMB, WAEC, NECO examinations
                    </p>
                </div>

                {/* Subscription Banner */}
                {!subscriptionStatus?.active && (
                    <div className="bg-amber-50 border border-amber-300 rounded p-4 mb-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="text-amber-600" size={20} />
                                <span className="font-medium text-gray-800">Subscription required for unlimited practice</span>
                            </div>
                            <button
                                onClick={handleSubscribe}
                                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-medium flex items-center gap-2 text-sm"
                            >
                                <CreditCard size={16} />
                                Subscribe (₦{CBT_SUBSCRIPTION_PRICE.toLocaleString()})
                            </button>
                        </div>
                    </div>
                )}

                {subscriptionStatus?.active && (
                    <div className="bg-green-50 border border-green-300 rounded p-3 mb-6 flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={18} />
                        <span className="text-green-800 font-medium text-sm">Subscription Active</span>
                    </div>
                )}

                {/* Main Form */}
                <div className="bg-white rounded border border-gray-200 p-5 mb-5">
                    {/* Subject Selection */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <BookOpen className="text-blue-700" size={20} />
                            Select Subjects
                            <span className="text-sm font-normal text-gray-500 ml-auto">
                                {selectedSubjects.length} selected
                            </span>
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {SUBJECTS_LIST.map(subject => (
                                <button
                                    key={subject}
                                    onClick={() => toggleSubject(subject)}
                                    disabled={!subscriptionStatus?.active}
                                    className={`p-2 rounded text-xs font-medium border transition ${selectedSubjects.includes(subject)
                                            ? 'bg-blue-700 text-white border-blue-700'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                        } ${!subscriptionStatus?.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {subject}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question Counts */}
                    {selectedSubjects.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-3">Questions Per Subject</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {selectedSubjects.map(subject => (
                                    <div key={subject} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
                                        <span className="font-medium text-gray-700 text-sm">{subject}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setQuestionCounts({
                                                    ...questionCounts,
                                                    [subject]: Math.max(5, (questionCounts[subject] || 10) - 5)
                                                })}
                                                className="w-7 h-7 bg-white rounded border border-gray-300 font-bold hover:bg-gray-100 text-sm"
                                            >-</button>
                                            <span className="w-8 text-center font-bold text-blue-700 text-sm">
                                                {questionCounts[subject]}
                                            </span>
                                            <button
                                                onClick={() => setQuestionCounts({
                                                    ...questionCounts,
                                                    [subject]: Math.min(50, (questionCounts[subject] || 10) + 5)
                                                })}
                                                className="w-7 h-7 bg-white rounded border border-gray-300 font-bold hover:bg-gray-100 text-sm"
                                            >+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                Total: <span className="font-bold text-blue-700">{totalQuestions}</span> questions
                            </p>
                        </div>
                    )}

                    {/* Difficulty Selection */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Difficulty Level</h2>
                        <div className="flex flex-wrap gap-2">
                            {['Easy', 'Medium', 'Hard', 'Extreme Hard'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    className={`px-4 py-2 rounded text-sm font-medium border transition ${difficulty === level
                                            ? 'bg-blue-700 text-white border-blue-700'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Clock className="text-blue-700" size={20} />
                            Exam Duration
                        </h2>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="20"
                                max="180"
                                step="10"
                                value={totalTime}
                                onChange={(e) => setTotalTime(parseInt(e.target.value))}
                                disabled={!subscriptionStatus?.active}
                                className="flex-1 h-2 bg-gray-200 rounded"
                            />
                            <div className="bg-blue-50 px-4 py-2 rounded border border-blue-200">
                                <span className="text-xl font-bold text-blue-700">{totalTime} min</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedSubjects.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CheckCircle size={18} className="text-green-600" />
                                Exam Summary
                            </h3>
                            <div className="grid grid-cols-4 gap-3 text-center">
                                <div>
                                    <p className="text-xs text-gray-500">Subjects</p>
                                    <p className="text-lg font-bold text-blue-700">{selectedSubjects.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Questions</p>
                                    <p className="text-lg font-bold text-blue-700">{totalQuestions}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Duration</p>
                                    <p className="text-lg font-bold text-blue-700">{totalTime}m</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Difficulty</p>
                                    <p className="text-lg font-bold text-blue-700">{difficulty}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Start Button */}
                    <button
                        onClick={handleStartExam}
                        disabled={selectedSubjects.length === 0 || loading || !subscriptionStatus?.active}
                        className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Preparing...
                            </>
                        ) : (
                            <>
                                <Zap size={20} />
                                START EXAM
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CbtSetup;
