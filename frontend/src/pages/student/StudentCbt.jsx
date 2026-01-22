import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
    BrainCircuit, Clock, Calculator, ChevronRight, ChevronLeft,
    CheckCircle, XCircle, AlertTriangle, Send, Share2, Award,
    BookOpen, Layers, Zap
} from 'lucide-react';

const SUBJECTS = [
    "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
    "Government", "Economics", "Literature-in-English", "CRS",
    "Geography", "Civic Education", "Data Processing", "Marketing"
];

const StudentCbt = () => {
    const { user, token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    // --- MODES: 'setup', 'test', 'result' ---
    const [mode, setMode] = useState('setup');

    // --- SETUP STATE ---
    const [config, setConfig] = useState({
        subjects: [],
        topics: '',
        count: 10,
        time: 15, // Minutes
        difficulty: 'Medium'
    });

    // --- TEST STATE ---
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { qIndex: optionIndex }
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const timerRef = useRef(null);

    // --- RESULT STATE ---
    const [score, setScore] = useState(0);

    // --- HANDLERS ---
    const toggleSubject = (sub) => {
        setConfig(prev => {
            const exists = prev.subjects.includes(sub);
            if (exists) return { ...prev, subjects: prev.subjects.filter(s => s !== sub) };
            return { ...prev, subjects: [...prev.subjects, sub] };
        });
    };

    // Check Subscription on Mount
    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const res = await api.get('/students/profile/' + user.id, token);
            const isActive = res.student?.cbt_subscription_active;
            const expires = res.student?.cbt_subscription_expires;

            setSubscriptionStatus({
                active: isActive && (!expires || new Date(expires) > new Date()),
                expires
            });
        } catch (err) {
            console.error('Subscription check failed:', err);
        }
    };

    const startTest = async () => {
        if (config.subjects.length === 0) return alert("Select at least one subject!");

        // Check Subscription (Mock for now, or check user field)
        // if (!user.cbt_subscription_active) return alert("Please subscribe to access CBT Practice.");

        setLoading(true);
        try {
            // Call AI Generation Endpoint
            const res = await api.post('/students/cbt/generate', {
                subjects: config.subjects,
                topic: config.topics,
                difficulty: config.difficulty,
                count: config.count
            }, token);

            if (!res || res.length === 0) throw new Error("No questions generated. Try again.");

            setQuestions(res);
            setTimeLeft(config.time * 60);
            setAnswers({});
            setCurrentQIndex(0);
            setMode('test');
        } catch (err) {
            console.error(err);
            alert("Failed to generate test. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const submitTest = async () => {
        clearInterval(timerRef.current);

        // Calculate Score
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correct_option) correctCount++;
        });

        setScore(correctCount);
        setMode('result');

        // Optionally log to history
        // await api.post('/student/cbt/log', { score: correctCount, total: questions.length, ... }, token);
    };

    // --- TIMER EFFECT ---
    useEffect(() => {
        if (mode === 'test' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        submitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [mode, timeLeft]);

    // --- HELPER RENDERS ---
    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- CALCULATOR COMPONENT ---
    const SimpleCalc = () => {
        const [disp, setDisp] = useState("");
        const btn = (v) => <button onClick={() => setDisp(d => d + v)} className="p-3 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold">{v}</button>;
        const evalCalc = () => {
            try {
                // eslint-disable-next-line no-new-func
                setDisp(new Function('return ' + disp)().toString());
            } catch {
                setDisp("Error");
            }
        };

        return (
            <div className="absolute top-20 right-4 w-64 bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-600 z-50 animate-fadeIn">
                <div className="mb-3 bg-slate-900 p-3 text-right text-emerald-400 font-mono text-xl rounded">{disp || "0"}</div>
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => setDisp("")} className="col-span-2 p-2 bg-red-600 rounded text-white font-bold">C</button>
                    <button onClick={() => setDisp(d => d.slice(0, -1))} className="col-span-2 p-2 bg-orange-600 rounded text-white font-bold">DEL</button>
                    {btn("7")}{btn("8")}{btn("9")}{btn("/")}
                    {btn("4")}{btn("5")}{btn("6")}{btn("*")}
                    {btn("1")}{btn("2")}{btn("3")}{btn("-")}
                    {btn("0")}{btn(".")}<button onClick={evalCalc} className="p-2 bg-green-600 rounded text-white font-bold">=</button>{btn("+")}
                </div>
                <button onClick={() => setIsCalculatorOpen(false)} className="mt-4 w-full py-1 text-xs text-slate-400 hover:text-white">Close Calculator</button>
            </div>
        );
    };

    // --- RENDER SETUP ---
    if (mode === 'setup') return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center font-sans">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-white relative overflow-hidden">
                    <BrainCircuit className="absolute -right-10 -bottom-10 opacity-10 w-64 h-64" />
                    <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                        <Zap className="text-yellow-400 fill-yellow-400" /> CBT Practice
                    </h1>
                    <p className="text-blue-100 font-medium max-w-lg">Master your subjects with our intelligent testing engine. Unlimited questions, instant corrections.</p>
                </div>

                <div className="p-8 space-y-8">
                    {/* SUBJECT SELECTION */}
                    <div>
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 block">1. Select Subjects (Max 4)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {SUBJECTS.map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => toggleSubject(sub)}
                                    disabled={!config.subjects.includes(sub) && config.subjects.length >= 4}
                                    className={`p-3 rounded-xl text-sm font-bold transition-all border ${config.subjects.includes(sub)
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                                        }`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* TOPIC */}
                        <div>
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">2. Focus Topic (Optional)</label>
                            <input
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Algebra, Motion"
                                value={config.topics}
                                onChange={e => setConfig({ ...config, topics: e.target.value })}
                            />
                        </div>
                        {/* COUNT */}
                        <div>
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">3. Question Count</label>
                            <select
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                                value={config.count}
                                onChange={e => setConfig({ ...config, count: parseInt(e.target.value) })}
                            >
                                <option value="10">10 Questions</option>
                                <option value="20">20 Questions</option>
                                <option value="40">40 Questions (Full)</option>
                                <option value="5">5 Quick Fire</option>
                            </select>
                        </div>
                        {/* TIME */}
                        <div>
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">4. Duration</label>
                            <select
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                                value={config.time}
                                onChange={e => setConfig({ ...config, time: parseInt(e.target.value) })}
                            >
                                <option value="10">10 Minutes</option>
                                <option value="20">20 Minutes</option>
                                <option value="30">30 Minutes</option>
                                <option value="60">1 Hour</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={startTest}
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl font-black text-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {loading ? 'Preparing Questions...' : 'START EXAM NOW'} <ChevronRight />
                    </button>

                </div>
            </div>
        </div>
    );

    // --- RENDER TEST ---
    const currentQ = questions[currentQIndex];

    if (mode === 'test') return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans relative">
            {/* HEADER */}
            <header className="bg-white px-6 py-4 shadow-sm flex sticky top-0 z-20 justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 px-4 py-2 rounded-xl font-black text-slate-700 border border-slate-200">
                        Q{currentQIndex + 1}<span className="text-slate-400 font-medium text-sm">/{questions.length}</span>
                    </div>
                    <span className="font-bold text-slate-500 text-sm hidden sm:block">{currentQ.subject}</span>
                </div>

                <div className={`font-mono text-2xl font-black tracking-widest ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setIsCalculatorOpen(!isCalculatorOpen)} className={`p-3 rounded-xl transition ${isCalculatorOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-200'}`}>
                        <Calculator size={20} />
                    </button>
                    <button onClick={submitTest} className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-red-200 shadow-lg">
                        Submit
                    </button>
                </div>
            </header>

            {/* CALCULATOR */}
            {isCalculatorOpen && <SimpleCalc />}

            {/* QUESTION AREA */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed mb-8">
                        {currentQ.question_text}
                    </h2>

                    <div className="space-y-4">
                        {/* Options are usually generated as array strings or objects. API returns strings based on my previous code. */}
                        {currentQ.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => setAnswers({ ...answers, [currentQIndex]: idx })}
                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${answers[currentQIndex] === idx
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                    : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                                    }`}
                            >
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${answers[currentQIndex] === idx ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200 group-hover:border-blue-300'
                                    }`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className={`font-medium text-lg ${answers[currentQIndex] === idx ? 'text-blue-900' : 'text-slate-600'}`}>
                                    {opt}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* NAVIGATOR */}
                <div className="mt-8 grid grid-cols-5 sm:grid-cols-10 gap-2 mb-8">
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentQIndex(idx)}
                            className={`py-2 rounded-lg font-bold text-xs transition ${currentQIndex === idx ? 'bg-blue-600 text-white transform scale-110 shadow-lg' :
                                answers[idx] !== undefined ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-300'
                                }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </main>

            <footer className="bg-white p-4 flex justify-between fixed bottom-0 w-full border-t border-slate-100 md:hidden">
                <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(c => c - 1)} className="p-4 bg-slate-100 rounded-xl disabled:opacity-50"><ChevronLeft /></button>
                <button disabled={currentQIndex === questions.length - 1} onClick={() => setCurrentQIndex(c => c + 1)} className="p-4 bg-slate-900 text-white rounded-xl disabled:opacity-50"><ChevronRight /></button>
            </footer>
        </div>
    );

    // --- RENDER RESULT ---
    if (mode === 'result') return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    <div className="mb-4 inline-flex p-4 bg-yellow-50 rounded-full text-yellow-600 mb-6">
                        <Award size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">
                        {Math.round((score / questions.length) * 100)}%
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">You scored <span className="text-blue-600 font-bold">{score}</span> out of <span className="text-slate-900 font-bold">{questions.length}</span></p>

                    <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
                        Take Another Test
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2"><BookOpen size={20} /> Corrections & Explanations</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {questions.map((q, idx) => {
                            const isCorrect = answers[idx] === q.correct_option;
                            return (
                                <div key={idx} className="p-8 hover:bg-slate-50 transition">
                                    <div className="flex gap-4 mb-4">
                                        <span className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg mb-4">{q.question_text}</p>
                                            <div className="grid gap-3">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className={`p-3 rounded-lg border flex items-center gap-3 text-sm ${oIdx === q.correct_option ? 'bg-green-50 border-green-200 text-green-900 font-bold' :
                                                        (answers[idx] === oIdx && !isCorrect) ? 'bg-red-50 border-red-200 text-red-900' : 'border-transparent text-slate-500'
                                                        }`}>
                                                        {oIdx === q.correct_option && <CheckCircle size={16} className="text-green-600" />}
                                                        {answers[idx] === oIdx && !isCorrect && <XCircle size={16} className="text-red-500" />}
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                            {q.explanation && (
                                                <div className="mt-4 p-4 bg-blue-50 rounded-xl text-blue-800 text-sm font-medium flex gap-3 items-start">
                                                    <Zap size={16} className="mt-0.5 flex-shrink-0" /> {q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StudentCbt;
