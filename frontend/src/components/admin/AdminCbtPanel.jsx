import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
    BrainCircuit, Plus, Zap, FileText, History, Settings2,
    Loader2, CheckCircle, AlertCircle, Play, Users, Calendar,
    Sliders, Save, RefreshCw, Trash2
} from 'lucide-react';
import { SUBJECTS_LIST } from '../../lib/constants';

const AdminCbtPanel = () => {
    const { token } = useAuthStore();
    const [activeSection, setActiveSection] = useState('manual');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Manual Question Form
    const [manualForm, setManualForm] = useState({
        subject: '', question_text: '', options: ['', '', '', ''],
        correct_option: 0, explanation: '', difficulty: 'Medium', topic: ''
    });

    // AI Generation Form
    const [aiForm, setAiForm] = useState({
        subject: '', count: 10, difficulty: 'Medium'
    });

    // Quiz Creation Form
    const [quizForm, setQuizForm] = useState({
        title: '', subject: '', description: '', questions: []
    });

    // Logs
    const [participationLogs, setParticipationLogs] = useState([]);

    // Settings
    const [cbtSettings, setCbtSettings] = useState({
        ai_ratio: 0, // 0 = all human, 100 = all AI, 50 = 50/50
        allow_student_ai: false
    });

    // Database Questions
    const [dbQuestions, setDbQuestions] = useState([]);
    const [questionStats, setQuestionStats] = useState({});

    useEffect(() => {
        if (activeSection === 'logs') fetchLogs();
        if (activeSection === 'settings') fetchSettings();
    }, [activeSection]);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/schmngt/cbt-logs', token);
            setParticipationLogs(res || []);
        } catch (err) { console.error(err); }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/schmngt/cbt-settings', token);
            if (res) setCbtSettings(res);
        } catch (err) { console.error(err); }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    // --- HANDLERS ---
    const handleManualSubmit = async () => {
        if (!manualForm.subject || !manualForm.question_text || manualForm.options.some(o => !o)) {
            return showMessage('error', 'Please fill all fields');
        }
        setLoading(true);
        try {
            await api.post('/schmngt/cbt-question', manualForm, token);
            showMessage('success', 'Question added successfully!');
            setManualForm({
                subject: '', question_text: '', options: ['', '', '', ''],
                correct_option: 0, explanation: '', difficulty: 'Medium', topic: ''
            });
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!aiForm.subject || aiForm.count < 1) {
            return showMessage('error', 'Select subject and count');
        }
        setLoading(true);
        try {
            const res = await api.post('/schmngt/cbt-bulk-generate', aiForm, token);
            showMessage('success', res.message || `${res.count} questions generated!`);
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuizCreate = async () => {
        if (!quizForm.title || quizForm.questions.length < 5) {
            return showMessage('error', 'Title required & min 5 questions');
        }
        setLoading(true);
        try {
            await api.post('/quiz/create', { ...quizForm, is_public: true }, token);
            showMessage('success', 'Quiz created successfully!');
            setQuizForm({ title: '', subject: '', description: '', questions: [] });
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            await api.post('/schmngt/cbt-settings', cbtSettings, token);
            showMessage('success', 'Settings saved!');
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const addQuestionToQuiz = () => {
        if (quizForm.questions.length >= 50) return;
        setQuizForm({
            ...quizForm,
            questions: [...quizForm.questions, {
                question_text: '', options: ['', '', '', ''], correct_option: 0, explanation: ''
            }]
        });
    };

    const updateQuizQuestion = (idx, field, value) => {
        const updated = [...quizForm.questions];
        updated[idx] = { ...updated[idx], [field]: value };
        setQuizForm({ ...quizForm, questions: updated });
    };

    const sections = [
        { id: 'manual', label: 'Manual Input', icon: Plus },
        { id: 'ai', label: 'AI Generate', icon: BrainCircuit },
        { id: 'quiz', label: 'Create Quiz', icon: Play },
        { id: 'logs', label: 'Participation Logs', icon: History },
        { id: 'settings', label: 'CBT Settings', icon: Settings2 }
    ];

    return (
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-800 p-5 text-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                    <BrainCircuit size={24} />
                    CBT & Quiz Management
                </h2>
                <p className="text-blue-200 text-sm mt-1">Manage questions, generate with AI, and track participation</p>
            </div>

            {/* Section Tabs */}
            <div className="flex border-b overflow-x-auto">
                {sections.map(s => {
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${activeSection === s.id
                                ? 'border-blue-700 text-blue-700 bg-blue-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon size={18} />
                            {s.label}
                        </button>
                    );
                })}
            </div>

            {/* Message */}
            {message.text && (
                <div className={`m-4 p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {/* SECTION 1: Manual Input */}
                {activeSection === 'manual' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg text-slate-800">Add Question Manually</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={manualForm.subject}
                                onChange={e => setManualForm({ ...manualForm, subject: e.target.value })}
                                className="p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                            >
                                <option value="">Select Subject</option>
                                {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select
                                value={manualForm.difficulty}
                                onChange={e => setManualForm({ ...manualForm, difficulty: e.target.value })}
                                className="p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                                <option value="Extreme Hard">Extreme Hard</option>
                            </select>
                        </div>

                        <input
                            value={manualForm.topic}
                            onChange={e => setManualForm({ ...manualForm, topic: e.target.value })}
                            placeholder="Topic (e.g., Algebra, Photosynthesis)"
                            className="w-full p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                        />

                        <textarea
                            value={manualForm.question_text}
                            onChange={e => setManualForm({ ...manualForm, question_text: e.target.value })}
                            placeholder="Question text..."
                            rows={3}
                            className="w-full p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {manualForm.options.map((opt, i) => (
                                <div key={i} className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400 font-bold">{String.fromCharCode(65 + i)}.</span>
                                    <input
                                        value={opt}
                                        onChange={e => {
                                            const opts = [...manualForm.options];
                                            opts[i] = e.target.value;
                                            setManualForm({ ...manualForm, options: opts });
                                        }}
                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                        className={`w-full p-3 pl-10 border-2 rounded-xl outline-none ${manualForm.correct_option === i ? 'border-green-500 bg-green-50' : 'focus:border-indigo-500'
                                            }`}
                                    />
                                    <button
                                        onClick={() => setManualForm({ ...manualForm, correct_option: i })}
                                        className={`absolute right-3 top-3 text-xs font-bold px-2 py-1 rounded ${manualForm.correct_option === i ? 'bg-green-500 text-white' : 'bg-slate-200'
                                            }`}
                                    >
                                        {manualForm.correct_option === i ? '✓ Correct' : 'Mark'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <textarea
                            value={manualForm.explanation}
                            onChange={e => setManualForm({ ...manualForm, explanation: e.target.value })}
                            placeholder="Explanation (optional)..."
                            rows={2}
                            className="w-full p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                        />

                        <button
                            onClick={handleManualSubmit}
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                            Add Question to Database
                        </button>
                    </div>
                )}

                {/* SECTION 2: AI Generate */}
                {activeSection === 'ai' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg text-slate-800">Generate Questions with AI</h3>
                        <p className="text-sm text-slate-500">AI will generate JAMB-standard questions and save them to the database</p>

                        <div className="grid grid-cols-3 gap-4">
                            <select
                                value={aiForm.subject}
                                onChange={e => setAiForm({ ...aiForm, subject: e.target.value })}
                                className="p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                            >
                                <option value="">Select Subject</option>
                                {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input
                                type="number"
                                value={aiForm.count}
                                onChange={e => setAiForm({ ...aiForm, count: parseInt(e.target.value) || 1 })}
                                min={1}
                                max={100}
                                className="p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                                placeholder="Count"
                            />
                            <select
                                value={aiForm.difficulty}
                                onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })}
                                className="p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                                <option value="Extreme Hard">Extreme Hard</option>
                            </select>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                            <p className="text-amber-800 text-sm">
                                <strong>Note:</strong> Generated questions are saved to the database and become available for all students.
                                Questions are checked for duplicates before saving.
                            </p>
                        </div>

                        <button
                            onClick={handleAIGenerate}
                            disabled={loading}
                            className="w-full py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                            {loading ? 'Generating...' : `Generate ${aiForm.count} Questions`}
                        </button>
                    </div>
                )}

                {/* SECTION 3: Create Quiz */}
                {activeSection === 'quiz' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg text-slate-800">Create New Quiz</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                value={quizForm.title}
                                onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                                placeholder="Quiz Title"
                                className="p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                            />
                            <select
                                value={quizForm.subject}
                                onChange={e => setQuizForm({ ...quizForm, subject: e.target.value })}
                                className="p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                            >
                                <option value="">Select Subject</option>
                                {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <textarea
                            value={quizForm.description}
                            onChange={e => setQuizForm({ ...quizForm, description: e.target.value })}
                            placeholder="Quiz description..."
                            rows={2}
                            className="w-full p-3 border-2 rounded-xl focus:border-indigo-500 outline-none"
                        />

                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">Questions ({quizForm.questions.length}/50)</span>
                            <button onClick={addQuestionToQuiz} className="text-indigo-600 font-bold text-sm hover:underline">+ Add Question</button>
                        </div>

                        {quizForm.questions.map((q, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-xl border space-y-3">
                                <div className="flex justify-between">
                                    <span className="font-bold text-slate-600">Q{idx + 1}</span>
                                    <button onClick={() => {
                                        const qs = quizForm.questions.filter((_, i) => i !== idx);
                                        setQuizForm({ ...quizForm, questions: qs });
                                    }} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                                </div>
                                <input
                                    value={q.question_text}
                                    onChange={e => updateQuizQuestion(idx, 'question_text', e.target.value)}
                                    placeholder="Question text"
                                    className="w-full p-2 border rounded-lg"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oi) => (
                                        <input
                                            key={oi}
                                            value={opt}
                                            onChange={e => {
                                                const opts = [...q.options];
                                                opts[oi] = e.target.value;
                                                updateQuizQuestion(idx, 'options', opts);
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                            className={`p-2 border rounded-lg ${q.correct_option === oi ? 'border-green-500' : ''}`}
                                        />
                                    ))}
                                </div>
                                <select
                                    value={q.correct_option}
                                    onChange={e => updateQuizQuestion(idx, 'correct_option', parseInt(e.target.value))}
                                    className="p-2 border rounded-lg"
                                >
                                    {['A', 'B', 'C', 'D'].map((l, i) => <option key={i} value={i}>Correct: {l}</option>)}
                                </select>
                            </div>
                        ))}

                        <button
                            onClick={handleQuizCreate}
                            disabled={loading || quizForm.questions.length < 5}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                            Create & Publish Quiz
                        </button>
                    </div>
                )}

                {/* SECTION 4: Participation Logs */}
                {activeSection === 'logs' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Participation Logs</h3>
                            <button onClick={fetchLogs} className="text-indigo-600 hover:text-indigo-800">
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="p-3 text-left">Name</th>
                                        <th className="p-3 text-left">ID</th>
                                        <th className="p-3 text-left">Type</th>
                                        <th className="p-3 text-left">Subject</th>
                                        <th className="p-3 text-left">Score</th>
                                        <th className="p-3 text-left">Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {participationLogs.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No logs found</td></tr>
                                    ) : participationLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 font-medium">{log.student_name || log.user_name}</td>
                                            <td className="p-3 text-slate-500">{log.student_id || log.user_id}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.type === 'cbt' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>{log.type?.toUpperCase()}</span>
                                            </td>
                                            <td className="p-3">{log.subject}</td>
                                            <td className="p-3 font-bold">{log.score}%</td>
                                            <td className="p-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SECTION 5: CBT Settings */}
                {activeSection === 'settings' && (
                    <div className="space-y-6">
                        <h3 className="font-bold text-lg text-slate-800">CBT Question Settings</h3>

                        <div className="bg-slate-50 p-6 rounded-xl space-y-6">
                            <div>
                                <label className="block font-bold text-slate-700 mb-2">AI vs Human Ratio</label>
                                <p className="text-sm text-slate-500 mb-4">Control the proportion of AI-generated vs manually-added questions in CBT exams</p>

                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-slate-600 w-20">Human</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={cbtSettings.ai_ratio}
                                        onChange={e => setCbtSettings({ ...cbtSettings, ai_ratio: parseInt(e.target.value) })}
                                        className="flex-1 h-3 rounded-full appearance-none bg-gradient-to-r from-blue-500 to-purple-500"
                                    />
                                    <span className="text-sm font-bold text-slate-600 w-20 text-right">AI</span>
                                </div>

                                <div className="text-center mt-4">
                                    <span className="text-2xl font-black text-indigo-600">{100 - cbtSettings.ai_ratio}% Human / {cbtSettings.ai_ratio}% AI</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={cbtSettings.allow_student_ai}
                                        onChange={e => setCbtSettings({ ...cbtSettings, allow_student_ai: e.target.checked })}
                                        className="w-5 h-5 rounded"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-700">Allow Student AI Questions</span>
                                        <p className="text-sm text-slate-500">If enabled, students can receive AI-generated questions (not recommended)</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Settings
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCbtPanel;
