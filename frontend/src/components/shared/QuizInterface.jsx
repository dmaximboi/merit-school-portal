import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, BrainCircuit, Loader2, Eye, EyeOff } from 'lucide-react';
import { SUBJECTS_LIST } from '../../lib/constants';

const QuizInterface = ({ user, token }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Create Form State
    const [newQuiz, setNewQuiz] = useState({
        title: '',
        subject: 'General',
        subject: 'General',
        duration: 30, // Default 30 mins
        is_public: true,
        questionsJson: ''
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            // Currently only fetches public quizzes. 
            // Ideally should have /quizzes/my-created or similar.
            const data = await api.get('/quizzes/public', token);
            setQuizzes(data || []);
            setLoading(false);
        } catch (err) {
            console.error("Quiz Fetch Error:", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            let questions = [];
            try {
                questions = JSON.parse(newQuiz.questionsJson);
            } catch (e) {
                alert("Invalid JSON for questions. Use AI generator or check syntax.");
                setCreating(false);
                return;
            }

            await api.post('/quizzes/create', {
                title: newQuiz.title,
                subject: newQuiz.subject,
                subject: newQuiz.subject,
                duration: parseInt(newQuiz.duration), // Send duration
                is_public: newQuiz.is_public,
                questions
            }, token);

            alert("Quiz Created Successfully!");
            setShowCreate(false);
            setNewQuiz({ title: '', subject: 'General', is_public: true, questionsJson: '' });
            fetchQuizzes();

        } catch (err) {
            alert("Failed to create quiz: " + err.message);
        } finally {
            setCreating(false);
        }
    };



    const generateAiQuestions = async () => {
        if (!newQuiz.subject) return alert("Please select a subject first.");
        const count = prompt("How many questions (1-20)?", "10");
        if (!count) return;

        setCreating(true);
        try {
            const data = await api.post('/schmngt/cbt/generate', {
                subjects: [newQuiz.subject],
                topics: ["General"],
                count: parseInt(count),
                difficulty: 'Medium'
            }, token);

            setNewQuiz(prev => ({ ...prev, questionsJson: JSON.stringify(data, null, 2) }));
        } catch (err) {
            alert("Generation Failed: " + err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="font-bold text-xl flex items-center gap-2 text-slate-800"><BrainCircuit className="text-pink-600" /> Quiz Manager</h2>
                    <p className="text-slate-500 text-sm">Create and manage CBT assessments.</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition">
                    {showCreate ? 'Cancel' : <><Plus size={20} /> Create New Quiz</>}
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-pink-100 animate-fadeIn">
                    <h3 className="font-bold text-lg mb-4">Create New Assessment</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Quiz Title</label>
                                <input className="input-field w-full" placeholder="e.g. Biology Mid-Term" value={newQuiz.title} onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })} required />
                            </div>
                            <div>
                                <label className="label-text">Subject</label>
                                <select className="input-field w-full" value={newQuiz.subject} onChange={e => setNewQuiz({ ...newQuiz, subject: e.target.value })} required>
                                    <option value="">Select Subject</option>
                                    {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-text">Duration (Minutes)</label>
                                <input type="number" className="input-field w-full" min="5" value={newQuiz.duration} onChange={e => setNewQuiz({ ...newQuiz, duration: e.target.value })} required />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="label-text">Questions JSON</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={generateAiQuestions} className="text-pink-600 text-xs font-bold border border-pink-200 px-2 py-1 rounded hover:bg-pink-50 flex items-center gap-1">
                                        <BrainCircuit size={12} /> Auto-Generate with AI
                                    </button>
                                    <a href="https://jsoneditoronline.org/" target="_blank" rel="noreferrer" className="text-slate-400 text-xs hover:underline">JSON Helper</a>
                                </div>
                            </div>
                            <textarea
                                className="input-field w-full h-40 font-mono text-xs"
                                placeholder='[{"question_text": "...", "options": ["A","B"], "correct_option": 0}]'
                                value={newQuiz.questionsJson}
                                onChange={e => setNewQuiz({ ...newQuiz, questionsJson: e.target.value })}
                                required
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Format: Array of objects with question_text, options (array), correct_option (index).</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={newQuiz.is_public} onChange={e => setNewQuiz({ ...newQuiz, is_public: e.target.checked })} className="toggle toggle-pink" />
                            <span className="text-sm font-bold text-slate-600">Public (Visible to Students)</span>
                        </div>

                        <button type="submit" disabled={creating} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
                            {creating ? <Loader2 className="animate-spin mx-auto" /> : 'Publish Quiz'}
                        </button>
                    </form>
                </div>
            )}

            {/* Quiz List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <Loader2 className="animate-spin text-pink-600 w-10 h-10 col-span-full mx-auto" /> : quizzes.length === 0 ? <p className="col-span-full text-center text-slate-400 py-10">No quizzes found.</p> :
                    quizzes.map(q => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-pink-200 transition group relative">
                            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-pink-400 cursor-pointer">
                                {/* Placeholder for Delete if owner */}
                                <Trash2 size={16} />
                            </div>
                            <h4 className="font-bold text-lg text-slate-800 pr-8">{q.title}</h4>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 mt-2 inline-block font-mono">{q.subject}</span>
                            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                                <span>{new Date(q.created_at).toLocaleDateString()}</span>
                                <span className={`flex items-center gap-1 ${q.is_public ? 'text-green-500' : 'text-orange-500'}`}>
                                    {q.is_public ? <Eye size={12} /> : <EyeOff size={12} />} {q.is_public ? 'Public' : 'Hidden'}
                                </span>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default QuizInterface;
